-- Suspensão de contas, parte 4 de 4: listas do admin e a função de ocultar/reexibir.
-- Do candidato, só o mínimo para suporte (e-mail, cidade/UF, áreas, privacidade).
set lock_timeout = '4s';

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
