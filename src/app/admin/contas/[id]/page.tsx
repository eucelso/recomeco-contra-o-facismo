import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageTitle, SectionTitle } from "@/components/layout/app-shell";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { VERIFICATION_LABEL, type AccountTab } from "@/lib/admin-accounts";
import { requireRole } from "@/lib/auth";
import { MODALITIES } from "@/lib/constants";

export const metadata: Metadata = { title: "Detalhes da conta", robots: { index: false } };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Account = { id: string; email: string; role: string | null; created_at: string; last_sign_in_at: string | null };
type Row = Record<string, unknown>;

const ROLE: Record<string, { label: string; tab: AccountTab }> = {
  lawyer: { label: "Advogado(a)", tab: "advogados" },
  candidate: { label: "Procura trabalho", tab: "candidatos" },
  employer: { label: "Empresa", tab: "empresas" },
  business: { label: "Negócio prejudicado", tab: "negocios" },
};

// Rótulo de cada coluna; a que não estiver aqui aparece com o nome técnico, para nada ficar escondido.
const LABEL: Record<string, string> = {
  kind: "Tipo de documento",
  document: "Documento",
  legal_name: "Razão social",
  display_name: "Nome de exibição",
  full_name: "Nome completo",
  sector: "Setor",
  category: "Categoria",
  city: "Cidade",
  state: "Estado",
  neighborhood: "Bairro",
  address: "Endereço",
  responsible_name: "Responsável",
  oab_state: "OAB (UF)",
  oab_number: "OAB (número)",
  areas: "Áreas",
  online: "Atende online",
  accepting: "Aceita novos casos",
  contact_kind: "Tipo de contato",
  contact_value: "Contato",
  bio: "Apresentação",
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  website: "Site",
  hours: "Horário",
  story: "História",
  visible: "Aparece na lista",
  headline: "Título do perfil",
  anonymous: "Perfil anônimo",
  invites_paused: "Convites pausados",
  completed: "Cadastro completo",
  commitment_version: "Versão do compromisso aceito",
  commitment_accepted_at: "Compromisso aceito em",
  verification_status: "Verificação",
  verified_at: "Verificada em",
  rejection_reason: "Motivo da reprovação",
  suspended_at: "Oculta desde",
  suspension_reason: "Motivo da ocultação",
  created_at: "Cadastro criado em",
  updated_at: "Atualizado em",
};
// Já aparecem em outro bloco ou não ajudam a ler.
const HIDDEN = new Set(["id", "email", "last_sign_in_at", "created_at"]);
const DATES = new Set(["commitment_accepted_at", "verified_at", "suspended_at", "updated_at", "created_at", "last_sign_in_at"]);
const DOCS = new Set(["document"]);

const when = (d: string) => new Date(d).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

function show(key: string, v: unknown, row: Row): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "Sim" : "Não";
  if (Array.isArray(v)) return v.length ? v.join(", ") : "—";
  if (DATES.has(key)) return when(String(v));
  if (key === "verification_status") return VERIFICATION_LABEL[String(v)] ?? String(v);
  if (key === "kind" && (v === "cnpj" || v === "cpf")) return String(v).toUpperCase();
  if (DOCS.has(key)) {
    const d = String(v);
    return row.kind === "cnpj" ? d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5") : d.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
  }
  return String(v);
}

