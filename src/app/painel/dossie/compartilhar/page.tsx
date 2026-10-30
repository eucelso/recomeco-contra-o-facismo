import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ShareConfirm } from "@/components/candidate/share-confirm";
import { PageTitle } from "@/components/layout/app-shell";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth";
import type { LawyerPublic } from "@/lib/types";

export const metadata: Metadata = { title: "Compartilhar dossiê", robots: { index: false } };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function CompartilharPage({ searchParams }: { searchParams: Promise<{ advogado?: string }> }) {
  const { supabase, user } = await requireRole("candidate");
  const { advogado } = await searchParams;

  const [{ count: facts }, { data: notes }, { data: lawyers }, { data: mine }] = await Promise.all([
    supabase.from("report_facts").select("id", { count: "exact", head: true }).eq("candidate_id", user.id),
    supabase.from("confidential_reports").select("candidate_id").eq("candidate_id", user.id).maybeSingle(),
    supabase.from("lawyers_public").select("id,full_name,oab_state,oab_number,areas,city,state,online,bio"),
    supabase.from("dossier_shares").select("lawyer_id,expires_at,revoked_at").eq("candidate_id", user.id),
  ]);
  const empty = !facts && !notes;
  const sharedNow = new Set((mine ?? []).filter((s) => !s.revoked_at && new Date(s.expires_at) > new Date()).map((s) => s.lawyer_id));
  const list = (lawyers ?? []) as Pick<LawyerPublic, "id" | "full_name" | "oab_state" | "oab_number" | "areas" | "city" | "state" | "online" | "bio">[];
  const chosen = advogado && UUID.test(advogado) ? list.find((l) => l.id === advogado) : undefined;

  return (
    <div className="flex flex-col gap-6">
      <Link href="/painel/dossie" className="-ml-2 flex h-11 items-center gap-1 self-start text-sm font-extrabold uppercase">
        <ChevronLeft className="size-5" strokeWidth={3} /> Meu dossiê
      </Link>
      <PageTitle>Compartilhar com advogado</PageTitle>

      {empty ? (
        <Alert variant="accent">
          <p>Seu dossiê está vazio. Adicione pelo menos um fato ou escreva um texto antes de compartilhar.</p>
          <Button asChild size="sm" className="mt-3 shadow-none">
            <Link href="/painel/dossie">Ir para o dossiê</Link>
          </Button>
        </Alert>
      ) : advogado && !chosen ? (
        <Alert variant="destructive">
          <p>Este advogado não está disponível agora. Escolha outro abaixo.</p>
        </Alert>
      ) : null}

      {!empty && chosen && (
        <ShareConfirm
          lawyer={{ id: chosen.id, full_name: chosen.full_name, oab: `OAB/${chosen.oab_state} ${chosen.oab_number}`, place: `${chosen.city}, ${chosen.state}` }}
          alreadyShared={sharedNow.has(chosen.id)}
          facts={facts ?? 0}
          hasNotes={Boolean(notes)}
        />
      )}

      {!empty && !chosen && (
        <section aria-labelledby="pick-t" className="flex flex-col gap-3">
          <h2 id="pick-t" className="font-display text-2xl uppercase leading-none">
            Escolha quem vai receber
          </h2>
          <p className="text-sm font-semibold">Só advogados verificados que estão aceitando casos aparecem aqui. Você escolhe um de cada vez.</p>
          {list.length === 0 ? (
            <p className="border-3 border-dashed border-foreground p-5 text-center font-semibold">Nenhum advogado disponível agora.</p>
          ) : (
            <ul className="flex flex-col gap-3 pr-1.5">
              {list.map((l) => (
                <li key={l.id} className="flex flex-col gap-2 border-3 border-foreground bg-card p-4 shadow-hard-sm">
                  <strong className="text-base font-black">{l.full_name}</strong>
                  <span className="text-sm font-semibold">
                    OAB/{l.oab_state} {l.oab_number} · {l.city}, {l.state}
                    {l.online ? " · atende online" : ""}
                  </span>
                  <span className="text-sm">{l.areas.join(" · ")}</span>
                  {sharedNow.has(l.id) ? (
                    <span className="text-sm font-black uppercase text-success">Já compartilhado</span>
                  ) : (
                    <Button asChild size="sm" className="self-start shadow-none">
                      <Link href={`/painel/dossie/compartilhar?advogado=${l.id}`}>Escolher</Link>
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
