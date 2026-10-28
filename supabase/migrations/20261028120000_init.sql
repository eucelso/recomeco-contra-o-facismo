-- ============================================================================
-- Recomeço — esquema inicial
-- Princípios:
--   * Opinião política NUNCA é coletada: não existe coluna para isso.
--   * Relato confidencial em tabela separada, legível só pelo próprio dono.
--   * Contratante só vê dados identificáveis depois que o candidato aceita.
--   * Contratante sem verificação não acessa candidatos nem publica vagas.
--   * Não há tabela de denúncias contra pessoas ou empresas.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------------
create type public.account_role as enum ('candidate', 'employer', 'admin');
create type public.verification_status as enum ('pending', 'verified', 'rejected');
create type public.job_modality as enum ('presencial', 'remoto', 'hibrido');
create type public.contract_type as enum ('clt', 'pj', 'temporario', 'estagio', 'autonomo');
create type public.job_status as enum ('draft', 'active', 'closed');
create type public.application_status as enum ('sent', 'viewed', 'in_conversation', 'hired', 'closed');
create type public.contact_status as enum ('pending', 'accepted', 'declined', 'revoked');

-- ---------------------------------------------------------------------------
-- Utilitários
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Código público curto e não sequencial para perfis anônimos (ex.: A7K2)
create or replace function public.gen_public_code()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text;
begin
  loop
    code := '';
    for i in 1..4 loop
      code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.candidates c where c.public_code = code);
  end loop;
  return code;
end;
$$;

