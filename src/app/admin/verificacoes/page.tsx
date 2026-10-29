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

  const { data: lawyers } = await supabase
    .from("lawyers")
    .select("id,full_name,oab_state,oab_number,areas,city,state,contact_kind,contact_value,created_at,verification_status")
    .in("verification_status", ["pending", "rejected"])
    .order("created_at");

  const { data: businesses } = await supabase
    .from("businesses")
    .select("id,kind,document,display_name,category,city,state,neighborhood,whatsapp,instagram,website,story,created_at,verification_status")
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
      <h2 className="border-b-3 border-foreground pb-1.5 text-[15px] font-black uppercase">Contratantes</h2>
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
      <h2 className="border-b-3 border-foreground pb-1.5 text-[15px] font-black uppercase">Advogados voluntários</h2>
      <Alert variant="accent">
        <p>
          Confira a inscrição no Cadastro Nacional dos Advogados (cna.oab.org.br): nome, número, UF e situação regular. Só aprove quem aparecer
          ativo. A aprovação coloca o contato da pessoa na lista pública.
        </p>
      </Alert>
      {(lawyers ?? []).length === 0 && <p className="border-3 border-dashed border-foreground p-6 text-center font-semibold">Fila vazia.</p>}
      <ul className="flex flex-col gap-4 pr-1.5">
        {(lawyers ?? []).map((l) => (
          <li key={l.id} className="flex flex-col gap-3 border-3 border-foreground bg-card p-4 shadow-hard">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <strong className="text-lg font-black">{l.full_name}</strong>
              <span className="text-xs font-bold uppercase">{l.verification_status === "rejected" ? "Reprovado antes" : "Pendente"}</span>
            </div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
              <dt className="font-black uppercase">OAB</dt>
              <dd className="font-mono">
                {l.oab_state} {l.oab_number}
              </dd>
              <dt className="font-black uppercase">Áreas</dt>
              <dd>{(l.areas as string[]).join(", ")}</dd>
              <dt className="font-black uppercase">Local</dt>
              <dd>
                {l.city}, {l.state}
              </dd>
              <dt className="font-black uppercase">Contato</dt>
              <dd>
                {l.contact_kind === "whatsapp" ? "WhatsApp" : "E-mail"}: {l.contact_value}
              </dd>
              <dt className="font-black uppercase">Desde</dt>
              <dd>{new Date(l.created_at).toLocaleDateString("pt-BR")}</dd>
            </dl>
            <ReviewButtons id={l.id} kind="lawyer" />
          </li>
        ))}
      </ul>
      <h2 className="border-b-3 border-foreground pb-1.5 text-[15px] font-black uppercase">Negócios prejudicados</h2>
      <Alert variant="accent">
        <p>
          Confira o documento na Receita Federal e se o negócio existe no endereço informado. Leia o relato: se citar nome de pessoa ou acusar
          alguém, reprove com o motivo para a pessoa corrigir. A aprovação publica o texto e os contatos em /apoie.
        </p>
      </Alert>
      {(businesses ?? []).length === 0 && <p className="border-3 border-dashed border-foreground p-6 text-center font-semibold">Fila vazia.</p>}
      <ul className="flex flex-col gap-4 pr-1.5">
        {(businesses ?? []).map((b) => (
          <li key={b.id} className="flex flex-col gap-3 border-3 border-foreground bg-card p-4 shadow-hard">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <strong className="text-lg font-black">{b.display_name}</strong>
              <span className="text-xs font-bold uppercase">{b.verification_status === "rejected" ? "Reprovado antes" : "Pendente"}</span>
            </div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
              <dt className="font-black uppercase">{b.kind}</dt>
              <dd className="font-mono">{formatDoc(b.kind, b.document)}</dd>
              <dt className="font-black uppercase">Categ.</dt>
              <dd>{b.category}</dd>
              <dt className="font-black uppercase">Local</dt>
              <dd>
                {[b.neighborhood, `${b.city}, ${b.state}`].filter(Boolean).join(" · ")}
              </dd>
              <dt className="font-black uppercase">Contato</dt>
              <dd className="break-all">{[b.whatsapp, b.instagram && `@${b.instagram}`, b.website].filter(Boolean).join(" · ")}</dd>
              <dt className="font-black uppercase">Relato</dt>
              <dd className="whitespace-pre-line">{b.story}</dd>
              <dt className="font-black uppercase">Desde</dt>
              <dd>{new Date(b.created_at).toLocaleDateString("pt-BR")}</dd>
            </dl>
            <ReviewButtons id={b.id} kind="business" />
          </li>
        ))}
      </ul>
    </div>
  );
}
