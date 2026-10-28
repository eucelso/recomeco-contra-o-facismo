-- Cadastros de hoje — rode no SQL Editor do Supabase.
-- Para outro dia, troque current_date_sp por uma data: date '2026-10-28'.
-- Privacidade: não lê o relato confidencial; CPF aparece mascarado.

with params as (
  select (now() at time zone 'America/Sao_Paulo')::date as current_date_sp
)
select
  to_char(u.created_at at time zone 'America/Sao_Paulo', 'HH24:MI') as hora,
  u.email,
  case p.role
    when 'candidate' then 'Candidato'
    when 'employer'  then 'Contratante'
    when 'admin'     then 'Admin'
    else '—'
  end as tipo,
  coalesce(
    c.full_name || ' (#' || c.public_code || ')',
    e.display_name || ' · ' || upper(e.kind) || ' ' ||
      case when e.kind = 'cpf'
        then '***.' || substr(e.document, 4, 3) || '.***-**'
        else regexp_replace(e.document, '^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$', '\1.\2.\3/\4-\5')
      end,
    '—'
  ) as nome,
  coalesce(c.city || '/' || c.state, e.city || '/' || e.state, '—') as local,
  case
    when p.role = 'candidate' then
      case
        when c.id is null then 'não começou o cadastro'
        when c.completed_at is not null then trim('completo · ' || coalesce(c.headline, ''))
        else 'etapa ' || c.onboarding_step || ' de 4'
      end
    when p.role = 'employer' then
      case e.verification_status
        when 'pending'  then 'em verificação'
        when 'verified' then 'verificada'
        when 'rejected' then 'reprovada'
        else 'não começou o cadastro'
      end
    when p.role = 'admin' then 'admin'
    else 'sem tipo de conta'
  end as situacao,
  case when u.email_confirmed_at is not null then 'sim' else 'não' end as confirmado
from auth.users u
cross join params
left join public.profiles   p on p.id = u.id
left join public.candidates c on c.id = u.id
left join public.employers  e on e.id = u.id
where (u.created_at at time zone 'America/Sao_Paulo')::date = params.current_date_sp
order by u.created_at;

-- Resumo do dia (selecione e rode separado, se quiser)
-- select
--   count(*) as total,
--   count(*) filter (where p.role = 'candidate') as candidatos,
--   count(*) filter (where p.role = 'employer')  as contratantes,
--   count(*) filter (where p.role is null)       as sem_tipo,
--   count(*) filter (where e.verification_status = 'pending') as empresas_aguardando
-- from auth.users u
-- left join public.profiles  p on p.id = u.id
-- left join public.employers e on e.id = u.id
-- where (u.created_at at time zone 'America/Sao_Paulo')::date = (now() at time zone 'America/Sao_Paulo')::date;
