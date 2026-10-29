-- ============================================================================
-- Admin: listas de contas e suspensão ("ocultar da plataforma")
--   * Listas: e-mail fica em auth.users e o candidato só é legível pelo dono (RLS),
--     então o admin usa funções que devolvem vazio para quem não é admin.
--     Do candidato, só o mínimo para suporte (e-mail, cidade/UF, áreas, privacidade).
--   * Suspensão: só o admin liga/desliga. Conta suspensa some de todas as listas públicas,
--     empresa suspensa não publica vaga nem convida, candidato suspenso não aparece para empresas.
-- ============================================================================

alter table public.lawyers add column suspended_at timestamptz, add column suspension_reason text;
alter table public.businesses add column suspended_at timestamptz, add column suspension_reason text;
alter table public.employers add column suspended_at timestamptz, add column suspension_reason text;
alter table public.candidates add column suspended_at timestamptz, add column suspension_reason text;

-- Só admin (ou backend confiável) mexe na suspensão ---------------------------------

create or replace function public.employers_guard()
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
      new.suspended_at := null;
      new.suspension_reason := null;
    elsif new.verification_status = 'verified' and new.verified_at is null then
      new.verified_at := now();
    end if;
    return new;
  end if;

  if not trusted then
    new.verification_status := old.verification_status;
    new.verified_at := old.verified_at;
    new.rejection_reason := old.rejection_reason;
    new.suspended_at := old.suspended_at;
    new.suspension_reason := old.suspension_reason;
    if new.document is distinct from old.document or new.kind is distinct from old.kind then
      new.verification_status := 'pending';
      new.verified_at := null;
    end if;
  elsif new.verification_status = 'verified' and old.verification_status <> 'verified' then
    new.verified_at := now();
  end if;
  return new;
end;
$$;

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
      new.suspended_at := null;
      new.suspension_reason := null;
    elsif new.verification_status = 'verified' and new.verified_at is null then
      new.verified_at := now();
    end if;
    return new;
  end if;

  if not trusted then
    new.verification_status := old.verification_status;
    new.verified_at := old.verified_at;
    new.rejection_reason := old.rejection_reason;
    new.suspended_at := old.suspended_at;
    new.suspension_reason := old.suspension_reason;
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
      new.suspended_at := null;
      new.suspension_reason := null;
    elsif new.verification_status = 'verified' and new.verified_at is null then
      new.verified_at := now();
    end if;
    return new;
  end if;

  if not trusted then
    new.verification_status := old.verification_status;
    new.verified_at := old.verified_at;
    new.rejection_reason := old.rejection_reason;
    new.suspended_at := old.suspended_at;
    new.suspension_reason := old.suspension_reason;
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

-- Candidato suspenso fica sempre com os convites pausados: a busca, o Combina e os convites
-- já respeitam isso, então ele some para as empresas sem mexer nessas funções.
create or replace function public.candidates_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.public_code := old.public_code;
  if not (public.is_admin() or public.is_trusted_backend()) then
    new.suspended_at := old.suspended_at;
    new.suspension_reason := old.suspension_reason;
  end if;
  if new.suspended_at is not null then
    new.invites_paused := true;
  end if;
  return new;
end;
$$;

-- Conta suspensa sai das vitrines públicas e perde as ações de empresa -------------

create or replace view public.employer_public as
  select e.id, e.display_name, e.sector, e.city, e.state, true as verified
  from public.employers e
  where e.verification_status = 'verified' and e.suspended_at is null;

create or replace view public.job_listings as
  select j.id, j.title, j.description, j.area, j.city, j.state, j.modality, j.contract_type,
         j.salary_min, j.salary_max, j.benefits, j.published_at,
         e.id as employer_id, e.display_name as employer_name, e.sector as employer_sector
  from public.jobs j
  join public.employers e on e.id = j.employer_id
  where j.status = 'active' and e.verification_status = 'verified' and e.suspended_at is null;

create or replace view public.lawyers_public as
  select l.id, l.full_name, l.oab_state, l.oab_number, l.areas, l.city, l.state, l.online,
         l.contact_kind, l.contact_value, l.bio
  from public.lawyers l
  where l.verification_status = 'verified' and l.accepting and l.suspended_at is null;

create or replace view public.businesses_public as
  select b.id, b.display_name, b.category, b.city, b.state, b.neighborhood, b.address,
         b.whatsapp, b.instagram, b.website, b.hours, b.story
  from public.businesses b
  where b.verification_status = 'verified' and b.visible and b.suspended_at is null;

create or replace function public.is_verified_employer()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.employers e
    where e.id = auth.uid() and e.verification_status = 'verified' and e.suspended_at is null
  );
$$;

create or replace function public.employer_is_verified(p_employer uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.employers e
    where e.id = p_employer and e.verification_status = 'verified' and e.suspended_at is null
  );
$$;

-- Listas do admin -------------------------------------------------------------------

create or replace function public.admin_accounts()
returns table (id uuid, email text, role public.account_role, created_at timestamptz, last_sign_in_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select u.id, u.email::text, p.role, u.created_at, u.last_sign_in_at
    from auth.users u
    left join public.profiles p on p.id = u.id
   where public.is_admin()
   order by u.created_at desc;
$$;

create or replace function public.admin_candidates()
returns table (
  id uuid,
  email text,
  city text,
  state text,
  areas text[],
  headline text,
  completed boolean,
  anonymous boolean,
  invites_paused boolean,
  suspended_at timestamptz,
  suspension_reason text,
  created_at timestamptz,
  last_sign_in_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, u.email::text, c.city, c.state::text, c.areas, c.headline,
         (c.completed_at is not null), c.anonymous, c.invites_paused, c.suspended_at, c.suspension_reason,
         u.created_at, u.last_sign_in_at
    from public.profiles p
    join auth.users u on u.id = p.id
    left join public.candidates c on c.id = p.id
   where p.role = 'candidate' and public.is_admin()
   order by u.created_at desc;
$$;

-- Liga/desliga a suspensão de uma conta (só admin)
create or replace function public.admin_set_suspension(p_kind text, p_id uuid, p_suspend boolean, p_reason text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  ts timestamptz := case when p_suspend then now() else null end;
  rsn text := case when p_suspend then nullif(btrim(left(coalesce(p_reason, ''), 300)), '') else null end;
  n int;
begin
  if not public.is_admin() then
    raise exception 'not allowed';
  end if;
  if p_kind = 'lawyer' then
    update public.lawyers set suspended_at = ts, suspension_reason = rsn where id = p_id;
  elsif p_kind = 'business' then
    update public.businesses set suspended_at = ts, suspension_reason = rsn where id = p_id;
  elsif p_kind = 'employer' then
    update public.employers set suspended_at = ts, suspension_reason = rsn where id = p_id;
  elsif p_kind = 'candidate' then
    update public.candidates set suspended_at = ts, suspension_reason = rsn where id = p_id;
  else
    raise exception 'invalid kind';
  end if;
  get diagnostics n = row_count;
  return n > 0;
end;
$$;

revoke execute on function public.admin_accounts(), public.admin_candidates(), public.admin_set_suspension(text, uuid, boolean, text) from public, anon;
grant execute on function public.admin_accounts(), public.admin_candidates(), public.admin_set_suspension(text, uuid, boolean, text) to authenticated;
