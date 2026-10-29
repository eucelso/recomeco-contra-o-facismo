-- Admin exclui a conta de outra pessoa (pedido de remoção, conta de teste, abuso).
-- Apaga o usuário e, em cascata, perfil, vagas, candidaturas, convites, mensagens e cadastros.
-- Não exclui administradores nem a si mesmo.
create or replace function public.admin_delete_account(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  n int;
begin
  if not public.is_admin() then
    raise exception 'not allowed';
  end if;
  if p_id = auth.uid() then
    raise exception 'cannot delete self';
  end if;
  if exists (select 1 from public.profiles where id = p_id and role = 'admin') then
    raise exception 'cannot delete admin';
  end if;
  delete from auth.users where id = p_id;
  get diagnostics n = row_count;
  return n > 0;
end;
$$;

revoke execute on function public.admin_delete_account(uuid) from public, anon;
grant execute on function public.admin_delete_account(uuid) to authenticated;
