import type { Metadata } from "next";
import { DossierEditor } from "@/components/candidate/dossier-editor";
import { PageTitle } from "@/components/layout/app-shell";
import { SharesList } from "@/components/candidate/shares-list";
import { requireRole } from "@/lib/auth";
import type { MyShare } from "@/lib/dossier-share";
import { loadFacts, loadNotes } from "@/lib/dossier-server";

export const metadata: Metadata = { title: "Meu dossiê", robots: { index: false } };

export default async function DossiePage() {
  const { supabase, user } = await requireRole("candidate");
  const [{ facts, unreadable }, notes, { data: shares }] = await Promise.all([
    loadFacts(supabase, user.id),
    loadNotes(supabase, user.id),
    supabase
      .from("dossier_shares")
      .select("id,lawyer_name,has_contact,created_at,expires_at,first_viewed_at,renewal_requested_at")
      .eq("candidate_id", user.id)
      .is("revoked_at", null)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageTitle>Meu dossiê</PageTitle>
      <p className="text-sm font-semibold">
        Um caderno só seu para organizar o que aconteceu. Ninguém vê: nem empresas, nem a equipe do Recomeço. Só um advogado, se você escolher compartilhar. Você pode apagar tudo quando quiser.
      </p>
      {unreadable > 0 && (
        <p role="alert" className="border-3 border-destructive p-3 text-sm font-bold">
          {unreadable} {unreadable === 1 ? "fato não pôde" : "fatos não puderam"} ser lido(s). Avise a equipe: pode ser um problema de configuração.
        </p>
      )}
      <DossierEditor facts={facts} notes={notes} />
      <SharesList shares={(shares ?? []) as MyShare[]} canShare={facts.length > 0 || Boolean(notes)} />
    </div>
  );
}