-- ---------------------------------------------------------------------------
-- Perfis (1:1 com auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.account_role,            -- nulo até a pessoa escolher (ex.: login com Google)
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

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
    case when requested in ('candidate', 'employer') then requested::public.account_role else null end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin');
$$;

-- Define o tipo de conta uma única vez (nunca 'admin')
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
  if p_role not in ('candidate', 'employer') then
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

create policy "profiles: ver o próprio" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- Candidatos
-- ---------------------------------------------------------------------------
create table public.candidates (
  id uuid primary key references public.profiles (id) on delete cascade,
  public_code text not null unique default public.gen_public_code(),
  full_name text not null check (char_length(full_name) between 3 and 120),
  preferred_name text check (char_length(preferred_name) <= 60),
  city text not null check (char_length(city) between 2 and 80),
  state char(2) not null,
  headline text check (char_length(headline) <= 80),
  areas text[] not null default '{}' check (cardinality(areas) <= 3),
  skills text[] not null default '{}' check (cardinality(skills) <= 20),
  years_experience int check (years_experience between 0 and 70),
  shifts text[] not null default '{}',
  modalities public.job_modality[] not null default '{}',
  contract_types public.contract_type[] not null default '{}',
  available_from text,
  education text,
  courses text check (char_length(courses) <= 300),
  resume_path text,
  anonymous boolean not null default true,
  show_region_only boolean not null default true,
  invites_paused boolean not null default false,
  onboarding_step int not null default 1 check (onboarding_step between 1 and 5),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.candidates enable row level security;
create trigger candidates_touch before update on public.candidates
  for each row execute function public.touch_updated_at();

-- O código público não muda depois de criado
create or replace function public.candidates_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.public_code := old.public_code;
  return new;
end;
$$;
create trigger candidates_guard before update on public.candidates
  for each row execute function public.candidates_guard();

create policy "candidates: dono lê" on public.candidates
  for select to authenticated using (id = auth.uid());
create policy "candidates: dono cria" on public.candidates
  for insert to authenticated
  with check (id = auth.uid() and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'candidate'));
create policy "candidates: dono edita" on public.candidates
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "candidates: dono apaga" on public.candidates
  for delete to authenticated using (id = auth.uid());

create table public.candidate_experiences (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates (id) on delete cascade,
  role_title text not null check (char_length(role_title) between 2 and 80),
  employer_name text check (char_length(employer_name) <= 120),   -- oculto até o aceite
  employer_kind text check (char_length(employer_kind) <= 80),    -- ex.: "Restaurante de médio porte"
  start_year int check (start_year between 1950 and 2100),
  end_year int check (end_year between 1950 and 2100),
  description text check (char_length(description) <= 500),
  position int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.candidate_experiences enable row level security;
create index on public.candidate_experiences (candidate_id);

create policy "experiences: dono gerencia" on public.candidate_experiences
  for all to authenticated using (candidate_id = auth.uid()) with check (candidate_id = auth.uid());

-- Relato confidencial: tabela separada, sem nenhuma política para outros papéis.
create table public.confidential_reports (
  candidate_id uuid primary key references public.candidates (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 3000),
  consent_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.confidential_reports enable row level security;
create trigger confidential_reports_touch before update on public.confidential_reports
  for each row execute function public.touch_updated_at();

create policy "reports: só o dono" on public.confidential_reports
  for all to authenticated using (candidate_id = auth.uid()) with check (candidate_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Contratantes
-- ---------------------------------------------------------------------------
create table public.employers (
  id uuid primary key references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('cnpj', 'cpf')),
  document text not null unique check (document ~ '^[0-9]{11}$|^[0-9]{14}$'),
  legal_name text check (char_length(legal_name) <= 160),
  display_name text not null check (char_length(display_name) between 2 and 120),
  sector text not null check (char_length(sector) <= 80),
  city text not null check (char_length(city) between 2 and 80),
  state char(2) not null,
  responsible_name text not null check (char_length(responsible_name) between 3 and 120),
  commitment_version text not null,
  commitment_accepted_at timestamptz not null,
  verification_status public.verification_status not null default 'pending',
  verified_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.employers enable row level security;
create trigger employers_touch before update on public.employers
  for each row execute function public.touch_updated_at();

-- Só admins mudam o status de verificação; mudar o documento volta para "pendente".
create or replace function public.employers_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if not public.is_admin() then
      new.verification_status := 'pending';
      new.verified_at := null;
      new.rejection_reason := null;
    end if;
    return new;
  end if;

  if not public.is_admin() then
    new.verification_status := old.verification_status;
    new.verified_at := old.verified_at;
    new.rejection_reason := old.rejection_reason;
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
create trigger employers_guard before insert or update on public.employers
  for each row execute function public.employers_guard();

create policy "employers: dono lê" on public.employers
  for select to authenticated using (id = auth.uid() or public.is_admin());
create policy "employers: dono cria" on public.employers
  for insert to authenticated
  with check (id = auth.uid() and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'employer'));
create policy "employers: dono ou admin edita" on public.employers
  for update to authenticated using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());

create or replace function public.is_verified_employer()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.employers e where e.id = auth.uid() and e.verification_status = 'verified'
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
    select 1 from public.employers e where e.id = p_employer and e.verification_status = 'verified'
  );
$$;

-- Dados públicos e seguros de contratantes verificados (sem documento nem responsável)
create view public.employer_public as
  select e.id, e.display_name, e.sector, e.city, e.state, true as verified
  from public.employers e
  where e.verification_status = 'verified';
comment on view public.employer_public is
  'Somente colunas públicas de contratantes verificados. Roda com os privilégios do dono de propósito.';

-- ---------------------------------------------------------------------------
-- Vagas
-- ---------------------------------------------------------------------------
create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid not null references public.employers (id) on delete cascade,
  title text not null check (char_length(title) between 3 and 100),
  description text not null check (char_length(description) between 20 and 4000),
  area text not null,
  city text,
  state char(2),
  modality public.job_modality not null,
  contract_type public.contract_type not null,
  salary_min int check (salary_min >= 0),
  salary_max int check (salary_max >= 0),
  benefits text check (char_length(benefits) <= 500),
  status public.job_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (modality = 'remoto' or (city is not null and state is not null))
);
alter table public.jobs enable row level security;
create index on public.jobs (status, published_at desc);
create index on public.jobs (employer_id);
create trigger jobs_touch before update on public.jobs
  for each row execute function public.touch_updated_at();

create or replace function public.jobs_set_published()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'active' and (tg_op = 'INSERT' or old.status <> 'active') then
    new.published_at := now();
  end if;
  return new;
end;
$$;
create trigger jobs_set_published before insert or update on public.jobs
  for each row execute function public.jobs_set_published();

create policy "jobs: dono gerencia" on public.jobs
  for select to authenticated using (employer_id = auth.uid());
create policy "jobs: dono cria (ativa só se verificado)" on public.jobs
  for insert to authenticated
  with check (employer_id = auth.uid() and (status = 'draft' or public.is_verified_employer()));
create policy "jobs: dono edita (ativa só se verificado)" on public.jobs
  for update to authenticated
  using (employer_id = auth.uid())
  with check (employer_id = auth.uid() and (status <> 'active' or public.is_verified_employer()));
create policy "jobs: dono apaga" on public.jobs
  for delete to authenticated using (employer_id = auth.uid());

