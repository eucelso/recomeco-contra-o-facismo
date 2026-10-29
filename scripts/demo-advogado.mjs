// Cria UM advogado de TESTE já verificado (aparece em /advogados). Só para desenvolvimento local.
// Marcado como demonstração: `npm run demo -- --limpar` apaga junto com as outras contas de demo.
// Para entrar nele: npm run link -- demo.advogada@example.com
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const email = "demo.advogada@example.com";

if (!url || !key) {
  console.error("Faltam NEXT_PUBLIC_SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY no .env.local.");
  process.exit(1);
}
if (!/^https?:\/\/(localhost|127\.0\.0\.1)/.test(site)) {
  console.error("Por segurança este script só roda com NEXT_PUBLIC_SITE_URL apontando para localhost.");
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const { data: created, error: createError } = await db.auth.admin.createUser({
  email,
  email_confirm: true,
  user_metadata: { account_type: "lawyer", full_name: "Helena Prado (teste)", demo: true },
});
let uid = created?.user?.id;
if (createError) {
  if (!/already|registered|exists/i.test(createError.message)) {
    console.error("Erro ao criar a conta:", createError.message);
    process.exit(1);
  }
  const { data: list } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
  uid = list?.users.find((u) => u.email === email)?.id;
}
if (!uid) {
  console.error("Não achei a conta criada.");
  process.exit(1);
}

const steps = [
  ["perfil", db.from("profiles").upsert({ id: uid, role: "lawyer" })],
  [
    "advogado",
    db.from("lawyers").upsert({
      id: uid,
      full_name: "Helena Prado (teste)",
      oab_state: "PE",
      oab_number: "9999999",
      areas: ["Trabalhista", "Direitos humanos"],
      city: "Recife",
      state: "PE",
      online: true,
      accepting: true,
      contact_kind: "email",
      contact_value: email,
      bio: "Conta de TESTE. Pode ser apagada.",
      commitment_version: "2026-10-v1",
      commitment_accepted_at: new Date().toISOString(),
      verification_status: "verified",
    }),
  ],
];
for (const [label, p] of steps) {
  const { error } = await p;
  if (error) {
    console.error(`Erro em ${label}:`, error.message);
    process.exit(1);
  }
}
console.log(`✓ Advogada de teste pronta (${email}). Para entrar: npm run link -- ${email}`);
