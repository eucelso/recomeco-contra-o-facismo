-- Excluir a própria conta (LGPD). Apaga o usuário e, em cascata, perfil, vagas, candidaturas,
-- convites, mensagens, cadastro de advogado ou de negócio e consentimentos.
-- Funciona sem a chave de serviço no servidor. Admin não pode se excluir por aqui.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if public.is_admin() then
    raise exception 'admin cannot delete own account';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
