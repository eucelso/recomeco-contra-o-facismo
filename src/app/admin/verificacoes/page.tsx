import type { Metadata } from "next";
import { ReviewButtons } from "@/components/admin/review-buttons";
import { PageTitle } from "@/components/layout/app-shell";
import { Alert } from "@/components/ui/alert";
import { requireRole } from "@/lib/auth";

export const metadata: Metadata = { title: "Verificações", robots: { index: false } };

function formatDoc(kind: string, d: string) {
  return kind === "cnpj"
    ? d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")
    : d.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
}

export default async function VerificacoesPage() {
  const { supabase } = await requireRole("admin");
  const { data: pending } = await supabase
    .from("employers")
    .select("id,kind,document,legal_name,display_name,sector,city,state,responsible_name,created_at,verification_status")
    .in("verification_status", ["pending", "rejected"])
    .order("created_at");

  return (
    <div className="flex flex-col gap-6">
      <PageTitle kicker="Admin">Verificações</PageTitle>
      <Alert variant="accent">
        <p>
          Confira o documento na Receita Federal e se o responsável existe. Aprove só quem você conseguiu confirmar. A aprovação libera o
          acesso a perfis de pessoas em situação vulnerável.
        </p>
      </Alert>
      {(pending ?? []).length === 0 && <p className="border-3 border-dashed border-foreground p-6 text-center font-semibold">Fila vazia.</p>}
      <ul className="flex flex-col gap-4 pr-1.5">
        {(pending ?? []).map((e) => (
          <li key={e.id} className="flex flex-col gap-3 border-3 border-foreground bg-card p-4 shadow-hard">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <strong className="text-lg font-black">{e.display_name}</strong>
              <span className="text-xs font-bold uppercase">{e.verification_status === "rejected" ? "Reprovada antes" : "Pendente"}</span>
            </div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
              <dt className="font-black uppercase">{e.kind}</dt>
              <dd className="font-mono">{formatDoc(e.kind, e.document)}</dd>
              {e.legal_name && (
                <>
                  <dt className="font-black uppercase">Razão</dt>
                  <dd>{e.legal_name}</dd>
                </>
              )}
              <dt className="font-black uppercase">Setor</dt>
              <dd>{e.sector}</dd>
              <dt className="font-black uppercase">Local</dt>
              <dd>
                {e.city}, {e.state}
              </dd>
              <dt className="font-black uppercase">Resp.</dt>
              <dd>{e.responsible_name}</dd>
              <dt className="font-black uppercase">Desde</dt>
              <dd>{new Date(e.created_at).toLocaleDateString("pt-BR")}</dd>
            </dl>
            <ReviewButtons id={e.id} />
          </li>
        ))}
      </ul>
    </div>
  );
}
