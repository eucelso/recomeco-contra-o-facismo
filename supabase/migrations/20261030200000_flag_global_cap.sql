-- Denúncias de relato: além do limite por pessoa (o código vem do chamador e pode ser trocado),
-- um teto geral por hora. Segura quem tente inflar o contador chamando a função direto.
create or replace function public.flag_public_report(p_id uuid, p_bucket text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  added int;
begin
  if coalesce(p_bucket, '') = '' then
    raise exception 'invalid';
  end if;
  if (select count(*) from public.report_throttle
       where bucket = p_bucket and kind = 'flag' and created_at > now() - interval '1 hour') >= 10 then
    raise exception 'rate_limit';
  end if;
  if (select count(*) from public.report_throttle
       where kind = 'flag' and created_at > now() - interval '1 hour') >= 200 then
    raise exception 'busy';
  end if;
  if not exists (select 1 from public.public_reports where id = p_id and status = 'approved') then
    return false;
  end if;

  insert into public.report_flags (report_id, bucket) values (p_id, p_bucket) on conflict do nothing;
  get diagnostics added = row_count;
  if added > 0 then
    update public.public_reports set flags = flags + 1 where id = p_id;
  end if;
  insert into public.report_throttle (bucket, kind) values (p_bucket, 'flag');
  return true;
end;
$$;