-- Mural público: vagas ativas de contratantes verificados
create view public.job_listings as
  select j.id, j.title, j.description, j.area, j.city, j.state, j.modality, j.contract_type,
         j.salary_min, j.salary_max, j.benefits, j.published_at,
         e.id as employer_id, e.display_name as employer_name, e.sector as employer_sector
  from public.jobs j
  join public.employers e on e.id = j.employer_id
  where j.status = 'active' and e.verification_status = 'verified';
comment on view public.job_listings is
  'Mural público. Expõe só vagas ativas de contratantes verificados.';

-- ---------------------------------------------------------------------------
-- Candidaturas
-- ---------------------------------------------------------------------------
create table public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete cascade,
  candidate_id uuid not null references public.candidates (id) on delete cascade,
  status public.application_status not null default 'sent',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, candidate_id)
);
alter table public.applications enable row level security;
create index on public.applications (candidate_id);
create trigger applications_touch before update on public.applications
  for each row execute function public.touch_updated_at();

create policy "applications: candidato vê as suas" on public.applications
  for select to authenticated using (candidate_id = auth.uid());
create policy "applications: contratante vê as das suas vagas" on public.applications
  for select to authenticated
  using (exists (select 1 from public.jobs j where j.id = job_id and j.employer_id = auth.uid()));
create policy "applications: candidato se candidata a vaga ativa" on public.applications
  for insert to authenticated
  with check (
    candidate_id = auth.uid()
    and status = 'sent'
    and exists (select 1 from public.job_listings l where l.id = job_id)
    and exists (select 1 from public.candidates c where c.id = auth.uid() and c.completed_at is not null)
  );
create policy "applications: candidato desiste" on public.applications
  for delete to authenticated using (candidate_id = auth.uid());

create or replace function public.set_application_status(p_id uuid, p_status public.application_status)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.applications a
     set status = p_status
   where a.id = p_id
     and exists (select 1 from public.jobs j where j.id = a.job_id and j.employer_id = auth.uid());
  if not found then
    raise exception 'not allowed';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Convites de contato e mensagens
-- ---------------------------------------------------------------------------
create or replace function public.candidate_open_for_invites(p_candidate uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.candidates c
    where c.id = p_candidate and c.completed_at is not null and not c.invites_paused
  );
$$;

create table public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid not null references public.employers (id) on delete cascade,
  candidate_id uuid not null references public.candidates (id) on delete cascade,
  job_id uuid references public.jobs (id) on delete set null,
  message text check (char_length(message) <= 600),
  status public.contact_status not null default 'pending',
  created_at timestamptz not null default now(),
  responded_at timestamptz
);
alter table public.contact_requests enable row level security;
create unique index contact_requests_one_open
  on public.contact_requests (employer_id, candidate_id)
  where status in ('pending', 'accepted');
create index on public.contact_requests (candidate_id, status);

create policy "contacts: participantes leem" on public.contact_requests
  for select to authenticated using (employer_id = auth.uid() or candidate_id = auth.uid());
create policy "contacts: contratante verificado convida" on public.contact_requests
  for insert to authenticated
  with check (
    employer_id = auth.uid()
    and status = 'pending'
    and public.is_verified_employer()
    and public.candidate_open_for_invites(candidate_id)
  );

create or replace function public.has_accepted_contact(p_employer uuid, p_candidate uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.contact_requests c
    where c.employer_id = p_employer and c.candidate_id = p_candidate and c.status = 'accepted'
  );
$$;

-- Candidato aceita ou recusa
create or replace function public.respond_contact(p_id uuid, p_accept boolean)
returns public.contact_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  result public.contact_status;
begin
  update public.contact_requests c
     set status = case when p_accept then 'accepted'::public.contact_status else 'declined'::public.contact_status end,
         responded_at = now()
   where c.id = p_id and c.candidate_id = auth.uid() and c.status = 'pending'
  returning c.status into result;
  if result is null then
    raise exception 'not allowed';
  end if;
  if p_accept then
    update public.applications a
       set status = 'in_conversation'
      from public.contact_requests c
     where c.id = p_id and a.candidate_id = c.candidate_id and a.job_id = c.job_id;
  end if;
  return result;
end;
$$;

