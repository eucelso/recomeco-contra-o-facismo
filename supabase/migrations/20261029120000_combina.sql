-- ============================================================================
-- Combina — match entre candidatos e vagas
--   * O candidato desliza VAGAS; a empresa desliza PERFIS ANÔNIMOS por vaga.
--   * Match = os dois disseram "sim" → contact_request aceito (chat liberado).
--   * Unifica com o resto: "Tenho interesse" no mural = swipe "like";
--     convite pendente da empresa + like do candidato = match.
--   * Um "pass" nunca é visível para o outro lado.
-- ============================================================================

create type public.swipe_side as enum ('candidate', 'employer');
create type public.swipe_choice as enum ('like', 'pass');

create table public.swipes (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete cascade,
  candidate_id uuid not null references public.candidates (id) on delete cascade,
  side public.swipe_side not null,
  choice public.swipe_choice not null,
  created_at timestamptz not null default now(),
  unique (job_id, candidate_id, side)
);
alter table public.swipes enable row level security;
create index on public.swipes (candidate_id, side);
create index on public.swipes (job_id, side);

-- Cada lado lê só as próprias escolhas. Escritas só pelas funções abaixo.
create policy "swipes: candidato lê as suas" on public.swipes
  for select to authenticated using (side = 'candidate' and candidate_id = auth.uid());
