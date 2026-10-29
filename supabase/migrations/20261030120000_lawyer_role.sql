-- Novo tipo de conta: advogado(a) voluntário(a).
-- Fica em arquivo próprio porque o Postgres não deixa usar um valor de enum
-- na mesma transação em que ele foi criado.
alter type public.account_role add value if not exists 'lawyer';
