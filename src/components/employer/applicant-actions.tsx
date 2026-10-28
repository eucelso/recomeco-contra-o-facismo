"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Clock } from "lucide-react";
import { toast } from "sonner";
import { inviteCandidate, markApplication } from "@/app/contratante/actions";
import { Button } from "@/components/ui/button";

export function ApplicantActions({
  applicant,
}: {
  applicant: { application_id: string; job_id?: string; candidate_id: string; public_code: string; status: string; contact_status: string | null; contact_id: string | null };
}) {
  const [pending, start] = useTransition();

  if (applicant.contact_status === "accepted") {
    return (
      <div className="flex gap-2">
        <Button asChild variant="secondary" size="sm" className="flex-1 shadow-none">
          <Link href={`/mensagens/${applicant.contact_id}`}>Abrir conversa</Link>
        </Button>
        {applicant.status !== "hired" && (
          <Button
            variant="outline"
            size="sm"
            className="flex-1 shadow-none"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const r = await markApplication(applicant.application_id, "hired");
                if (r.ok) toast.success("Contratação registrada. Parabéns!");
                else toast.error(r.error);
              })
            }
          >
            Marcar contratado(a)
          </Button>
        )}
      </div>
    );
  }
  if (applicant.contact_status === "pending") {
    return (
      <p className="flex items-center gap-2 border-2 border-foreground bg-accent p-2.5 text-[13px] font-extrabold text-accent-foreground">
        <Clock className="size-4" strokeWidth={2.6} aria-hidden="true" /> Convite enviado · aguardando resposta
      </p>
    );
  }
  return (
    <div className="flex gap-2">
      <Button asChild variant="outline" size="sm" className="flex-1 shadow-none">
        <Link href={`/contratante/candidatos/${applicant.public_code}`}>Ver perfil</Link>
      </Button>
      <Button
        size="sm"
        className="flex-1 shadow-none"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await inviteCandidate(applicant.candidate_id, applicant.job_id ?? null, "");
            if (r.ok) toast.success("Convite enviado. A pessoa decide se quer conversar.");
            else toast.error(r.error);
          })
        }
      >
        Convidar
      </Button>
    </div>
  );
}
