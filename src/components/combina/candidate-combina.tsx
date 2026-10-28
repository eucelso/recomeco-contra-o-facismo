"use client";

import Link from "next/link";
import { swipeJob, undoJob } from "@/app/combina/actions";
import { ConnectionsList } from "@/components/combina/connections";
import { CombinaJobCard, CombinaJobDetails } from "@/components/combina/job-card";
import { SwipeDeck } from "@/components/combina/swipe-deck";
import type { CombinaJob, Connection } from "@/lib/types";

export function CandidateCombina({
  jobs,
  connections,
  likeCount,
  meName,
  filterSummary,
}: {
  jobs: CombinaJob[];
  connections: Connection[];
  likeCount: number;
  meName: string;
  filterSummary: string[];
}) {
  return (
    <SwipeDeck
      key={jobs.map((j) => j.id).join(",")}
      items={jobs}
      getKey={(j) => j.id}
      renderCard={(j) => <CombinaJobCard job={j} />}
      renderDetails={(j) => <CombinaJobDetails job={j} />}
      detailsTitle="Sobre a vaga"
      onDecide={(j, choice) => swipeJob(j.id, choice)}
      onUndo={(j) => undoJob(j.id)}
      likeLabel="Tenho interesse"
      likeStamp="TENHO INTERESSE"
      meName={meName}
      matchNote="O chat está liberado e a empresa agora vê seu nome e currículo."
      emptyState={
        <>
          <span className="font-display text-4xl uppercase leading-none">Acabaram as vagas por hoje</span>
          <span className="text-[15px] font-medium">Novas vagas chegam todo dia. Enquanto isso, você pode buscar no mural.</span>
          <Link href="/vagas" className="flex h-12 items-center border-3 border-foreground bg-secondary px-5 font-black uppercase text-secondary-foreground">
            Buscar vagas
          </Link>
        </>
      }
      aside={
        <ConnectionsList
          items={connections}
          waitingLabel={
            <>
              <section className="flex flex-col gap-1.5">
                <h2 className="border-b-3 border-foreground pb-1 text-sm font-black uppercase">Interesse enviado · {likeCount}</h2>
                <p className="text-[13px] leading-relaxed">Seu perfil segue anônimo até a empresa também querer conversar.</p>
                <Link href="/painel" className="text-[13px] font-extrabold underline">
                  Ver minhas candidaturas
                </Link>
              </section>
              <section className="flex flex-col gap-2 border-3 border-foreground bg-[#141210] p-3.5 text-[#F2E8D5] shadow-hard-primary">
                <span className="text-xs font-black uppercase text-[#E8A317]">Mostrando vagas de</span>
                <ul className="flex flex-wrap gap-1.5">
                  {filterSummary.map((f) => (
                    <li key={f} className="border-2 border-[#F2E8D5] px-2 py-0.5 text-xs font-extrabold">
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/cadastro/candidato" className="text-[13px] font-extrabold text-[#E8A317] underline">
                  Ajustar meu perfil
                </Link>
              </section>
            </>
          }
        />
      }
    />
  );
}
