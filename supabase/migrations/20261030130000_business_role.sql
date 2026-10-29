-- Novo tipo de conta: dono(a) de negócio prejudicado.
-- Em arquivo próprio porque o Postgres não deixa usar um valor de enum
-- na mesma transação em que ele foi criado.
alter type public.account_role add value if not exists 'business';
