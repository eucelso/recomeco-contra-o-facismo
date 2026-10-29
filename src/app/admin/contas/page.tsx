import type { Metadata } from "next";
import Link from "next/link";
import { AccountList } from "@/components/admin/account-list";
import { PageTitle } from "@/components/layout/app-shell";
import { Alert } from "@/components/ui/alert";
import { ACCOUNT_TABS, VERIFICATION_LABEL, type AccountRow, type AccountTab } from "@/lib/admin-accounts";
import { requireRole } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Contas", robots: { index: false } };

type Account = { id: string; email: string; role: string | null; created_at: string; last_sign_in_at: string | null };
type Candidate = {
  id: string;
  email: string;
  city: string | null;
  state: string | null;
  areas: string[] | null;
  headline: string | null;
  completed: boolean;
  anonymous: boolean | null;
  invites_paused: boolean | null;
  suspended_at: string | null;
  suspension_reason: string | null;
  created_at: string;
  last_sign_in_at: string | null;
};

const yn = (v: boolean | null | undefined) => (v ? "Sim" : "Não");
const place = (city?: string | null, state?: string | null) => [city, state].filter(Boolean).join(", ") || "—";
const doc = (kind: string, d: string) =>
  kind === "cnpj" ? d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5") : d.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");

export default async function ContasPage({ searchParams }: { searchParams: Promise<{ tipo?: string }> }) {
  const { supabase } = await requireRole("admin");
  const sp = await searchParams;
  const tab: AccountTab = ACCOUNT_TABS.some((t) => t.key === sp.tipo) ? (sp.tipo as AccountTab) : "advogados";

  const { data: accountsData, error } = await supabase.rpc("admin_accounts");
  if (error)
    return (
      <div className="flex flex-col gap-6">
        <PageTitle kicker="Admin">Contas</PageTitle>
        <Alert variant="destructive">
          <p>Não conseguimos carregar as contas. Se você ainda não aplicou as 4 migrations 20261030150000 a 20261030150300 (suspension_* e admin_accounts) no Supabase, aplique em ordem e recarregue.</p>
        </Alert>
      </div>
    );
  const accounts = (accountsData ?? []) as Account[];
  const info = new Map(accounts.map((a) => [a.id, a]));
  const counts: Record<string, number> = { advogados: 0, candidatos: 0, empresas: 0, negocios: 0, semTipo: 0 };
  for (const a of accounts) {
    if (a.role === "lawyer") counts.advogados++;
    else if (a.role === "candidate") counts.candidatos++;
    else if (a.role === "employer") counts.empresas++;
    else if (a.role === "business") counts.negocios++;
    else if (a.role !== "admin") counts.semTipo++;
  }
  const who = (id: string) => ({ email: info.get(id)?.email ?? "—", created_at: info.get(id)?.created_at ?? "", last_sign_in_at: info.get(id)?.last_sign_in_at ?? null });
  const verif = (s: string, suspended: string | null) =>
    suspended ? { status: "suspended", statusLabel: "Oculta" } : { status: s, statusLabel: VERIFICATION_LABEL[s] ?? s };
  const sus = (kind: AccountRow["kind"], at: string | null, reason: string | null) => ({ kind, suspended: Boolean(at), suspendedAt: at, suspensionReason: reason });

  let rows: AccountRow[] = [];
  if (tab === "advogados") {
    const { data } = await supabase.from("lawyers").select("*").order("created_at", { ascending: false }).limit(1000);
    rows = (data ?? []).map((l) => ({
      id: l.id,
      name: l.full_name,
      ...who(l.id),
      ...verif(l.verification_status, l.suspended_at),
      ...sus("lawyer", l.suspended_at, l.suspension_reason),
      created_at: l.created_at,
      details: [
        ["OAB", `${l.oab_state} ${l.oab_number}`],
        ["Local", place(l.city, l.state) + (l.online ? " · atende online" : "")],
        ["Áreas", (l.areas as string[]).join(", ")],
        ["Contato", `${l.contact_kind === "whatsapp" ? "WhatsApp" : "E-mail"}: ${l.contact_value}`],
        ["Na lista", yn(l.verification_status === "verified" && l.accepting && !l.suspended_at)],
      ],
    }));
  } else if (tab === "candidatos") {
    const { data } = await supabase.rpc("admin_candidates");
    rows = ((data ?? []) as Candidate[]).map((c) => ({
      id: c.id,
      name: c.headline || "Perfil sem título",
      email: c.email,
      created_at: c.created_at,
      last_sign_in_at: c.last_sign_in_at,
      ...sus("candidate", c.suspended_at, c.suspension_reason),
      status: c.suspended_at ? "suspended" : c.completed ? "complete" : "incomplete",
      statusLabel: c.suspended_at ? "Oculta" : c.completed ? "Perfil completo" : "Perfil incompleto",
      details: [
        ["Local", place(c.city, c.state)],
        ["Áreas", (c.areas ?? []).join(", ") || "—"],
        ["Anônimo", yn(c.anonymous)],
        ["Convites pausados", yn(c.invites_paused)],
      ],
    }));
  } else if (tab === "empresas") {
    const [{ data }, { data: open }] = await Promise.all([
      supabase.from("employers").select("*").order("created_at", { ascending: false }).limit(1000),
      supabase.from("job_listings").select("employer_id").limit(5000),
    ]);
    const jobs = new Map<string, number>();
    for (const j of open ?? []) jobs.set(j.employer_id, (jobs.get(j.employer_id) ?? 0) + 1);
    rows = (data ?? []).map((e) => ({
      id: e.id,
      name: e.display_name,
      ...who(e.id),
      ...verif(e.verification_status, e.suspended_at),
      ...sus("employer", e.suspended_at, e.suspension_reason),
      created_at: e.created_at,
      details: [
        [e.kind.toUpperCase(), doc(e.kind, e.document)],
        ["Setor", e.sector],
        ["Local", place(e.city, e.state)],
        ["Responsável", e.responsible_name],
        ["Vagas abertas", String(jobs.get(e.id) ?? 0)],
      ],
    }));
  } else {
    const { data } = await supabase.from("businesses").select("*").order("created_at", { ascending: false }).limit(1000);
    rows = (data ?? []).map((b) => ({
      id: b.id,
      name: b.display_name,
      ...who(b.id),
      ...verif(b.verification_status, b.suspended_at),
      ...sus("business", b.suspended_at, b.suspension_reason),
      created_at: b.created_at,
      details: [
        [b.kind.toUpperCase(), doc(b.kind, b.document)],
        ["Categoria", b.category],
        ["Local", place(b.city, b.state)],
        ["Contato", [b.whatsapp, b.instagram && `@${b.instagram}`, b.website].filter(Boolean).join(" · ")],
        ["Na lista", yn(b.verification_status === "verified" && b.visible && !b.suspended_at)],
      ],
    }));
  }

  return (
    <div className="flex flex-col gap-6">
      <PageTitle kicker="Admin">Contas</PageTitle>
      <nav aria-label="Tipos de conta" className="flex flex-wrap gap-2">
        {ACCOUNT_TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin/contas?tipo=${t.key}`}
            aria-current={tab === t.key ? "page" : undefined}
            className={cn(
              "flex h-11 items-center gap-2 border-3 border-foreground px-3 text-sm font-black uppercase",
              tab === t.key ? "bg-primary text-primary-foreground" : "bg-card",
            )}
          >
            {t.label}
            <span className="border-2 border-current px-1.5 text-xs">{counts[t.key]}</span>
          </Link>
        ))}
      </nav>
      {counts.semTipo > 0 && (
        <p className="text-sm font-semibold">
          {counts.semTipo} {counts.semTipo === 1 ? "conta ainda não escolheu" : "contas ainda não escolheram"} o tipo (criaram o login e pararam antes). Total: {accounts.length} contas.
        </p>
      )}
      <AccountList key={tab} rows={rows} />
    </div>
  );
}
