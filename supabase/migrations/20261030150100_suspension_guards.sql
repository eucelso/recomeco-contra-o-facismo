-- Suspensão de contas, parte 2 de 4: só o admin mexe na suspensão (funções dos gatilhos).
-- Candidato suspenso fica sempre com os convites pausados.
set lock_timeout = '4s';

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

