import type { Metadata } from "next";
import Link from "next/link";
import { Check, Clock, X } from "lucide-react";
import { PageTitle } from "@/components/layout/app-shell";
import { VisibleSwitch } from "@/components/business/visible-switch";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AccountDangerZone } from "@/components/privacy/account-danger-zone";
import { requireBusiness } from "@/lib/business";

export const metadata: Metadata = { title: "Meu negócio" };

export default async function NegocioPage() {
  const { business } = await requireBusiness();
  const status = business.verification_status;

  return (
    <div className="flex flex-col gap-6">
      <PageTitle kicker="Negócio">{business.display_name}</PageTitle>

      {business.suspended_at && (
        <Alert variant="destructive">
          <p>
            Sua conta foi retirada de exibição pela nossa equipe{business.suspension_reason ? `: ${business.suspension_reason}` : "."} Enquanto isso, o negócio não aparece em Apoie.
          </p>
        </Alert>
      )}
      {status === "verified" && (
        <Badge variant="success" className="self-start">
          <Check strokeWidth={3.6} aria-hidden="true" /> Aprovado
        </Badge>
      )}
      {status === "pending" && (
        <Badge variant="accent" className="self-start">
          <Clock strokeWidth={3} aria-hidden="true" /> Em revisão
        </Badge>
      )}
      {status === "rejected" && (
        <Badge variant="destructive" className="self-start">
          <X strokeWidth={3} aria-hidden="true" /> Não aprovado
        </Badge>
      )}

      {status === "pending" && (
        <p className="text-base font-medium leading-relaxed">
          Estamos conferindo o documento e lendo o seu relato. Leva até 2 dias úteis. Depois da aprovação, o negócio aparece na lista pública.
        </p>
      )}
      {status === "rejected" && (
        <Alert variant="destructive">
          <p>{business.rejection_reason ?? "Não conseguimos confirmar os dados."} Corrija o cadastro e ele volta para a fila.</p>
        </Alert>
      )}

      {status === "verified" && (
        <>
          <VisibleSwitch initial={business.visible} />
          <Button asChild variant="outline" className="self-start">
            <Link href="/apoie">Ver a lista pública</Link>
          </Button>
        </>
      )}

      <div className="pr-1.5">
        <Button asChild variant="ghost">
          <Link href="/cadastro/negocio">Editar meus dados</Link>
        </Button>
      </div>
      <p className="text-xs font-medium">Se mudar o nome, o documento ou o relato, o texto novo passa por revisão e o negócio sai da lista até ser aprovado de novo.</p>
      <AccountDangerZone role="business" />
    </div>
  );
}
