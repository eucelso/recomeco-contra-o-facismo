-- Permite que o backend confiável (service_role, scripts de admin e o SQL Editor do painel)
-- aprove contratantes. Usuários comuns continuam sem poder mudar o status de verificação.

create or replace function public.is_trusted_backend()
returns boolean
language sql
stable
set search_path = ''
as $$
  select
    coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role', '') = 'service_role'
    or (
      coalesce(current_setting('request.jwt.claims', true), '') = ''
      and session_user in ('postgres', 'supabase_admin')
    );
$$;

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
    elsif new.verification_status = 'verified' and new.verified_at is null then
      new.verified_at := now();
    end if;
    return new;
  end if;

  if not trusted then
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
