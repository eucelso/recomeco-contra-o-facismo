// Cria contas e dados de DEMONSTRAÇÃO e imprime links de acesso (sem enviar e-mail).
// Só para desenvolvimento local. Requer NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local.
//
// Uso:
//   npm run demo              → cria/atualiza os dados e mostra os links de acesso
//   npm run demo -- --links   → só gera links novos (cada link vale 1 hora, uso único)
//   npm run demo -- --limpar  → apaga TODAS as contas de demonstração (e tudo ligado a elas)
//
// Todas as contas usam e-mails @example.com (domínio reservado: ninguém recebe nada).
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const args = process.argv.slice(2);

if (!url || !key) {
  console.error("Faltam NEXT_PUBLIC_SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY no .env.local.");
  process.exit(1);
}
if (!/^https?:\/\/(localhost|127\.0\.0\.1)/.test(site)) {
  console.error("Por segurança este script só roda com NEXT_PUBLIC_SITE_URL apontando para localhost.");
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

// ---------------------------------------------------------------------------
// Dados
// ---------------------------------------------------------------------------
function cnpj(base12) {
  const d = base12.split("").map(Number);
  const dv = (len) => {
    const w = len === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const s = w.reduce((a, wi, i) => a + d[i] * wi, 0) % 11;
    return s < 2 ? 0 : 11 - s;
  };
  d.push(dv(12));
  d.push(dv(13));
  return d.join("");
}
const id = (n) => `d0000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

const EMPLOYERS = [
  { email: "demo.cooperativa@example.com", display_name: "Cooperativa Mãos da Terra", legal_name: "Cooperativa Mãos da Terra Ltda.", sector: "Agricultura familiar e alimentos", city: "Olinda", state: "PE", responsible_name: "Rosângela Becker", document: cnpj("481927360001"), verified: true },
  { email: "demo.restaurante@example.com", display_name: "Restaurante Sabor de Casa", legal_name: "Sabor de Casa Refeições ME", sector: "Restaurantes e alimentação", city: "Recife", state: "PE", responsible_name: "Ana Souza", document: cnpj("372615840001"), verified: true },
  { email: "demo.farmacia@example.com", display_name: "Rede Popular de Farmácias", legal_name: "Rede Popular Farma S.A.", sector: "Comércio e varejo", city: "Recife", state: "PE", responsible_name: "Paulo Teixeira", document: cnpj("593018270001"), verified: true },
  { email: "demo.metalurgica@example.com", display_name: "Metalúrgica União", legal_name: "União Metais Ltda.", sector: "Indústria", city: "Jaboatão", state: "PE", responsible_name: "Sérgio Alves", document: cnpj("614283950001"), verified: false },
];

const JOBS = [
  { id: id(101), emp: 0, title: "Cozinheira(o) comunitária(o)", area: "Alimentação", city: "Olinda", state: "PE", modality: "presencial", contract_type: "clt", salary_min: 2300, benefits: "Vale-transporte · refeição no local · cesta da cooperativa", description: "Preparar o almoço da cozinha comunitária da cooperativa (cerca de 120 refeições por dia), com produtos da agricultura familiar. Equipe de 3 pessoas, turno da manhã." },
  { id: id(102), emp: 0, title: "Assistente administrativo(a)", area: "Administrativo", city: "Olinda", state: "PE", modality: "hibrido", contract_type: "clt", salary_min: 2400, benefits: "VT · VR · plano de saúde", description: "Controle de notas, planilhas de entrega dos associados e atendimento por telefone. Três dias no escritório, dois em casa." },
  { id: id(103), emp: 1, title: "Auxiliar de cozinha", area: "Alimentação", city: "Recife", state: "PE", modality: "presencial", contract_type: "clt", salary_min: 1900, benefits: "VT · refeição no local · folga aos domingos", description: "Apoio no pré-preparo e na montagem dos pratos do almoço, organização da cozinha e controle de validade. Ambiente familiar." },
  { id: id(104), emp: 1, title: "Garçom / Garçonete", area: "Alimentação", city: "Recife", state: "PE", modality: "presencial", contract_type: "temporario", salary_min: 1700, salary_max: 2100, benefits: "Gorjeta dividida · refeição", description: "Atendimento no salão no almoço e no jantar de sexta e sábado. Contrato de 3 meses, com chance de efetivação." },
  { id: id(105), emp: 2, title: "Atendimento ao cliente", area: "Comércio", city: null, state: null, modality: "remoto", contract_type: "clt", salary_min: 1980, benefits: "Plano de saúde · auxílio internet · VR", description: "Atendimento por chat e telefone a clientes da rede, com treinamento pago nas duas primeiras semanas. A empresa fornece o computador." },
  { id: id(106), emp: 2, title: "Balconista de farmácia", area: "Comércio", city: "Recife", state: "PE", modality: "presencial", contract_type: "clt", salary_min: 1850, benefits: "VT · VR · desconto em medicamentos", description: "Atendimento no balcão, organização de gôndolas e apoio ao caixa. Escala 6x1." },
];

const CANDIDATES = [
  { email: "demo.carla@example.com", full_name: "Carla Mendes da Silva", preferred_name: "Carla", city: "Recife", state: "PE", headline: "Cozinheira", areas: ["Alimentação"], skills: ["Cozinha regional", "Pré-preparo", "Controle de estoque", "Liderança de equipe"], years_experience: 9, shifts: ["Manhã", "Tarde"], modalities: ["presencial"], contract_types: ["clt", "temporario"], available_from: "Imediata", education: "Médio completo", courses: "Gastronomia (SENAC)",
    exps: [{ role_title: "Chefe de cozinha", employer_kind: "Restaurante de médio porte", employer_name: "Bistrô do Cais", start_year: 2019, end_year: 2026, description: "Coordenava 4 pessoas, cardápio semanal e compras." }, { role_title: "Cozinheira", employer_kind: "Cozinha industrial", employer_name: "Refeições Coletivas PE", start_year: 2015, end_year: 2019, description: "600 refeições por dia no turno da manhã." }] },
  { email: "demo.jose@example.com", full_name: "José Ribeiro Santos", preferred_name: "José", city: "Olinda", state: "PE", headline: "Operador de máquinas", areas: ["Indústria", "Administrativo"], skills: ["NR-12", "Empilhadeira", "Controle de produção"], years_experience: 14, shifts: ["Manhã", "Noite"], modalities: ["presencial"], contract_types: ["clt"], available_from: "Em 15 dias", education: "Técnico", courses: "Técnico em mecânica (SENAI)",
    exps: [{ role_title: "Operador de máquinas", employer_kind: "Indústria metalúrgica", employer_name: "Metais do Nordeste", start_year: 2012, end_year: 2026, description: "Operação de prensas e controle de qualidade da linha." }] },
  { email: "demo.eva@example.com", full_name: "Eva Rocha Lima", preferred_name: "Eva", city: "Recife", state: "PE", headline: "Vendedora", areas: ["Comércio"], skills: ["Atendimento", "Caixa", "Vendas"], years_experience: 6, shifts: ["Manhã", "Tarde"], modalities: ["presencial", "remoto"], contract_types: ["clt"], available_from: "Imediata", education: "Médio completo", courses: null,
    exps: [{ role_title: "Vendedora", employer_kind: "Loja de departamentos", employer_name: "Magazine Central", start_year: 2020, end_year: 2026, description: "Metas mensais, atendimento e organização de vitrine." }] },
  { email: "demo.marcos@example.com", full_name: "Marcos Vinícius Lima", preferred_name: "Marcos", city: "Olinda", state: "PE", headline: "Auxiliar administrativo", areas: ["Administrativo", "Comércio"], skills: ["Excel", "Atendimento", "Notas fiscais"], years_experience: 5, shifts: ["Manhã", "Tarde"], modalities: ["presencial", "hibrido"], contract_types: ["clt", "pj"], available_from: "Imediata", education: "Superior incompleto", courses: "Rotinas administrativas (SENAC)",
    exps: [{ role_title: "Auxiliar administrativo", employer_kind: "Distribuidora de bebidas", employer_name: "Distribuidora Litoral", start_year: 2021, end_year: 2026, description: "Contas a pagar, notas fiscais e atendimento a clientes." }] },
];

const ADMIN = { email: "demo.admin@example.com", name: "Admin Demo" };

// ---------------------------------------------------------------------------
// Utilitários
// ---------------------------------------------------------------------------
async function allUsers() {
  const out = [];
  for (let page = 1; ; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    out.push(...data.users);
    if (data.users.length < 1000) break;
  }
  return out;
}

async function ensureUser(email, accountType, name, existing) {
  const found = existing.find((u) => u.email === email);
  if (found) return found.id;
  const { data, error } = await db.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { account_type: accountType, full_name: name, demo: true },
  });
  if (error) throw new Error(`${email}: ${error.message}`);
  return data.user.id;
}

async function must(promise, label) {
  const { error, data } = await promise;
  if (error) throw new Error(`${label}: ${error.message}`);
  return data;
}

async function link(email) {
  const { data, error } = await db.auth.admin.generateLink({ type: "magiclink", email });
  if (error) return `(erro: ${error.message})`;
  return `${site}/auth/confirm?token_hash=${data.properties.hashed_token}&type=magiclink`;
}

// ---------------------------------------------------------------------------
// Limpar
// ---------------------------------------------------------------------------
if (args.includes("--limpar")) {
  const users = (await allUsers()).filter((u) => u.user_metadata?.demo === true);
  for (const u of users) {
    const { data: files } = await db.storage.from("resumes").list(u.id);
    if (files?.length) await db.storage.from("resumes").remove(files.map((f) => `${u.id}/${f.name}`));
    await db.auth.admin.deleteUser(u.id);
  }
  console.log(`✓ ${users.length} conta(s) de demonstração apagada(s), com todos os dados ligados a elas.`);
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Criar / atualizar
// ---------------------------------------------------------------------------
const accounts = [];

if (!args.includes("--links")) {
  const existing = await allUsers();

  // Admin
  const adminId = await ensureUser(ADMIN.email, "candidate", ADMIN.name, existing);
  await must(db.from("profiles").upsert({ id: adminId, role: "admin" }), "admin");

  // Contratantes
  const empIds = [];
  for (const e of EMPLOYERS) {
    const uid = await ensureUser(e.email, "employer", e.responsible_name, existing);
    empIds.push(uid);
    await must(db.from("profiles").upsert({ id: uid, role: "employer" }), "perfil empresa");
    await must(
      db.from("employers").upsert({
        id: uid,
        kind: "cnpj",
        document: e.document,
        display_name: e.display_name,
        legal_name: e.legal_name,
        sector: e.sector,
        city: e.city,
        state: e.state,
        responsible_name: e.responsible_name,
        commitment_version: "2026-10-v1",
        commitment_accepted_at: new Date().toISOString(),
        verification_status: e.verified ? "verified" : "pending",
      }),
      `empresa ${e.display_name}`,
    );
  }

  // Vagas
  for (const j of JOBS) {
    const { emp, ...row } = j;
    await must(db.from("jobs").upsert({ ...row, employer_id: empIds[emp], salary_max: row.salary_max ?? null, status: "active" }), `vaga ${j.title}`);
  }

  // Candidatos
  const candIds = [];
  for (const c of CANDIDATES) {
    const { email, exps, ...row } = c;
    const uid = await ensureUser(email, "candidate", c.full_name, existing);
    candIds.push(uid);
    await must(db.from("profiles").upsert({ id: uid, role: "candidate" }), "perfil candidato");
    await must(db.from("candidates").upsert({ id: uid, ...row, onboarding_step: 5, completed_at: new Date().toISOString() }), `candidato ${c.full_name}`);
    await must(db.from("candidate_experiences").delete().eq("candidate_id", uid), "limpar experiências");
    await must(db.from("candidate_experiences").insert(exps.map((x, i) => ({ ...x, candidate_id: uid, position: i }))), "experiências");
  }
  const [carla, , eva, marcos] = candIds;
  const [coop, restaurante, farmacia] = empIds;

  // Interações prontas para a demo
  // 1) A cooperativa já disse "sim" para a Carla na vaga de cozinheira → Carla desliza para a direita = DEU LIGA
  await must(db.from("swipes").upsert({ job_id: id(101), candidate_id: carla, side: "employer", choice: "like" }, { onConflict: "job_id,candidate_id,side" }), "swipe coop→carla");
  // 2) A Eva já disse "tenho interesse" no atendimento remoto → a farmácia desliza a Eva para a direita = DEU LIGA
  await must(db.from("swipes").upsert({ job_id: id(105), candidate_id: eva, side: "candidate", choice: "like" }, { onConflict: "job_id,candidate_id,side" }), "swipe eva→farmácia");
  await must(db.from("applications").upsert({ job_id: id(105), candidate_id: eva }, { onConflict: "job_id,candidate_id", ignoreDuplicates: true }), "candidatura eva");
  // 3) Uma conversa já aberta: cooperativa × Marcos (assistente administrativo)
  const { data: openContact } = await db
    .from("contact_requests")
    .select("id")
    .eq("employer_id", coop)
    .eq("candidate_id", marcos)
    .in("status", ["pending", "accepted"])
    .maybeSingle();
  let contactId = openContact?.id;
  if (!contactId) {
    const created = await must(
      db.from("contact_requests").insert({ employer_id: coop, candidate_id: marcos, job_id: id(102), status: "accepted", responded_at: new Date().toISOString() }).select("id").single(),
      "contato coop×marcos",
    );
    contactId = created.id;
    await must(db.from("applications").upsert({ job_id: id(102), candidate_id: marcos, status: "in_conversation" }, { onConflict: "job_id,candidate_id" }), "candidatura marcos");
    await must(
      db.from("messages").insert([
        { contact_id: contactId, sender_id: coop, body: "Oi, Marcos! Gostamos da sua experiência com notas fiscais. Podemos marcar uma conversa?" },
        { contact_id: contactId, sender_id: marcos, body: "Oi! Fico feliz. Posso sim, quais horários vocês têm?" },
      ]),
      "mensagens",
    );
  }
  // 4) Um convite pendente: restaurante → Carla (aparece no painel dela para aceitar/recusar)
  const { data: pend } = await db.from("contact_requests").select("id").eq("employer_id", restaurante).eq("candidate_id", carla).in("status", ["pending", "accepted"]).maybeSingle();
  if (!pend) {
    await must(
      db.from("contact_requests").insert({ employer_id: restaurante, candidate_id: carla, job_id: id(103), message: "Seu perfil de cozinha regional chamou nossa atenção. Topa conversar?" }),
      "convite restaurante→carla",
    );
  }
  void farmacia;
  console.log("✓ Dados de demonstração criados/atualizados.\n");
}

// ---------------------------------------------------------------------------
// Links
// ---------------------------------------------------------------------------
accounts.push({ tipo: "Admin", nome: ADMIN.name, email: ADMIN.email, dica: "Aprovar a Metalúrgica em /admin/verificacoes" });
for (const e of EMPLOYERS) {
  accounts.push({
    tipo: e.verified ? "Empresa" : "Empresa (em verificação)",
    nome: e.display_name,
    email: e.email,
    dica:
      e.display_name === "Rede Popular de Farmácias"
        ? "Combina → vaga Atendimento → deslize a Eva para a direita: dá liga"
        : e.display_name === "Cooperativa Mãos da Terra"
          ? "Já tem conversa aberta com o Marcos"
          : e.verified
            ? "Painel, vagas e Combina"
            : "Ainda sem acesso a candidatos",
  });
}
for (const c of CANDIDATES) {
  accounts.push({
    tipo: "Candidato",
    nome: c.full_name,
    email: c.email,
    dica:
      c.preferred_name === "Carla"
        ? "Combina → deslize “Cozinheira(o) comunitária(o)” para a direita: dá liga · tem 1 convite no painel"
        : c.preferred_name === "Marcos"
          ? "Já tem conversa aberta em Mensagens"
          : "Combina e mural de vagas",
  });
}

console.log("Contas de demonstração — abra cada link numa janela diferente (normal / anônima).");
console.log("Cada link vale 1 hora e funciona uma vez. Para gerar novos: npm run demo -- --links\n");
for (const a of accounts) {
  console.log(`■ ${a.tipo} — ${a.nome} <${a.email}>`);
  console.log(`  ${a.dica}`);
  console.log(`  ${await link(a.email)}\n`);
}
