-- Compartilhar o dossiê com UM advogado escolhido pelo trabalhador.
-- Princípios: cópia fixa (snapshot) do momento do envio, validade de 30 dias, revogável a qualquer hora.
-- Revogar apaga a cópia. Ninguém além do dono e do advogado escolhido lê; o acesso do advogado é só por funções.
create table if not exists public.dossier_shares (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates (id) on delete cascade,
  lawyer_id uuid not null references public.lawyers (id) on delete cascade,
  lawyer_name text not null,
  worker_name text not null,
  contact_kind text check (contact_kind in ('whatsapp', 'email')),
  contact_value text check (char_length(contact_value) between 5 and 120),
  snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '30 days',
  revoked_at timestamptz,
  first_viewed_at timestamptz,
  last_viewed_at timestamptz,
  renewal_requested_at timestamptz,
  check ((contact_kind is null) = (contact_value is null))
);

alter table public.dossier_shares enable row level security;

create index if not exists dossier_shares_candidate_idx on public.dossier_shares (candidate_id);
create index if not exists dossier_shares_lawyer_idx on public.dossier_shares (lawyer_id);

-- O trabalhador vê e apaga os próprios compartilhamentos. Criar e alterar só pelas funções abaixo.
drop policy if exists "shares: dono lê" on public.dossier_shares;
create policy "shares: dono lê" on public.dossier_shares
  for select to authenticated using (candidate_id = auth.uid());
drop policy if exists "shares: dono apaga" on public.dossier_shares;
create policy "shares: dono apaga" on public.dossier_shares
  for delete to authenticated using (candidate_id = auth.uid());

