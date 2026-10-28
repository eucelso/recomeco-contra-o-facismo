"use client";

import Link from "next/link";
import { swipeCandidate, undoCandidate } from "@/app/combina/actions";
import { ConnectionsList } from "@/components/combina/connections";
import { CombinaProfileCard, CombinaProfileDetails } from "@/components/combina/profile-card";
import { SwipeDeck } from "@/components/combina/swipe-deck";
import type { CombinaProfile, Connection } from "@/lib/types";
import { cn } from "@/lib/utils";

export function EmployerCombina({
  jobs,
  jobId,
  profiles,
  connections,
  meName,
}: {
  jobs: { id: string; title: string; city: string | null }[];
  jobId: string;
  profiles: CombinaProfile[];
  connections: Connection[];
  meName: string;
}) {
  return (
    <SwipeDeck
      key={jobId + profiles.map((p) => p.id).join(",")}
      items={profiles}
      getKey={(p) => p.id}
      renderCard={(p) => <CombinaProfileCard p={p} />}
      renderDetails={(p) => <CombinaProfileDetails p={p} />}
      detailsTitle="Perfil completo (anônimo)"
      onDecide={(p, choice) => swipeCandidate(jobId, p.id, choice)}
      onUndo={(p) => undoCandidate(jobId, p.id)}
      likeLabel="Quero conversar"
      likeStamp="QUERO CONVERSAR"
      meName={meName}
      matchNote="Agora você vê o nome e o currículo, e o chat está liberado. Lembre: nunca pergunte sobre voto ou posição política."
      emptyState={
        <>
          <span className="font-display text-4xl uppercase leading-none">Você viu todos os perfis desta vaga</span>
          <span className="text-[15px] font-medium">Quando alguém novo se encaixar, ele aparece aqui. Teste outra vaga ou busque perfis.</span>
          <Link href="/contratante/candidatos" className="flex h-12 items-center border-3 border-foreground bg-secondary px-5 font-black uppercase text-secondary-foreground">
            Buscar perfis
          </Link>
        </>
      }
      mobileHeader={
        <nav aria-label="Escolha a vaga" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {jobs.map((j) => (
            <Link
              key={j.id}
              href={`/combina?vaga=${j.id}`}
              aria-current={j.id === jobId ? "page" : undefined}
              className={cn(
                "flex h-10 shrink-0 items-center border-2 border-foreground px-3 text-[13px] font-extrabold",
                j.id === jobId ? "bg-secondary text-secondary-foreground" : "bg-card",
              )}
            >
              {j.title}
            </Link>
          ))}
        </nav>
      }
      aside={
        <div className="flex flex-col gap-5">
          <nav aria-label="Escolha a vaga" className="flex flex-col gap-2">
            <h2 className="border-b-3 border-foreground pb-1 text-sm font-black uppercase">Perfis para a vaga</h2>
            {jobs.map((j) => (
              <Link
                key={j.id}
                href={`/combina?vaga=${j.id}`}
                aria-current={j.id === jobId ? "page" : undefined}
                className={cn(
                  "border-3 border-foreground bg-card px-3 py-2.5",
                  j.id === jobId ? "shadow-hard-primary" : "",
                )}
              >
                <strong className="block text-sm font-black">{j.title}</strong>
                <span className="text-xs font-semibold">{j.city ?? "Remoto"}</span>
              </Link>
            ))}
          </nav>
          <ConnectionsList items={connections} />
          <p className="border-3 border-foreground bg-accent p-3 text-[13px] font-bold leading-snug text-accent-foreground">
            Pelo Compromisso, é proibido perguntar sobre voto ou posição política em qualquer etapa.
          </p>
        </div>
      }
    />
  );
}
