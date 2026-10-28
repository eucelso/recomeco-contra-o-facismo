// Gera um link de acesso SEM enviar e-mail (contorna o limite do SMTP de teste do Supabase).
// Só para desenvolvimento local. Requer SUPABASE_SERVICE_ROLE_KEY no .env.local.
//
// Uso:
//   npm run link -- email@exemplo.com                 → entra numa conta existente
//   npm run link -- email@exemplo.com candidate       → cria (se preciso) como candidato
//   npm run link -- email@exemplo.com employer        → cria (se preciso) como contratante
//   npm run link -- email@exemplo.com admin           → cria (se preciso) e torna admin
import { createClient } from "@supabase/supabase-js";

const [email, tipo] = process.argv.slice(2);
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

if (!email) {
  console.error("Informe o e-mail. Ex.: npm run link -- voce+admin@gmail.com admin");
  process.exit(1);
}
if (!url || !key) {
  console.error("Faltam NEXT_PUBLIC_SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY no .env.local.");
  process.exit(1);
}
if (!/^https?:\/\/(localhost|127\.0\.0\.1)/.test(site)) {
  console.error("Por segurança este script só roda com NEXT_PUBLIC_SITE_URL apontando para localhost.");
  process.exit(1);
}
if (tipo && !["candidate", "employer", "admin"].includes(tipo)) {
  console.error('Tipo deve ser "candidate", "employer" ou "admin".');
  process.exit(1);
}

const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

// Cria a conta se ainda não existir (já confirmada, sem e-mail)
const signupType = tipo === "employer" ? "employer" : tipo ? "candidate" : undefined;
const { error: createError } = await admin.auth.admin.createUser({
  email,
  email_confirm: true,
  user_metadata: signupType ? { account_type: signupType } : {},
});
if (createError && !/already|registered|exists/i.test(createError.message)) {
  console.error("Erro ao criar a conta:", createError.message);
  process.exit(1);
}

const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
if (error) {
  console.error("Erro ao gerar o link:", error.message);
  process.exit(1);
}

if (tipo === "admin") {
  const { error: roleError } = await admin.from("profiles").upsert({ id: data.user.id, role: "admin" });
  if (roleError) console.error("Conta criada, mas não deu para torná-la admin:", roleError.message);
  else console.log("✓ Conta marcada como admin.");
}

const link = `${site}/auth/confirm?token_hash=${data.properties.hashed_token}&type=magiclink${tipo && tipo !== "admin" ? `&tipo=${tipo}` : ""}`;
console.log("\nAbra este link no navegador (vale 1 hora, uso único):\n");
console.log(link + "\n");