function Fields({ row, extra = [] }: { row: Row; extra?: [string, string][] }) {
  const entries: [string, string][] = [
    ...Object.entries(row)
      .filter(([k]) => !HIDDEN.has(k))
      .map(([k, v]) => [LABEL[k] ?? k, show(k, v, row)] as [string, string]),
    ...extra,
  ];
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-[minmax(0,14rem)_1fr]">
      {entries.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-xs font-black uppercase sm:pt-0.5">{k}</dt>
          <dd className="whitespace-pre-line break-words text-sm font-semibold">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export default async function ContaDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await requireRole("admin");
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const { data: accounts } = await supabase.rpc("admin_accounts");
  const account = ((accounts ?? []) as Account[]).find((a) => a.id === id);
  if (!account) notFound();

  const role = account.role ? ROLE[account.role] : undefined;
  let row: Row | null = null;
  let title = account.email;
  let suspendedAt: string | null = null;
  let jobs: { id: string; title: string; city: string | null; modality: string }[] = [];

  if (account.role === "lawyer" || account.role === "employer" || account.role === "business") {
    const table = account.role === "lawyer" ? "lawyers" : account.role === "employer" ? "employers" : "businesses";
    const { data } = await supabase.from(table).select("*").eq("id", id).maybeSingle();
    row = (data as Row | null) ?? null;
    if (row) {
      title = String(row.full_name ?? row.display_name ?? account.email);
      suspendedAt = (row.suspended_at as string | null) ?? null;
    }
    if (account.role === "employer") {
      const { data } = await supabase.from("job_listings").select("id,title,city,modality").eq("employer_id", id).limit(50);
      jobs = data ?? [];
    }
  } else if (account.role === "candidate") {
    // O perfil de quem procura trabalho só chega ao admin como a lista já mostra: nada de nome, currículo, dossiê ou relato.
    const { data } = await supabase.rpc("admin_candidates");
    const c = ((data ?? []) as Row[]).find((r) => r.id === id);
    if (c) {
      row = c;
      title = String(c.headline || "Perfil sem título");
      suspendedAt = (c.suspended_at as string | null) ?? null;
    }
  }

  const status = suspendedAt ? "Oculta" : row ? (account.role === "candidate" ? (row.completed ? "Perfil completo" : "Perfil incompleto") : (VERIFICATION_LABEL[String(row.verification_status)] ?? "—")) : "Cadastro incompleto";
  const back = `/admin/contas?tipo=${role?.tab ?? "incompletas"}`;

  return (
    <div className="flex flex-col gap-6">
      <Link href={back} className="self-start text-sm font-extrabold underline">
        ← Voltar para contas
      </Link>
      <PageTitle kicker={role?.label ?? "Sem tipo escolhido"}>{title}</PageTitle>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={suspendedAt ? "destructive" : status === "Verificado" || status === "Perfil completo" ? "success" : status === "Pendente" ? "accent" : "dashed"}>{status}</Badge>
        <span className="break-all text-sm font-semibold">{account.email}</span>
      </div>

      <section className="flex flex-col gap-3" aria-label="Acesso">
        <SectionTitle>Acesso</SectionTitle>
        <Fields
          row={{}}
          extra={[
            ["E-mail", account.email],
            ["Conta criada em", when(account.created_at)],
            ["Último acesso", account.last_sign_in_at ? when(account.last_sign_in_at) : "Nunca entrou"],
            ["Identificador", account.id],
          ]}
        />
      </section>

      {row ? (
        <section className="flex flex-col gap-3" aria-label="Cadastro">
          <SectionTitle>Cadastro</SectionTitle>
          <Fields row={row} />
        </section>
      ) : (
        <Alert variant="accent">
          <p>{account.role ? "Essa conta escolheu o tipo, mas não terminou o cadastro." : "Essa conta entrou, mas ainda não escolheu o tipo."}</p>
        </Alert>
      )}

      {account.role === "employer" && (
        <section className="flex flex-col gap-3" aria-label="Vagas abertas">
          <SectionTitle>Vagas abertas ({jobs.length})</SectionTitle>
          {jobs.length === 0 ? (
            <p className="border-3 border-dashed border-foreground p-4 text-sm font-semibold">Nenhuma vaga aberta agora.</p>
          ) : (
            <ul className="border-3 border-foreground bg-card">
              {jobs.map((j, i) => (
                <li key={j.id} className={`px-3.5 py-2.5 text-sm ${i < jobs.length - 1 ? "border-b-2 border-foreground" : ""}`}>
                  <strong className="font-black">{j.title}</strong> · {j.city ?? "Qualquer lugar"} · {MODALITIES[j.modality as keyof typeof MODALITIES] ?? j.modality}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {account.role === "candidate" && (
        <Alert variant="accent">
          <p>
            Por privacidade, o admin não vê nome, currículo, experiências, dossiê nem relato de quem procura trabalho. Só aparecem os dados que a lista de contas já mostrava.
          </p>
        </Alert>
      )}
    </div>
  );
}
