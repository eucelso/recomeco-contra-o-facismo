// Lista os cadastros feitos hoje (ou num dia/intervalo). Uso administrativo local.
// Requer NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local.
//
// Uso:
//   npm run cadastros                  → hoje (fuso do seu computador)
//   npm run cadastros -- 2026-10-28    → um dia específico
//   npm run cadastros -- --dias 7      → últimos 7 dias
//   npm run cadastros -- --csv         → saída em CSV (dá para combinar com as opções acima)
//
// Privacidade: o script NUNCA lê o relato confidencial, e não existe dado político no banco.
import { createClient } from "@supabase/supabase-js";

const args = process.argv.slice(2);
const csv = args.includes("--csv");
const diasIdx = args.indexOf("--dias");
const dias = diasIdx >= 0 ? Number(args[diasIdx + 1]) : null;
const dia = args.find((a) => /^\d{4}-\d{2}-\d{2}$/.test(a));

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Faltam NEXT_PUBLIC_SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY no .env.local.");
  process.exit(1);
}
if (dias !== null && (!Number.isInteger(dias) || dias < 1 || dias > 365)) {
  console.error("--dias precisa ser um número entre 1 e 365.");
  process.exit(1);
}

// Intervalo [inicio, fim) no fuso local
const inicio = dia ? new Date(`${dia}T00:00:00`) : new Date(new Date().setHours(0, 0, 0, 0));
if (dias) inicio.setDate(inicio.getDate() - (dias - 1));
const fim = dia ? new Date(new Date(`${dia}T00:00:00`).getTime() + 86400000) : new Date(new Date().setHours(24, 0, 0, 0));

const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

// 1. Contas do Auth criadas no intervalo (paginado)
const users = [];
for (let page = 1; ; page++) {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
  if (error) {
    console.error("Erro ao listar contas:", error.message);
    process.exit(1);
  }
  users.push(...data.users.filter((u) => new Date(u.created_at) >= inicio && new Date(u.created_at) < fim));
  if (data.users.length < 1000) break;
}
users.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
const ids = users.map((u) => u.id);

// 2. Perfis (sem relato confidencial)
const pick = async (table, cols) =>
  ids.length ? ((await admin.from(table).select(cols).in("id", ids)).data ?? []) : [];
const [profiles, candidates, employers] = await Promise.all([
  pick("profiles", "id,role"),
  pick("candidates", "id,public_code,full_name,city,state,headline,completed_at,onboarding_step"),
  pick("employers", "id,kind,document,display_name,city,state,verification_status"),
]);
const byId = (rows) => new Map(rows.map((r) => [r.id, r]));
const P = byId(profiles), C = byId(candidates), E = byId(employers);

const maskDoc = (kind, d) =>
  kind === "cpf" ? `***.${d.slice(3, 6)}.***-**` : d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
const TIPO = { candidate: "Candidato", employer: "Contratante", admin: "Admin" };
const VERIF = { pending: "em verificação", verified: "verificada", rejected: "reprovada" };

const rows = users.map((u) => {
  const role = P.get(u.id)?.role ?? null;
  const c = C.get(u.id);
  const e = E.get(u.id);
  let nome = "—", local = "—", situacao = "sem tipo de conta";
  if (role === "candidate") {
    nome = c ? `${c.full_name} (#${c.public_code})` : "—";
    local = c ? `${c.city}/${c.state}` : "—";
    situacao = !c ? "não começou o cadastro" : c.completed_at ? `completo · ${c.headline ?? ""}`.trim() : `etapa ${c.onboarding_step} de 4`;
  } else if (role === "employer") {
    nome = e ? `${e.display_name} · ${e.kind.toUpperCase()} ${maskDoc(e.kind, e.document)}` : "—";
    local = e ? `${e.city}/${e.state}` : "—";
    situacao = e ? VERIF[e.verification_status] : "não começou o cadastro";
  } else if (role === "admin") {
    situacao = "admin";
  }
  return {
    hora: new Date(u.created_at).toLocaleString("pt-BR", { dateStyle: dias ? "short" : undefined, timeStyle: "short" }),
    email: u.email ?? "—",
    tipo: role ? TIPO[role] : "—",
    nome,
    local,
    situacao,
    confirmado: u.email_confirmed_at ? "sim" : "não",
  };
});

const periodo = dias
  ? `últimos ${dias} dias (${inicio.toLocaleDateString("pt-BR")} a hoje)`
  : inicio.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });

if (csv) {
  const head = Object.keys(rows[0] ?? { hora: 0, email: 0, tipo: 0, nome: 0, local: 0, situacao: 0, confirmado: 0 });
  const esc = (v) => `"${String(v).replaceAll('"', '""')}"`;
  console.log(head.join(","));
  for (const r of rows) console.log(head.map((h) => esc(r[h])).join(","));
  process.exit(0);
}

console.log(`\nCadastros — ${periodo}\n`);
if (!rows.length) {
  console.log("Nenhum cadastro nesse período.\n");
  process.exit(0);
}
console.table(rows);
const count = (t) => rows.filter((r) => r.tipo === t).length;
const pendentes = employers.filter((e) => e.verification_status === "pending").length;
console.log(
  `Total: ${rows.length} · Candidatos: ${count("Candidato")} · Contratantes: ${count("Contratante")} · Sem tipo: ${count("—")}` +
    (pendentes ? `\n→ ${pendentes} empresa(s) aguardando verificação em /admin/verificacoes` : "") +
    "\n",
);
