-- ============================================================================
-- Advogados voluntários
-- Princípios:
--   * Só aparece no diretório público quem teve a OAB conferida pela equipe.
--   * O contato publicado (WhatsApp ou e-mail) é escolhido pelo próprio advogado.
--   * Quem procura ajuda não precisa de conta nem deixa dado nenhum.
-- ============================================================================

-- Aceita 'lawyer' no cadastro e na escolha de tipo (nunca 'admin')
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested text := new.raw_user_meta_data ->> 'account_type';
begin
  insert into public.profiles (id, role)
  values (
    new.id,
    case when requested in ('candidate', 'employer', 'lawyer') then requested::public.account_role else null end
  );
  return new;
end;
$$;

create or replace function public.set_my_role(p_role public.account_role)
returns public.account_role
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_role_value public.account_role;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if p_role not in ('candidate', 'employer', 'lawyer') then
    raise exception 'invalid role';
  end if;
  select role into current_role_value from public.profiles where id = auth.uid();
  if current_role_value is not null then
    return current_role_value;
  end if;
  update public.profiles set role = p_role where id = auth.uid();
  return p_role;
end;
$$;

create table public.lawyers (
  id uuid primary key references public.profiles (id) on delete cascade,
  full_name text not null check (char_length(full_name) between 3 and 120),
  oab_state char(2) not null,
  oab_number text not null check (oab_number ~ '^[0-9]{1,7}$'),
  areas text[] not null check (cardinality(areas) between 1 and 5),
  city text not null check (char_length(city) between 2 and 80),
  state char(2) not null,
  online boolean not null default true,
  accepting boolean not null default true,
  contact_kind text not null check (contact_kind in ('whatsapp', 'email')),
  contact_value text not null check (char_length(contact_value) between 5 and 120),
  bio text check (char_length(bio) <= 500),
  commitment_version text not null,
  commitment_accepted_at timestamptz not null,
  verification_status public.verification_status not null default 'pending',
  verified_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (oab_state, oab_number)
);
alter table public.lawyers enable row level security;
create index on public.lawyers (state, verification_status);

create trigger lawyers_touch before update on public.lawyers
  for each row execute function public.touch_updated_at();

-- Só admins (ou o backend confiável) mudam o status; mudar a OAB volta para "pendente".
create or replace function public.lawyers_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  trusted boolean := public.is_admin() or public.is_trusted_backend();
begin
  if tg_op = 'INSERT' then
    if not trusted then
      new.verification_status := 'pending';
      new.verified_at := null;
      new.rejection_reason := null;
    elsif new.verification_status = 'verified' and new.verified_at is null then
      new.verified_at := now();
    end if;
    return new;
  end if;

  if not trusted then
    new.verification_status := old.verification_status;
    new.verified_at := old.verified_at;
    new.rejection_reason := old.rejection_reason;
    if new.oab_number is distinct from old.oab_number or new.oab_state is distinct from old.oab_state then
      new.verification_status := 'pending';
      new.verified_at := null;
    end if;
  elsif new.verification_status = 'verified' and old.verification_status <> 'verified' then
    new.verified_at := now();
  end if;
  return new;
end;
$$;
create trigger lawyers_guard before insert or update on public.lawyers
  for each row execute function public.lawyers_guard();

create policy "lawyers: dono ou admin lê" on public.lawyers
  for select to authenticated using (id = auth.uid() or public.is_admin());
create policy "lawyers: dono cria" on public.lawyers
  for insert to authenticated
  with check (id = auth.uid() and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'lawyer'));
create policy "lawyers: dono ou admin edita" on public.lawyers
  for update to authenticated using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());

-- Diretório público: só advogados verificados que estão aceitando casos.
create view public.lawyers_public as
  select l.id, l.full_name, l.oab_state, l.oab_number, l.areas, l.city, l.state, l.online,
         l.contact_kind, l.contact_value, l.bio
  from public.lawyers l
  where l.verification_status = 'verified' and l.accepting;
comment on view public.lawyers_public is
  'Somente advogados verificados que aceitam casos. Roda com os privilégios do dono de propósito.';

grant select on public.lawyers_public to anon, authenticated;
