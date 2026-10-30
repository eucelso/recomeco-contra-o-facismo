"use client";

import { useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { requestRenewal } from "@/app/advogado/dossies/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { daysLeft, type ReceivedShare } from "@/lib/dossier-share";

const dt = (d: string) => new Date(d).toLocaleDateString("pt-BR");

function Row({ s }: { s: ReceivedShare }) {
  const [pending, start] = useTransition();
  const left = daysLeft(s.expires_at);
  const canAsk = left <= 7 && !s.renewal_requested_at;
  return (
    <li className="flex flex-col gap-2 border-3 border-foreground bg-card p-4 shadow-hard-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <strong className="text-base font-black">{s.active ? (s.worker_name ?? "Trabalhador(a)") : "Acesso vencido"}</strong>
        <Badge variant={!s.active ? "dashed" : left <= 7 ? "accent" : "success"}>{s.active ? `${left} ${left === 1 ? "dia" : "dias"}` : "Venceu"}</Badge>
      </div>
      <p className="text-sm font-semibold">
        Recebido em {dt(s.created_at)} · {s.active ? `vale até ${dt(s.expires_at)}` : `venceu em ${dt(s.expires_at)}`}
        {!s.first_viewed_at && s.active ? " · ainda não aberto" : ""}
      </p>
      {s.renewal_requested_at && <p className="text-sm font-bold">Renovação pedida em {dt(s.renewal_requested_at)}. Aguarde a resposta do trabalhador.</p>}
      <div className="flex flex-wrap gap-2">
        {s.active && (
          <Button asChild size="sm" className="shadow-none">
            <Link href={`/advogado/dossies/${s.id}`}>Abrir dossiê</Link>
          </Button>
        )}
        {canAsk && (
          <Button
            variant="outline"
            size="sm"
            className="shadow-none"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const r = await requestRenewal(s.id);
                if (!r.ok) toast.error(r.error);
                else toast.success("Pedido de renovação enviado.");
              })
            }
          >
            Pedir renovação
          </Button>
        )}
      </div>
    </li>
  );
}

export function ReceivedDossiers({ shares }: { shares: ReceivedShare[] }) {
  return (
    <section aria-labelledby="rec-t" className="flex flex-col gap-3">
      <h2 id="rec-t" className="font-display text-3xl uppercase leading-none">
        Dossiês recebidos
      </h2>
      <p className="text-sm font-semibold">
        Trabalhadores que escolheram você para ler o relato deles. É um material confidencial: use só para orientar a pessoa e não repasse.
      </p>
      {shares.length === 0 ? (
        <p className="border-3 border-dashed border-foreground p-4 text-center text-sm font-semibold">Nenhum dossiê recebido ainda.</p>
      ) : (
        <ul className="flex flex-col gap-3 pr-1.5">
          {shares.map((s) => (
            <Row key={s.id} s={s} />
          ))}
        </ul>
      )}
    </section>
  );
}
