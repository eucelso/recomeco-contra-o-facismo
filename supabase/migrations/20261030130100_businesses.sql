-- ============================================================================
-- Negócios prejudicados (/apoie)
-- Princípios:
--   * Só o próprio dono cadastra, com CNPJ/CPF conferido pela equipe.
--   * Todo texto publicado passa por revisão: mudar nome, documento ou relato volta para "pendente".
--   * O relato não cita pessoas nem acusa terceiros (a equipe confere ao aprovar).
-- ============================================================================

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
    case when requested in ('candidate', 'employer', 'lawyer', 'business') then requested::public.account_role else null end
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
  if p_role not in ('candidate', 'employer', 'lawyer', 'business') then
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

create table public.businesses (
  id uuid primary key references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('cnpj', 'cpf')),
  document text not null unique check (document ~ '^[0-9]{11}$|^[0-9]{14}$'),
  display_name text not null check (char_length(display_name) between 2 and 120),
  category text not null check (char_length(category) <= 80),
  city text not null check (char_length(city) between 2 and 80),
  state char(2) not null,
  neighborhood text check (char_length(neighborhood) <= 80),
  address text check (char_length(address) <= 160),
  whatsapp text check (whatsapp ~ '^[0-9]{10,13}$'),
  instagram text check (instagram ~ '^[A-Za-z0-9._]{1,30}$'),
  website text check (char_length(website) <= 200 and website ~ '^https?://'),
  hours text check (char_length(hours) <= 160),
  story text not null check (char_length(story) between 20 and 500),
  visible boolean not null default true,
  commitment_version text not null,
  commitment_accepted_at timestamptz not null,
  verification_status public.verification_status not null default 'pending',
  verified_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (whatsapp is not null or instagram is not null or website is not null)
);
alter table public.businesses enable row level security;
create index on public.businesses (state, verification_status);

create trigger businesses_touch before update on public.businesses
  for each row execute function public.touch_updated_at();

-- Só admins (ou o backend confiável) mudam o status. Mudar documento, nome ou relato
-- volta para "pendente": o texto novo só aparece depois de revisado.
create or replace function public.businesses_guard()
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
    if new.document is distinct from old.document
       or new.kind is distinct from old.kind
       or new.display_name is distinct from old.display_name
       or new.story is distinct from old.story then
      new.verification_status := 'pending';
      new.verified_at := null;
    end if;
  elsif new.verification_status = 'verified' and old.verification_status <> 'verified' then
    new.verified_at := now();
  end if;
  return new;
end;
$$;
create trigger businesses_guard before insert or update on public.businesses
  for each row execute function public.businesses_guard();

create policy "businesses: dono ou admin lê" on public.businesses
  for select to authenticated using (id = auth.uid() or public.is_admin());
create policy "businesses: dono cria" on public.businesses
  for insert to authenticated
  with check (id = auth.uid() and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'business'));
create policy "businesses: dono ou admin edita" on public.businesses
  for update to authenticated using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());

-- Lista pública: só negócios verificados e visíveis. Sem documento.
create view public.businesses_public as
  select b.id, b.display_name, b.category, b.city, b.state, b.neighborhood, b.address,
         b.whatsapp, b.instagram, b.website, b.hours, b.story
  from public.businesses b
  where b.verification_status = 'verified' and b.visible;
comment on view public.businesses_public is
  'Somente negócios verificados e visíveis, sem documento. Roda com os privilégios do dono de propósito.';

grant select on public.businesses_public to anon, authenticated;
