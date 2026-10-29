import type { Metadata } from "next";
import { DossierEditor } from "@/components/candidate/dossier-editor";
import { PageTitle } from "@/components/layout/app-shell";
import { requireRole } from "@/lib/auth";
import type { Fact } from "@/lib/dossier";

export const metadata: Metadata = { title: "Meu dossiê", robots: { index: false } };

export default async function DossiePage() {
  const { supabase, user } = await requireRole("candidate");
  const [{ data: facts }, { data: report }] = await Promise.all([
    supabase.from("report_facts").select("id,happened_on,place,who,what,evidence,witnesses,created_at").eq("candidate_id", user.id),
    supabase.from("confidential_reports").select("body").eq("candidate_id", user.id).maybeSingle(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageTitle>Meu dossiê</PageTitle>
      <p className="text-sm font-semibold">
        Um caderno só seu para organizar o que aconteceu. Ninguém vê: nem empresas, nem a equipe do Recomeço. Você pode apagar tudo quando quiser.
      </p>
      <DossierEditor facts={(facts ?? []) as Fact[]} notes={report?.body ?? ""} />
    </div>
  );
}
