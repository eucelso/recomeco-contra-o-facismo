"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { renewShare, revokeShare } from "@/app/painel/dossie/compartilhar/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { daysLeft, SHARE_DAYS, type MyShare } from "@/lib/dossier-share";

const dt = (d: string) => new Date(d).toLocaleDateString("pt-BR");

function ShareRow({ s }: { s: MyShare }) {
  const [pending, start] = useTransition();
  const left = daysLeft(s.expires_at);
  const expired = left <= 0;
  const act = (fn: () => Promise<{ ok: boolean; error?: string }>, okMsg: string) =>
    start(async () => {
      const r = await fn();
      if (!r.ok) toast.error(r.error ?? "Não deu certo.");
      else toast.success(okMsg);
    });

  return (
    <li className="flex flex-col gap-2 border-3 border-foreground bg-card p-4 shadow-hard-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <strong className="text-base font-black">{s.lawyer_name}</strong>
        <Badge variant={expired ? "dashed" : left <= 7 ? "accent" : "success"}>{expired ? "Venceu" : `${left} ${left === 1 ? "dia" : "dias"}`}</Badge>
      </div>
      <p className="text-sm font-semibold">
        Compartilhado em {dt(s.created_at)} · {expired ? `venceu em ${dt(s.expires_at)}` : `vale até ${dt(s.expires_at)}`}
        <br />
        {s.first_viewed_at ? `Aberto em ${dt(s.first_viewed_at)}.` : "Ainda não foi aberto."} {s.has_contact ? "Contato enviado." : "Sem contato enviado."}
      </p>
      {s.renewal_requested_at && (
        <p role="note" className="border-l-4 border-primary bg-accent p-2 text-sm font-bold text-accent-foreground">
          O advogado pediu para renovar o acesso. Renovar estende por mais {SHARE_DAYS} dias a mesma cópia.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" className="shadow-none" disabled={pending} onClick={() => act(() => renewShare(s.id), `Acesso renovado por ${SHARE_DAYS} dias.`)}>
          Renovar {SHARE_DAYS} dias
        </Button>
        <Button
          variant="destructive"
          size="sm"
          className="shadow-none"
          disabled={pending}
          onClick={() => {
            if (!window.confirm(`Revogar o acesso de ${s.lawyer_name}? A cópia do dossiê é apagada.`)) return;
            act(() => revokeShare(s.id), "Acesso revogado e cópia apagada.");
          }}
        >
          Revogar e apagar
        </Button>
      </div>
    </li>
  );
}

export function SharesList({ shares, canShare }: { shares: MyShare[]; canShare: boolean }) {
  return (
    <section aria-labelledby="shares-t" className="flex flex-col gap-3">
      <h2 id="shares-t" className="font-display text-3xl uppercase leading-none">
        Compartilhado com advogados
      </h2>
      <p className="text-sm font-semibold">
        Escolha um advogado voluntário para ler o seu dossiê. Ele recebe uma cópia, vale {SHARE_DAYS} dias e você revoga quando quiser.
      </p>
      {shares.length === 0 ? (
        <p className="border-3 border-dashed border-foreground p-4 text-center text-sm font-semibold">Você ainda não compartilhou com ninguém.</p>
      ) : (
        <ul className="flex flex-col gap-3 pr-1.5">
          {shares.map((s) => (
            <ShareRow key={s.id} s={s} />
          ))}
        </ul>
      )}
      {canShare && (
        <Button asChild className="min-h-12 h-auto w-full whitespace-normal py-2 text-center sm:w-auto sm:self-start">
          <Link href="/painel/dossie/compartilhar">
            <Share2 strokeWidth={2.8} aria-hidden="true" /> Compartilhar com um advogado
          </Link>
        </Button>
      )}
    </section>
  );
}
