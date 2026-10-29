-- Dossiê do trabalhador: fatos datados (linha do tempo). O texto livre continua em confidential_reports.
-- Só o dono lê e escreve; nenhum outro papel tem política aqui.
create table if not exists public.report_facts (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates (id) on delete cascade,
  happened_on date,
  place text check (char_length(place) <= 160),
  who text check (char_length(who) <= 160),
  what text not null check (char_length(what) between 1 and 1000),
  evidence text check (char_length(evidence) <= 500),
  witnesses text check (char_length(witnesses) <= 300),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.report_facts enable row level security;

create index if not exists report_facts_candidate_idx on public.report_facts (candidate_id, happened_on);

drop trigger if exists report_facts_touch on public.report_facts;
create trigger report_facts_touch before update on public.report_facts
  for each row execute function public.touch_updated_at();

drop policy if exists "facts: só o dono" on public.report_facts;
create policy "facts: só o dono" on public.report_facts
  for all to authenticated using (candidate_id = auth.uid()) with check (candidate_id = auth.uid());
