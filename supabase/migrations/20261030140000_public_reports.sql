-- ============================================================================
-- Relatos anônimos (/relatos)
-- Princípios:
--   * Sem conta e sem identificação: a tabela não guarda IP, e-mail, nome nem vínculo com usuário.
--   * Todo relato passa por aprovação manual antes de aparecer.
--   * O limite de envios usa só um identificador temporário (hash), em tabela à parte,
--     sem ligação com o relato, apagado em 24 horas.
-- ============================================================================

create table public.public_reports (
  id uuid primary key default gen_random_uuid(),
  story text not null check (char_length(story) between 30 and 1500),
  topic text not null check (char_length(topic) between 2 and 60),
  city text check (char_length(city) <= 80),
  state char(2),
  status text not null default 'pending' check (status in ('pending', 'approved')),
  flags int not null default 0,
  created_at timestamptz not null default now(),
  approved_at timestamptz
);
alter table public.public_reports enable row level security;
create index on public.public_reports (status, created_at);

-- Controle de abuso. Sem políticas: só as funções abaixo mexem aqui.
create table public.report_throttle (
  bucket text not null,
  kind text not null,
  created_at timestamptz not null default now()
);
alter table public.report_throttle enable row level security;
create index on public.report_throttle (bucket, kind, created_at);

-- Uma denúncia por identificador e relato
create table public.report_flags (
  report_id uuid not null references public.public_reports (id) on delete cascade,
  bucket text not null,
  primary key (report_id, bucket)
);
alter table public.report_flags enable row level security;

-- Só admins leem e moderam diretamente
create policy "public_reports: admin lê" on public.public_reports
  for select to authenticated using (public.is_admin());
create policy "public_reports: admin edita" on public.public_reports
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "public_reports: admin apaga" on public.public_reports
  for delete to authenticated using (public.is_admin());

-- Envio sem conta, com limite por identificador temporário e limite geral
create or replace function public.submit_public_report(
  p_story text,
  p_topic text,
  p_city text,
  p_state text,
  p_bucket text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.report_throttle where created_at < now() - interval '1 day';

  if coalesce(p_bucket, '') = '' then
    raise exception 'invalid';
  end if;
  if (select count(*) from public.report_throttle
       where bucket = p_bucket and kind = 'submit' and created_at > now() - interval '1 hour') >= 2 then
    raise exception 'rate_limit';
  end if;
  if (select count(*) from public.public_reports
       where status = 'pending' and created_at > now() - interval '1 hour') >= 60 then
    raise exception 'busy';
  end if;

  insert into public.public_reports (story, topic, city, state)
  values (btrim(p_story), btrim(p_topic), nullif(btrim(coalesce(p_city, '')), ''), nullif(btrim(coalesce(p_state, '')), ''));

  insert into public.report_throttle (bucket, kind) values (p_bucket, 'submit');
  return true;
end;
$$;

-- Denunciar um relato já publicado (sinaliza para a equipe revisar)
create or replace function public.flag_public_report(p_id uuid, p_bucket text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  added int;
begin
  if coalesce(p_bucket, '') = '' then
    raise exception 'invalid';
  end if;
  if (select count(*) from public.report_throttle
       where bucket = p_bucket and kind = 'flag' and created_at > now() - interval '1 hour') >= 10 then
    raise exception 'rate_limit';
  end if;
  if not exists (select 1 from public.public_reports where id = p_id and status = 'approved') then
    return false;
  end if;

  insert into public.report_flags (report_id, bucket) values (p_id, p_bucket) on conflict do nothing;
  get diagnostics added = row_count;
  if added > 0 then
    update public.public_reports set flags = flags + 1 where id = p_id;
  end if;
  insert into public.report_throttle (bucket, kind) values (p_bucket, 'flag');
  return true;
end;
$$;

-- Vitrine pública: só relatos aprovados, só o mês (sem hora exata)
create view public.reports_public as
  select r.id, r.story, r.topic, r.city, r.state, date_trunc('month', r.approved_at) as month
  from public.public_reports r
  where r.status = 'approved';
comment on view public.reports_public is
  'Somente relatos aprovados, com o mês da aprovação. Roda com os privilégios do dono de propósito.';

grant select on public.reports_public to anon, authenticated;
grant execute on function public.submit_public_report(text, text, text, text, text) to anon, authenticated;
grant execute on function public.flag_public_report(uuid, text) to anon, authenticated;
