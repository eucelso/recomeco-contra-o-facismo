// Criptografa relatos confidenciais gravados ANTES da criptografia (texto puro). Idempotente: pula os já cifrados.
// Uso:  npm run relatos:criptografar            → só mostra quantos faltam
//       npm run relatos:criptografar -- --aplicar → criptografa de fato
// Requer SUPABASE_SERVICE_ROLE_KEY e DOSSIER_ENCRYPTION_KEY no .env.local (a chave do ambiente que você está atualizando).
import { createClient } from "@supabase/supabase-js";
import { encryptText, parseKey } from "../src/lib/crypto-core.ts";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const rawKey = process.env.DOSSIER_ENCRYPTION_KEY;
const apply = process.argv.includes("--aplicar");

if (!url || !serviceKey || !rawKey) {
  console.error("Faltam NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY e/ou DOSSIER_ENCRYPTION_KEY no .env.local.");
  process.exit(1);
}
const master = parseKey(rawKey);
const db = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

const { data, error } = await db.from("confidential_reports").select("candidate_id,body").not("body", "like", "v1.%");
if (error) {
  console.error("Erro ao ler:", error.message);
  process.exit(1);
}
console.log(`${data.length} relato(s) em texto puro.`);
if (!apply || data.length === 0) {
  if (data.length) console.log("Rode de novo com --aplicar para criptografar.");
  process.exit(0);
}

let done = 0;
for (const r of data) {
  const sealed = encryptText(master, `notes:${r.candidate_id}`, r.body);
  const { error: e } = await db.from("confidential_reports").update({ body: sealed }).eq("candidate_id", r.candidate_id).eq("body", r.body);
  if (e) console.error(`Falhou (${r.candidate_id}):`, e.message);
  else done++;
}
console.log(`✓ ${done} de ${data.length} criptografado(s).`);
