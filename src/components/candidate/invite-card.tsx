"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { respondInvite } from "@/app/painel/actions";
import { InitialsBox } from "@/components/brand/initials-box";
import { VerifiedBadge } from "@/components/employer/verified-badge";
import { Button } from "@/components/ui/button";

export function InviteCard({
  id,
  status,
  company,
  job,
  message,
}: {
  id: string;
  status: string;
  company: string;
  job: string | null;
  message: string | null;
}) {
  const [pending, start] = useTransition();
  const respond = (accept: boolean) =>
    start(async () => {
      const r = await respondInvite(id, accept);
      if (!r.ok) return void toast.error(r.error);
      toast.success(accept ? "Convite aceito. O chat foi liberado." : "Convite recusado. A empresa não verá seus dados.");
    });

  return (
    <article className="flex flex-col gap-3 border-3 border-foreground bg-card p-3.5 shadow-hard-sm">
      <div className="flex items-center gap-3">
        <InitialsBox name={company} />
        <div className="min-w-0 flex-1">
          <strong className="block text-[15px] font-black">{company}</strong>
          {job && <span className="block text-[13px] font-semibold">Convite para: {job}</span>}
          <span className="mt-1 inline-block">
            <VerifiedBadge />
          </span>
        </div>
      </div>
      {message && <p className="border-l-[5px] border-accent pl-3 text-sm leading-relaxed">“{message}”</p>}
      {status === "pending" ? (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 shadow-none" disabled={pending} onClick={() => respond(false)}>
            Recusar
          </Button>
          <Button size="sm" className="flex-1 shadow-none" disabled={pending} onClick={() => respond(true)}>
            Aceitar
          </Button>
        </div>
      ) : (
        <Button asChild variant="secondary" size="sm" className="shadow-none">
          <Link href={`/mensagens/${id}`}>
            <Check strokeWidth={3} className="text-accent" aria-hidden="true" /> Aceito · abrir conversa
          </Link>
        </Button>
      )}
    </article>
  );
}
