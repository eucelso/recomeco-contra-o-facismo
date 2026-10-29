import type { Metadata } from "next";
import Link from "next/link";
import { Check, Clock, X } from "lucide-react";
import { PageTitle } from "@/components/layout/app-shell";
import { AcceptingSwitch } from "@/components/lawyer/accepting-switch";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireLawyer } from "@/lib/lawyer";

export const metadata: Metadata = { title: "Meu painel" };

export default async function AdvogadoPage() {
  const { lawyer } = await requireLawyer();
  const status = lawyer.verification_status;

  return (
    <div className="flex flex-col gap-6">
      <PageTitle kicker="Advogado(a) voluntário(a)">Olá, {lawyer.full_name.split(" ")[0]}</PageTitle>

      {status === "verified" && (
        <Badge variant="success" className="self-start">
          <Check strokeWidth={3.6} aria-hidden="true" /> OAB conferida
        </Badge>
      )}
      {status === "pending" && (
        <Badge variant="accent" className="self-start">
          <Clock strokeWidth={3} aria-hidden="true" /> Em verificação
        </Badge>
      )}
      {status === "rejected" && (
        <Badge variant="destructive" className="self-start">
          <X strokeWidth={3} aria-hidden="true" /> Não aprovado
        </Badge>
      )}

      {status === "pending" && (
        <p className="text-base font-medium leading-relaxed">
          Estamos conferindo sua inscrição na OAB. Leva até 2 dias úteis. Depois da aprovação, você aparece na lista pública.
        </p>
      )}
      {status === "rejected" && (
        <Alert variant="destructive">
          <p>{lawyer.rejection_reason ?? "Não conseguimos confirmar a inscrição."} Corrija o cadastro e ele volta para a fila.</p>
        </Alert>
      )}

      {status === "verified" && (
        <>
          <AcceptingSwitch initial={lawyer.accepting} />
          <p className="text-sm font-semibold leading-relaxed">
            Quem precisa de ajuda vê seu nome, OAB, áreas, cidade e o contato que você informou ({lawyer.contact_kind === "whatsapp" ? "WhatsApp" : "e-mail"}).
          </p>
          <Button asChild variant="outline" className="self-start">
            <Link href="/advogados">Ver a lista pública</Link>
          </Button>
        </>
      )}

      <div className="pr-1.5">
        <Button asChild variant="ghost">
          <Link href="/cadastro/advogado">Editar meus dados</Link>
        </Button>
      </div>
      <p className="text-xs font-medium">Se mudar a OAB, a verificação recomeça e você sai da lista até ser aprovado de novo.</p>
    </div>
  );
}