create policy "swipes: empresa lê as suas" on public.swipes
  for select to authenticated
  using (side = 'employer' and exists (select 1 from public.jobs j where j.id = job_id and j.employer_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- Cria (ou aceita) o contato entre empresa e candidato. Uso interno.
-- ---------------------------------------------------------------------------
create or replace function public.combina_open_contact(p_employer uuid, p_candidate uuid, p_job uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  cid uuid;
begin
  select id into cid from public.contact_requests
   where employer_id = p_employer and candidate_id = p_candidate and status in ('pending', 'accepted')
   limit 1;
  if cid is null then
    insert into public.contact_requests (employer_id, candidate_id, job_id, status, responded_at, message)
    values (p_employer, p_candidate, p_job, 'accepted', now(), null)
    returning id into cid;
  else
    update public.contact_requests
       set status = 'accepted', responded_at = coalesce(responded_at, now()), job_id = coalesce(job_id, p_job)
     where id = cid and status = 'pending';
  end if;
  update public.applications set status = 'in_conversation'
   where job_id = p_job and candidate_id = p_candidate and status in ('sent', 'viewed');
  return cid;
end;
$$;
revoke execute on function public.combina_open_contact(uuid, uuid, uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Swipe do candidato (também usado pelo "Tenho interesse" do mural)
-- ---------------------------------------------------------------------------
create or replace function public.combina_candidate_swipe(p_job uuid, p_choice public.swipe_choice)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  emp uuid;
  emp_name text;
  cid uuid;
  employer_wants boolean;
begin
  if not exists (select 1 from public.candidates c where c.id = me and c.completed_at is not null) then
    raise exception 'profile incomplete';
  end if;
  select l.employer_id, l.employer_name into emp, emp_name from public.job_listings l where l.id = p_job;
  if emp is null then
    raise exception 'job not available';
  end if;

  insert into public.swipes (job_id, candidate_id, side, choice)
  values (p_job, me, 'candidate', p_choice)
  on conflict (job_id, candidate_id, side) do update set choice = excluded.choice, created_at = now();

  if p_choice = 'pass' then
    return jsonb_build_object('matched', false);
  end if;

  insert into public.applications (job_id, candidate_id) values (p_job, me)
  on conflict (job_id, candidate_id) do nothing;

  -- A empresa já quis? (swipe "like" nesta vaga ou convite pendente)
  employer_wants := exists (
      select 1 from public.swipes s
       where s.job_id = p_job and s.candidate_id = me and s.side = 'employer' and s.choice = 'like')
    or exists (
      select 1 from public.contact_requests r
       where r.employer_id = emp and r.candidate_id = me and r.status = 'pending');

  if not employer_wants then
    return jsonb_build_object('matched', false);
  end if;

  cid := public.combina_open_contact(emp, me, p_job);
  return jsonb_build_object('matched', true, 'contact_id', cid, 'peer_name', emp_name);
end;
$$;

-- ---------------------------------------------------------------------------
-- Swipe da empresa (vaga própria, empresa verificada)
-- ---------------------------------------------------------------------------
create or replace function public.combina_employer_swipe(p_job uuid, p_candidate uuid, p_choice public.swipe_choice)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  cid uuid;
  cand_name text;
  candidate_wants boolean;
begin
  if not public.is_verified_employer() then
    raise exception 'employer not verified';
  end if;
  if not exists (select 1 from public.jobs j where j.id = p_job and j.employer_id = me and j.status = 'active') then
    raise exception 'job not yours';
  end if;
  if not public.candidate_open_for_invites(p_candidate) then
    raise exception 'candidate not available';
  end if;

  insert into public.swipes (job_id, candidate_id, side, choice)
  values (p_job, p_candidate, 'employer', p_choice)
  on conflict (job_id, candidate_id, side) do update set choice = excluded.choice, created_at = now();

  if p_choice = 'pass' then
    return jsonb_build_object('matched', false);
  end if;

  candidate_wants := exists (
      select 1 from public.swipes s
       where s.job_id = p_job and s.candidate_id = p_candidate and s.side = 'candidate' and s.choice = 'like')
    or exists (
      select 1 from public.applications a where a.job_id = p_job and a.candidate_id = p_candidate);

  if not candidate_wants then
    return jsonb_build_object('matched', false);
  end if;

  cid := public.combina_open_contact(me, p_candidate, p_job);
  select coalesce(c.preferred_name, c.full_name) into cand_name from public.candidates c where c.id = p_candidate;
  return jsonb_build_object('matched', true, 'contact_id', cid, 'peer_name', cand_name);
end;
$$;

-- ---------------------------------------------------------------------------
-- Desfazer a última escolha (só se ainda não deu liga)
-- ---------------------------------------------------------------------------
create or replace function public.combina_candidate_undo(p_job uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
begin
  if exists (
    select 1 from public.contact_requests r
     where r.job_id = p_job and r.candidate_id = me and r.status = 'accepted'
  ) then
    raise exception 'already matched';
  end if;
  delete from public.swipes where job_id = p_job and candidate_id = me and side = 'candidate';
  delete from public.applications where job_id = p_job and candidate_id = me and status = 'sent';
end;
$$;

create or replace function public.combina_employer_undo(p_job uuid, p_candidate uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.jobs j where j.id = p_job and j.employer_id = auth.uid()) then
    raise exception 'job not yours';
  end if;
  if exists (
    select 1 from public.contact_requests r
     where r.job_id = p_job and r.candidate_id = p_candidate and r.employer_id = auth.uid() and r.status = 'accepted'
  ) then
    raise exception 'already matched';
  end if;
  delete from public.swipes where job_id = p_job and candidate_id = p_candidate and side = 'employer';
end;
$$;

-- ---------------------------------------------------------------------------
-- Cartas do candidato: vagas ativas ainda não vistas, ordenadas por afinidade
-- ---------------------------------------------------------------------------
create or replace function public.combina_candidate_feed(p_limit int default 20)
returns table (
  id uuid,
  title text,
  description text,
  area text,
  city text,
  state char(2),
  modality public.job_modality,
  contract_type public.contract_type,
  salary_min int,
  salary_max int,
  benefits text,
  published_at timestamptz,
  employer_name text,
  employer_sector text,
  employer_city text,
  employer_state char(2),
  reasons text[]
)
language sql
stable
security definer
set search_path = ''
as $$
  with me as (
    select c.* from public.candidates c where c.id = auth.uid() and c.completed_at is not null
  ),
  scored as (
    select l.*, e.city as e_city, e.state as e_state,
      array_remove(array[
        case when l.area = any (me.areas) then l.area end,
        case when l.modality = 'remoto' then 'Remoto'
             when l.state = me.state and lower(l.city) = lower(me.city) then 'Na sua cidade'
             when l.state = me.state then 'No seu estado' end,
        case when l.modality = any (me.modalities) and l.modality <> 'remoto' then
          case l.modality when 'presencial' then 'Presencial' else 'Híbrido' end end,
        case when l.contract_type = any (me.contract_types) then upper(l.contract_type::text) end
      ], null) as reasons,
      (case when l.area = any (me.areas) then 4 else 0 end)
      + (case when l.state = me.state then 3 when l.modality = 'remoto' then 2 else 0 end)
      + (case when l.state = me.state and lower(l.city) = lower(me.city) then 2 else 0 end)
      + (case when l.modality = any (me.modalities) then 1 else 0 end)
      + (case when l.contract_type = any (me.contract_types) then 1 else 0 end) as score
    from public.job_listings l
    cross join me
    join public.employers e on e.id = l.employer_id
    where not exists (
        select 1 from public.swipes s where s.job_id = l.id and s.candidate_id = me.id and s.side = 'candidate')
      and not exists (
        select 1 from public.applications a where a.job_id = l.id and a.candidate_id = me.id)
      and (l.modality = 'remoto' or l.state = me.state or l.area = any (me.areas))
  )
  select id, title, description, area, city, state, modality, contract_type, salary_min, salary_max, benefits,
         published_at, employer_name, employer_sector, e_city, e_state, reasons
    from scored
   order by score desc, published_at desc
   limit least(p_limit, 50);
$$;

-- ---------------------------------------------------------------------------
-- Cartas da empresa: perfis anônimos para UMA vaga, ainda não vistos
-- ---------------------------------------------------------------------------
create or replace function public.combina_employer_feed(p_job uuid, p_limit int default 20)
returns table (
  id uuid,
  public_code text,
  headline text,
  years_experience int,
  region text,
  areas text[],
  skills text[],
  shifts text[],
  modalities public.job_modality[],
  contract_types public.contract_type[],
  available_from text,
  education text,
  courses text,
  has_resume boolean,
  checks jsonb,
  experiences jsonb
)
language plpgsql
stable
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  j public.jobs;
begin
  if not public.is_verified_employer() then
    raise exception 'employer not verified';
  end if;
  select * into j from public.jobs where jobs.id = p_job and employer_id = auth.uid() and status = 'active';
  if not found then
    raise exception 'job not yours';
  end if;

  return query
  select c.id, c.public_code, c.headline, c.years_experience,
         public.region_label(c.city, c.state, c.show_region_only),
         c.areas, c.skills, c.shifts, c.modalities, c.contract_types, c.available_from, c.education, c.courses,
         c.resume_path is not null,
         jsonb_build_array(
           jsonb_build_object('label', 'Área: ' || j.area, 'ok', j.area = any (c.areas)),
           jsonb_build_object('label', case when j.modality = 'remoto' then 'Topa remoto' else 'Mora na região da vaga' end,
                              'ok', case when j.modality = 'remoto' then 'remoto' = any (c.modalities) else c.state = j.state end),
           jsonb_build_object('label', 'Aceita contrato ' || upper(j.contract_type::text), 'ok', j.contract_type = any (c.contract_types))
         ),
         coalesce((
           select jsonb_agg(jsonb_build_object(
                    'role_title', x.role_title, 'employer', x.employer_kind,
                    'start_year', x.start_year, 'end_year', x.end_year, 'description', x.description
                  ) order by x.position)
             from public.candidate_experiences x where x.candidate_id = c.id
         ), '[]'::jsonb)
    from public.candidates c
   where c.completed_at is not null
     and not c.invites_paused
     and not exists (select 1 from public.swipes s where s.job_id = p_job and s.candidate_id = c.id and s.side = 'employer')
     and not public.has_accepted_contact(auth.uid(), c.id)
     and (j.area = any (c.areas) or c.state = j.state or (j.modality = 'remoto' and 'remoto' = any (c.modalities)))
   order by
     (exists (select 1 from public.applications a where a.job_id = p_job and a.candidate_id = c.id)) desc,
     (case when j.area = any (c.areas) then 3 else 0 end)
       + (case when c.state = j.state then 2 else 0 end)
       + (case when j.contract_type = any (c.contract_types) then 1 else 0 end) desc,
     c.updated_at desc
   limit least(p_limit, 50);
end;
$$;

-- ---------------------------------------------------------------------------
-- Conexões (deu liga) do usuário atual, para a coluna lateral
-- ---------------------------------------------------------------------------
create or replace function public.combina_connections(p_limit int default 20)
returns table (contact_id uuid, peer_name text, job_title text, last_message text, last_at timestamptz, unread int)
language sql
stable
security definer
set search_path = ''
as $$
  select r.id,
         case when auth.uid() = r.candidate_id then e.display_name else coalesce(k.preferred_name, k.full_name) end,
         j.title,
         m.body,
         coalesce(m.created_at, r.responded_at, r.created_at),
         (select count(*)::int from public.messages u where u.contact_id = r.id and u.sender_id <> auth.uid() and u.read_at is null)
    from public.contact_requests r
    join public.employers e on e.id = r.employer_id
    join public.candidates k on k.id = r.candidate_id
    left join public.jobs j on j.id = r.job_id
    left join lateral (
      select body, created_at from public.messages mm where mm.contact_id = r.id order by created_at desc limit 1
    ) m on true
   where r.status = 'accepted' and auth.uid() in (r.employer_id, r.candidate_id)
   order by coalesce(m.created_at, r.responded_at, r.created_at) desc
   limit least(p_limit, 100);
$$;

grant execute on function
  public.combina_candidate_swipe(uuid, public.swipe_choice),
  public.combina_employer_swipe(uuid, uuid, public.swipe_choice),
  public.combina_candidate_undo(uuid),
  public.combina_employer_undo(uuid, uuid),
  public.combina_candidate_feed(int),
  public.combina_employer_feed(uuid, int),
  public.combina_connections(int)
to authenticated;
revoke execute on function
  public.combina_candidate_swipe(uuid, public.swipe_choice),
  public.combina_employer_swipe(uuid, uuid, public.swipe_choice),
  public.combina_candidate_undo(uuid),
  public.combina_employer_undo(uuid, uuid),
  public.combina_candidate_feed(int),
  public.combina_employer_feed(uuid, int),
  public.combina_connections(int)
from public, anon;
