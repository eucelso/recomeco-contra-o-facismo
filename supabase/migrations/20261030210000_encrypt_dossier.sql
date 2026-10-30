-- Dossiê criptografado: o banco passa a guardar só texto cifrado (AES-256-GCM feito no servidor do site).
-- A chave NÃO fica no banco. Quem lê/escreve o conteúdo é o servidor; o banco continua decidindo QUEM pode.
-- ATENÇÃO: recria report_facts e dossier_shares (eram só de teste). Apaga os fatos e compartilhamentos existentes.
set lock_timeout = '5s';

drop function if exists public.share_dossier(uuid, text, text);
drop function if exists public.lawyer_dossiers();
drop function if exists public.lawyer_open_dossier(uuid);
drop table if exists public.dossier_shares;
drop table if exists public.report_facts;

-- Fatos: um único campo cifrado por registro (data, local, quem, o que, provas, testemunhas).
create table public.report_facts (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates (id) on delete cascade,
  data_enc text not null check (char_length(data_enc) between 20 and 12000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.report_facts enable row level security;
create index report_facts_candidate_idx on public.report_facts (candidate_id);
create trigger report_facts_touch before update on public.report_facts
  for each row execute function public.touch_updated_at();
create policy "facts: só o dono" on public.report_facts
  for all to authenticated using (candidate_id = auth.uid()) with check (candidate_id = auth.uid());

-- Texto livre: a coluna body passa a receber texto cifrado (mais longo que o original).
alter table public.confidential_reports drop constraint if exists confidential_reports_body_check;
alter table public.confidential_reports add constraint confidential_reports_body_len check (char_length(body) between 1 and 12000);

-- Compartilhamentos: nome do trabalhador, contato e cópia do dossiê ficam dentro de payload_enc.
create table public.dossier_shares (
  id uuid primary key,
  candidate_id uuid not null references public.candidates (id) on delete cascade,
  lawyer_id uuid not null references public.lawyers (id) on delete cascade,
  lawyer_name text not null,
  has_contact boolean not null default false,
  payload_enc text check (payload_enc is null or char_length(payload_enc) <= 400000),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '30 days',
  revoked_at timestamptz,
  first_viewed_at timestamptz,
  last_viewed_at timestamptz,
  renewal_requested_at timestamptz
);
alter table public.dossier_shares enable row level security;
create index dossier_shares_candidate_idx on public.dossier_shares (candidate_id);
create index dossier_shares_lawyer_idx on public.dossier_shares (lawyer_id);
create policy "shares: dono lê" on public.dossier_shares for select to authenticated using (candidate_id = auth.uid());
create policy "shares: dono apaga" on public.dossier_shares for delete to authenticated using (candidate_id = auth.uid());

-- Cria o compartilhamento. O conteúdo (já cifrado pelo servidor) vem pronto; aqui só se decide se pode.
create or replace function public.create_dossier_share(p_id uuid, p_lawyer uuid, p_has_contact boolean, p_payload text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  lname text;
begin
  if uid is null then raise exception 'not authenticated'; end if;
  if not exists (select 1 from public.candidates where id = uid) then raise exception 'not a candidate'; end if;

  select full_name into lname from public.lawyers
   where id = p_lawyer and verification_status = 'verified' and accepting and suspended_at is null;
  if lname is null then raise exception 'lawyer unavailable'; end if;

  if p_payload is null or p_payload not like 'v1.%' or char_length(p_payload) > 400000 then raise exception 'invalid payload'; end if;

  if exists (select 1 from public.dossier_shares
              where candidate_id = uid and lawyer_id = p_lawyer and revoked_at is null and expires_at > now()) then
    raise exception 'already shared';
  end if;
  if (select count(*) from public.dossier_shares
       where candidate_id = uid and revoked_at is null and expires_at > now()) >= 5 then
    raise exception 'too many shares';
  end if;

  insert into public.dossier_shares (id, candidate_id, lawyer_id, lawyer_name, has_contact, payload_enc)
  values (p_id, uid, p_lawyer, lname, coalesce(p_has_contact, false), p_payload);

  insert into public.consent_events (user_id, kind, granted) values (uid, 'dossie_compartilhado', true);
  return p_id;
end;
$$;

-- Revoga e APAGA o conteúdo.
create or replace function public.revoke_dossier_share(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare n int;
begin
  update public.dossier_shares
     set revoked_at = now(), payload_enc = null, has_contact = false
   where id = p_id and candidate_id = auth.uid() and revoked_at is null;
  get diagnostics n = row_count;
  if n > 0 then
    insert into public.consent_events (user_id, kind, granted) values (auth.uid(), 'dossie_compartilhado', false);
  end if;
  return n > 0;
end;
$$;

-- Lista do advogado: o conteúdo cifrado só vem enquanto o acesso vale.
create or replace function public.lawyer_dossiers()
returns table (
  id uuid, created_at timestamptz, expires_at timestamptz, active boolean,
  payload_enc text, first_viewed_at timestamptz, renewal_requested_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select s.id, s.created_at, s.expires_at, s.expires_at > now(),
         case when s.expires_at > now() then s.payload_enc end,
         s.first_viewed_at, s.renewal_requested_at
    from public.dossier_shares s
   where s.lawyer_id = auth.uid()
     and s.revoked_at is null
     and s.expires_at > now() - interval '90 days'
     and exists (select 1 from public.lawyers l
                  where l.id = auth.uid() and l.verification_status = 'verified' and l.suspended_at is null)
   order by s.created_at desc;
$$;

-- Abre um dossiê (marca como visto) e devolve o conteúdo cifrado. Só enquanto o acesso vale.
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
  return jsonb_build_object('payload_enc', r.payload_enc, 'created_at', r.created_at, 'expires_at', r.expires_at);
end;
$$;

revoke execute on function public.create_dossier_share(uuid, uuid, boolean, text) from public, anon;
revoke execute on function public.revoke_dossier_share(uuid) from public, anon;
revoke execute on function public.lawyer_dossiers() from public, anon;
revoke execute on function public.lawyer_open_dossier(uuid) from public, anon;
grant execute on function public.create_dossier_share(uuid, uuid, boolean, text) to authenticated;
grant execute on function public.revoke_dossier_share(uuid) to authenticated;
grant execute on function public.lawyer_dossiers() to authenticated;
grant execute on function public.lawyer_open_dossier(uuid) to authenticated;
-- renew_dossier_share e lawyer_request_renewal continuam valendo (só mexem em datas).
