-- Suspensão de contas, parte 3 de 4: conta suspensa sai das vitrines públicas e perde as ações de empresa.
set lock_timeout = '4s';

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