-- Compartilha uma cópia do dossiê atual com um advogado verificado que está aceitando casos.
create or replace function public.share_dossier(p_lawyer uuid, p_contact_kind text, p_contact_value text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  wname text;
  lname text;
  facts jsonb;
  notes text;
  kind text := nullif(btrim(coalesce(p_contact_kind, '')), '');
  val text := nullif(btrim(coalesce(p_contact_value, '')), '');
  new_id uuid;
begin
  if uid is null then raise exception 'not authenticated'; end if;
  select full_name into wname from public.candidates where id = uid;
  if wname is null then raise exception 'not a candidate'; end if;

  select full_name into lname from public.lawyers
   where id = p_lawyer and verification_status = 'verified' and accepting and suspended_at is null;
  if lname is null then raise exception 'lawyer unavailable'; end if;

  select coalesce(jsonb_agg(jsonb_build_object(
           'happened_on', happened_on, 'place', place, 'who', who,
           'what', what, 'evidence', evidence, 'witnesses', witnesses)
         order by happened_on nulls last, created_at), '[]'::jsonb)
    into facts from public.report_facts where candidate_id = uid;
  select body into notes from public.confidential_reports where candidate_id = uid;
  if jsonb_array_length(facts) = 0 and notes is null then raise exception 'empty dossier'; end if;

  if exists (select 1 from public.dossier_shares
              where candidate_id = uid and lawyer_id = p_lawyer and revoked_at is null and expires_at > now()) then
    raise exception 'already shared';
  end if;
  if (select count(*) from public.dossier_shares
       where candidate_id = uid and revoked_at is null and expires_at > now()) >= 5 then
    raise exception 'too many shares';
  end if;

  if (kind is null) <> (val is null) then raise exception 'invalid contact'; end if;
  if kind is not null and kind not in ('whatsapp', 'email') then raise exception 'invalid contact'; end if;

  insert into public.dossier_shares (candidate_id, lawyer_id, lawyer_name, worker_name, contact_kind, contact_value, snapshot)
  values (uid, p_lawyer, lname, wname, kind, val, jsonb_build_object('facts', facts, 'notes', notes))
  returning id into new_id;

  insert into public.consent_events (user_id, kind, granted) values (uid, 'dossie_compartilhado', true);
  return new_id;
end;
$$;

-- Revoga e APAGA a cópia: o advogado perde o acesso e o conteúdo some do banco.
create or replace function public.revoke_dossier_share(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare n int;
begin
  update public.dossier_shares
     set revoked_at = now(), snapshot = '{}'::jsonb, contact_kind = null, contact_value = null, worker_name = ''
   where id = p_id and candidate_id = auth.uid() and revoked_at is null;
  get diagnostics n = row_count;
  if n > 0 then
    insert into public.consent_events (user_id, kind, granted) values (auth.uid(), 'dossie_compartilhado', false);
  end if;
  return n > 0;
end;
$$;

-- Estende a validade por mais 30 dias (a cópia continua a mesma).
create or replace function public.renew_dossier_share(p_id uuid)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare new_exp timestamptz;
begin
  update public.dossier_shares
     set expires_at = now() + interval '30 days', renewal_requested_at = null
   where id = p_id and candidate_id = auth.uid() and revoked_at is null
  returning expires_at into new_exp;
  return new_exp;
end;
$$;

-- Lista do advogado: sem o conteúdo. Nome e contato só enquanto o acesso vale.
create or replace function public.lawyer_dossiers()
returns table (
  id uuid, created_at timestamptz, expires_at timestamptz, active boolean,
  worker_name text, contact_kind text, contact_value text,
  first_viewed_at timestamptz, renewal_requested_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select s.id, s.created_at, s.expires_at, s.expires_at > now(),
         case when s.expires_at > now() then s.worker_name end,
         case when s.expires_at > now() then s.contact_kind end,
         case when s.expires_at > now() then s.contact_value end,
         s.first_viewed_at, s.renewal_requested_at
    from public.dossier_shares s
   where s.lawyer_id = auth.uid()
     and s.revoked_at is null
     and s.expires_at > now() - interval '90 days'
     and exists (select 1 from public.lawyers l
                  where l.id = auth.uid() and l.verification_status = 'verified' and l.suspended_at is null)
   order by s.created_at desc;
$$;

-- Abre um dossiê (marca como visto). Só enquanto o acesso vale.
create or replace function public.lawyer_open_dossier(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare r public.dossier_shares;
begin
  select s.* into r from public.dossier_shares s
   where s.id = p_id and s.lawyer_id = auth.uid() and s.revoked_at is null and s.expires_at > now()
     and exists (select 1 from public.lawyers l
                  where l.id = auth.uid() and l.verification_status = 'verified' and l.suspended_at is null);
  if not found then return null; end if;
  update public.dossier_shares
     set first_viewed_at = coalesce(first_viewed_at, now()), last_viewed_at = now()
   where id = r.id;
  return jsonb_build_object(
    'worker_name', r.worker_name, 'contact_kind', r.contact_kind, 'contact_value', r.contact_value,
    'created_at', r.created_at, 'expires_at', r.expires_at, 'snapshot', r.snapshot);
end;
$$;

-- O advogado pede renovação (na última semana de validade ou depois de vencer). Quem decide é o trabalhador.
create or replace function public.lawyer_request_renewal(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare n int;
begin
  update public.dossier_shares
     set renewal_requested_at = now()
   where id = p_id and lawyer_id = auth.uid() and revoked_at is null
     and expires_at < now() + interval '7 days'
     and exists (select 1 from public.lawyers l
                  where l.id = auth.uid() and l.verification_status = 'verified' and l.suspended_at is null);
  get diagnostics n = row_count;
  return n > 0;
end;
$$;

revoke execute on function public.share_dossier(uuid, text, text) from public, anon;
revoke execute on function public.revoke_dossier_share(uuid) from public, anon;
revoke execute on function public.renew_dossier_share(uuid) from public, anon;
revoke execute on function public.lawyer_dossiers() from public, anon;
revoke execute on function public.lawyer_open_dossier(uuid) from public, anon;
revoke execute on function public.lawyer_request_renewal(uuid) from public, anon;
grant execute on function public.share_dossier(uuid, text, text) to authenticated;
grant execute on function public.revoke_dossier_share(uuid) to authenticated;
grant execute on function public.renew_dossier_share(uuid) to authenticated;
grant execute on function public.lawyer_dossiers() to authenticated;
grant execute on function public.lawyer_open_dossier(uuid) to authenticated;
grant execute on function public.lawyer_request_renewal(uuid) to authenticated;
