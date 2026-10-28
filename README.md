# Recomeço

Plataforma que conecta trabalhadores perseguidos por causa do voto a contratantes que assinam o **Compromisso de Contratação Justa**. Ela também orienta sobre direitos e encaminha denúncias **apenas** para canais oficiais.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS 3 · shadcn/ui (Radix) · lucide-react · React Hook Form + Zod · Supabase (Postgres + RLS, Auth, Storage, Realtime) · Vercel.

---

## 1. Rodar localmente

Requisitos: Node 20 ou mais novo e uns 500 MB livres para as dependências.

```bash
npm install
cp .env.example .env.local   # preencha com os dados do Supabase (passo 2)
npm run dev                  # http://localhost:3000
```

Outros comandos: `npm run build`, `npm run typecheck`.

## 2. Configurar o Supabase (uma vez)

1. Crie um projeto em <https://supabase.com> (região São Paulo, `sa-east-1`).
2. **Banco:** abra *SQL Editor*, cole e rode `supabase/migrations/20261028120000_init.sql`.
   Pelo CLI também funciona: `supabase link --project-ref SEU_REF && supabase db push`.
3. **Chaves:** em *Project Settings → API*, copie `URL` e `anon key` para o `.env.local`. A `service_role` só vai nas variáveis da Vercel; ela é usada apenas para excluir contas.
4. **Auth → URL Configuration**
   - *Site URL*: `http://localhost:3000` (em produção, o domínio final).
   - *Redirect URLs*: `http://localhost:3000/**` e `https://SEU-DOMINIO/**`.
5. **Auth → Providers → Email**: deixe ativo e, enquanto você não tiver domínio próprio para o SMTP (passo 8), **desmarque "Confirm email"**. Assim o cadastro com senha funciona sem enviar e-mail. Defina o tamanho mínimo da senha em 8 e *Password requirements* como **Lowercase, uppercase letters, digits and symbols**.
   *Opcional, só com SMTP próprio:* ative `NEXT_PUBLIC_MAGIC_LINK=true` no `.env.local` para mostrar o login por link, e ajuste o template assim em *Email Templates → Magic Link*: troque o link pelo abaixo. Esse formato (token_hash) funciona mesmo quando a pessoa abre o e-mail em outro navegador ou no app do Gmail:
   ```html
   <h2>Seu link de acesso ao Recomeço</h2>
   <p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&redirect_to={{ .RedirectTo }}">Entrar no Recomeço</a></p>
   <p>O link vale por 1 hora. Se você não pediu, ignore este e-mail.</p>
   ```
   Faça o mesmo em *Confirm signup*, com `type=signup`.
6. **Auth → Providers → Google**: ative e cole o Client ID e o Secret do Google Cloud. Como redirect autorizado, use `https://SEU-PROJETO.supabase.co/auth/v1/callback`.
7. **Auth → Providers → Facebook**: crie um app em [developers.facebook.com](https://developers.facebook.com) (tipo *Consumer*, produto *Facebook Login*), copie App ID e App Secret para o Supabase e, em *Valid OAuth Redirect URIs* do Facebook, use `https://SEU-PROJETO.supabase.co/auth/v1/callback`. Para liberar o login a qualquer pessoa, o app precisa sair do modo *Development* (exige política de privacidade publicada).
8. **Auth → SMTP**: configure um provedor próprio (Resend, SES…) antes de abrir ao público. O SMTP padrão do Supabase tem limite baixo de envios.
9. **Primeiro admin** (quem aprova contratantes). Crie sua conta pelo site e depois rode no SQL Editor:
   ```sql
   update public.profiles set role = 'admin'
   where id = (select id from auth.users where email = 'seu@email.com');
   ```
   A fila de aprovação fica em `/admin/verificacoes`.

## 3. Deploy na Vercel

Importe o repositório e defina `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` e `NEXT_PUBLIC_SITE_URL`. Não há outra configuração.

---

## Dados de teste (local)

Com a `SUPABASE_SERVICE_ROLE_KEY` no `.env.local`:

```bash
npm run demo             # cria empresas, vagas, candidatos e interações e mostra links de acesso
npm run demo -- --links  # só gera links novos (cada link vale 1 hora, uso único)
npm run demo -- --limpar # apaga todas as contas de demonstração
npm run link -- email@exemplo.com   # link de acesso para qualquer conta, sem enviar e-mail
```

## Mapa de telas

| Rota | Tela |
| --- | --- |
| `/` | Landing (responsiva) com números ao vivo (`public_stats`) |
| `/entrar`, `/entrar/tipo` | E-mail e senha, Google, Facebook (link mágico opcional) e escolha do tipo de conta |
| `/cadastro/candidato` | Cadastro em 4 etapas, currículo PDF e relato confidencial |
| `/cadastro/contratante` | Dados da empresa, validação de CNPJ/CPF e Compromisso |
| `/contratante/verificacao` | Em verificação → selo Empresa Comprometida |
| `/combina` | **Combina**: candidato desliza vagas, empresa desliza perfis anônimos; os dois dizem sim → dá liga e o chat abre |
| `/vagas` | Mural com filtros, skeleton e estado vazio (o “Tenho interesse” aqui conta como swipe no Combina) |
| `/contratante/candidatos[/código]` | Busca e perfil anônimo, com convite (Dialog) |
| `/mensagens[/id]` | Chat em tempo real (só após o aceite) |
| `/direitos` | Guia de direitos e canais oficiais |
| `/contratante` | Painel do contratante |
| `/painel` | Painel do candidato: convites e candidaturas |
| `/privacidade` | Privacidade, exportar dados (JSON) e excluir conta |
| `/admin/verificacoes` | Aprovação de contratantes |

## Privacidade: como está garantida

- **Opinião política não é coletada.** Não existe coluna para isso no banco.
- **Relato confidencial** fica na tabela `confidential_reports`, com política owner-only. Nenhum outro papel tem acesso.
- **Perfil anônimo:** contratantes nunca leem a tabela `candidates`. Eles só usam `search_candidates()` e `candidate_card()`, que escondem nome, empregadores e currículo até existir um convite aceito.
- **Verificação obrigatória:** contratante sem `verification_status = 'verified'` não publica vagas, não busca nem convida. Um trigger impede que ele mesmo se aprove.
- **Currículo:** bucket privado, só PDF de até 5 MB. O contratante só abre por URL assinada de 5 minutos, e só depois do aceite.
- **Chat:** RLS e Realtime liberam mensagens apenas em conversas aceitas. O candidato pode revogar o acesso a qualquer momento.
- **LGPD:** exportação completa em JSON, exclusão em cascata (incluindo arquivos) e histórico de consentimentos.
- **Sem listas de denúncia:** o sistema não guarda acusações contra pessoas ou empresas.
- **Fontes auto-hospedadas** (Anton e Archivo, OFL): o site não faz requisições ao Google Fonts.

## Antes de lançar

- Revisar com assessoria jurídica a página `/direitos`, a `/politica-de-privacidade` (preencher os campos `[…]`) e o texto do Compromisso (`src/lib/constants.ts`).
- Definir o processo humano de verificação de contratantes (o que conferir na Receita e prazos).
- Rate limiting e captcha no login e cadastro (Supabase Auth → Rate limits / Captcha).
- Gerar tipos do banco: `npm run db:types` (requer o Supabase CLI logado).