-- Candidato revoga um acesso que tinha concedido
create or replace function public.revoke_contact(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.contact_requests c
     set status = 'revoked', responded_at = now()
   where c.id = p_id and c.candidate_id = auth.uid() and c.status in ('pending', 'accepted');
  if not found then
    raise exception 'not allowed';
  end if;
end;
$$;

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contact_requests (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);
alter table public.messages enable row level security;
create index on public.messages (contact_id, created_at);

create or replace function public.is_open_conversation(p_contact uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.contact_requests c
    where c.id = p_contact and c.status = 'accepted'
      and auth.uid() in (c.employer_id, c.candidate_id)
  );
$$;

create policy "messages: participantes leem (conversa aceita)" on public.messages
  for select to authenticated using (public.is_open_conversation(contact_id));
create policy "messages: participantes enviam (conversa aceita)" on public.messages
  for insert to authenticated
  with check (sender_id = auth.uid() and public.is_open_conversation(contact_id));

create or replace function public.mark_conversation_read(p_contact uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.messages m
     set read_at = now()
   where m.contact_id = p_contact
     and m.sender_id <> auth.uid()
     and m.read_at is null
     and public.is_open_conversation(p_contact);
$$;

-- ---------------------------------------------------------------------------
-- Visão anônima do candidato para contratantes verificados
-- ---------------------------------------------------------------------------
create or replace function public.region_label(p_city text, p_state text, p_region_only boolean)
returns text
language sql
immutable
set search_path = ''
as $$
  select case when p_region_only then 'Região de ' || p_city || ' · ' || p_state else p_city || ', ' || p_state end;
$$;

create or replace function public.search_candidates(
  p_area text default null,
  p_state text default null,
  p_query text default null,
  p_limit int default 30
)
returns table (
  id uuid,
  public_code text,
  display_name text,
  headline text,
  years_experience int,
  areas text[],
  skills text[],
  region text,
  modalities public.job_modality[],
  contract_types public.contract_type[]
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_verified_employer() then
    raise exception 'employer not verified';
  end if;
  return query
    select c.id, c.public_code,
           case when not c.anonymous or public.has_accepted_contact(auth.uid(), c.id) then c.full_name end,
           c.headline, c.years_experience, c.areas, c.skills,
           public.region_label(c.city, c.state, c.show_region_only),
           c.modalities, c.contract_types
      from public.candidates c
     where c.completed_at is not null
       and not c.invites_paused
       and (p_area is null or p_area = any (c.areas))
       and (p_state is null or c.state = p_state)
       and (p_query is null or c.headline ilike '%' || p_query || '%' or exists (
             select 1 from unnest(c.skills) s where s ilike '%' || p_query || '%'))
     order by c.updated_at desc
     limit least(p_limit, 100);
end;
$$;

-- Perfil completo como o contratante pode vê-lo
create or replace function public.candidate_card(p_code text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  c public.candidates;
  revealed boolean;
  contact public.contact_requests;
begin
  if not public.is_verified_employer() then
    raise exception 'employer not verified';
  end if;
  select * into c from public.candidates where public_code = upper(p_code) and completed_at is not null;
  if not found then
    return null;
  end if;
  revealed := public.has_accepted_contact(auth.uid(), c.id);
  select * into contact from public.contact_requests cr
   where cr.employer_id = auth.uid() and cr.candidate_id = c.id
   order by cr.created_at desc limit 1;

  return jsonb_build_object(
    'id', c.id,
    'public_code', c.public_code,
    'revealed', revealed,
    'display_name', case when revealed or not c.anonymous then c.full_name end,
    'headline', c.headline,
    'years_experience', c.years_experience,
    'region', public.region_label(c.city, c.state, c.show_region_only and not revealed),
    'areas', c.areas,
    'skills', c.skills,
    'shifts', c.shifts,
    'modalities', c.modalities,
    'contract_types', c.contract_types,
    'available_from', c.available_from,
    'education', c.education,
    'courses', c.courses,
    'has_resume', c.resume_path is not null,
    'resume_path', case when revealed then c.resume_path end,
    'invites_paused', c.invites_paused,
    'contact_status', contact.status,
    'contact_id', contact.id,
    'experiences', coalesce((
      select jsonb_agg(jsonb_build_object(
               'role_title', x.role_title,
               'employer', case when revealed then coalesce(x.employer_name, x.employer_kind) else x.employer_kind end,
               'start_year', x.start_year,
               'end_year', x.end_year,
               'description', x.description
             ) order by x.position, x.start_year desc nulls last)
        from public.candidate_experiences x where x.candidate_id = c.id
    ), '[]'::jsonb)
  );
end;
$$;

-- Interessados nas vagas do contratante (anônimos até o aceite)
create or replace function public.employer_applicants(p_limit int default 50)
returns table (
  application_id uuid,
  job_id uuid,
  job_title text,
  status public.application_status,
  created_at timestamptz,
  candidate_id uuid,
  public_code text,
  display_name text,
  headline text,
  years_experience int,
  region text,
  skills text[],
  contact_status public.contact_status,
  contact_id uuid
)
language sql
stable
security definer
set search_path = ''
as $$
  select a.id, j.id, j.title, a.status, a.created_at, c.id, c.public_code,
         case when not c.anonymous or public.has_accepted_contact(auth.uid(), c.id) then coalesce(c.preferred_name, c.full_name) end,
         c.headline, c.years_experience,
         public.region_label(c.city, c.state, c.show_region_only and not public.has_accepted_contact(auth.uid(), c.id)),
         c.skills,
         cr.status, cr.id
    from public.applications a
    join public.jobs j on j.id = a.job_id and j.employer_id = auth.uid()
    join public.candidates c on c.id = a.candidate_id
    left join lateral (
      select x.status, x.id from public.contact_requests x
       where x.employer_id = auth.uid() and x.candidate_id = c.id
       order by x.created_at desc limit 1
    ) cr on true
   order by a.created_at desc
   limit least(p_limit, 200);
$$;

-- Nome do outro lado de uma conversa aceita
create or replace function public.conversation_peer(p_contact uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when auth.uid() = c.candidate_id then jsonb_build_object('name', e.display_name, 'kind', 'employer', 'verified', e.verification_status = 'verified')
    when auth.uid() = c.employer_id then jsonb_build_object('name', coalesce(k.preferred_name, k.full_name), 'kind', 'candidate', 'code', k.public_code)
  end
  from public.contact_requests c
  join public.employers e on e.id = c.employer_id
  join public.candidates k on k.id = c.candidate_id
  where c.id = p_contact
    and c.status = 'accepted'
    and auth.uid() in (c.employer_id, c.candidate_id);
$$;

-- ---------------------------------------------------------------------------
-- Consentimentos (LGPD)
-- ---------------------------------------------------------------------------
create table public.consent_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null,
  granted boolean not null,
  created_at timestamptz not null default now()
);
alter table public.consent_events enable row level security;
create index on public.consent_events (user_id, created_at desc);

create policy "consents: dono lê" on public.consent_events
  for select to authenticated using (user_id = auth.uid());
create policy "consents: dono registra" on public.consent_events
  for insert to authenticated with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Números públicos da landing
-- ---------------------------------------------------------------------------
create or replace function public.public_stats()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'active_jobs', (select count(*) from public.job_listings),
    'hires', (select count(*) from public.applications where status = 'hired'),
    'verified_employers', (select count(*) from public.employers where verification_status = 'verified'),
    'cities', (select count(distinct (city, state)) from public.job_listings where city is not null)
  );
$$;

-- ---------------------------------------------------------------------------
-- Permissões de execução
-- ---------------------------------------------------------------------------
revoke execute on all functions in schema public from public, anon;
grant execute on function public.public_stats() to anon, authenticated;
grant execute on function
  public.set_my_role(public.account_role),
  public.is_admin(),
  public.is_verified_employer(),
  public.employer_is_verified(uuid),
  public.has_accepted_contact(uuid, uuid),
  public.candidate_open_for_invites(uuid),
  public.respond_contact(uuid, boolean),
  public.revoke_contact(uuid),
  public.set_application_status(uuid, public.application_status),
  public.is_open_conversation(uuid),
  public.mark_conversation_read(uuid),
  public.search_candidates(text, text, text, int),
  public.candidate_card(text),
  public.conversation_peer(uuid),
  public.employer_applicants(int),
  public.region_label(text, text, boolean),
  public.gen_public_code()
to authenticated;

grant select on public.job_listings, public.employer_public to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Storage: currículos (bucket privado, só PDF, até 5 MB)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('resumes', 'resumes', false, 5242880, array['application/pdf'])
on conflict (id) do nothing;

create policy "resumes: dono envia" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "resumes: dono lê" on storage.objects
  for select to authenticated
  using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "resumes: dono substitui" on storage.objects
  for update to authenticated
  using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "resumes: dono apaga" on storage.objects
  for delete to authenticated
  using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "resumes: contratante com contato aceito lê" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'resumes'
    and public.has_accepted_contact(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );

-- ---------------------------------------------------------------------------
-- Realtime: chat
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table public.messages;
