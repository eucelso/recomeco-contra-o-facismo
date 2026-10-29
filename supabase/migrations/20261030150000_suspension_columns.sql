-- Suspensão de contas, parte 1 de 4: colunas novas.
-- Rode cada parte em uma execução separada, na ordem. Cada uma segura poucos bloqueios,
-- para não travar com o tráfego do site. Se der "lock timeout", rode de novo (é seguro repetir).
set lock_timeout = '4s';

alter table public.lawyers add column if not exists suspended_at timestamptz;
alter table public.lawyers add column if not exists suspension_reason text;
alter table public.businesses add column if not exists suspended_at timestamptz;
alter table public.businesses add column if not exists suspension_reason text;
alter table public.employers add column if not exists suspended_at timestamptz;
alter table public.employers add column if not exists suspension_reason text;
alter table public.candidates add column if not exists suspended_at timestamptz;
alter table public.candidates add column if not exists suspension_reason text;
