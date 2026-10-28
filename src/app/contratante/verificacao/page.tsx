import type { Metadata } from "next";
import Link from "next/link";
import { Check, Clock } from "lucide-react";
import { Fist } from "@/components/brand/fist";
import { VerifiedBadge } from "@/components/employer/verified-badge";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { requireEmployer } from "@/lib/employer";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Verificação" };

export default async function VerificacaoPage() {
  const { employer } = await requireEmployer();
  const fmt = (d: string) => new Date(d).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

  if (employer.verification_status === "verified") {
    return (
      <section
        aria-labelledby="ok-t"
        className="mr-1.5 flex flex-col items-center gap-4 border-3 border-foreground bg-rays-red p-7 text-center text-white shadow-hard"
      >
        <span className="flex size-28 flex-col items-center justify-center gap-0.5 rounded-full border-[4px] border-foreground bg-[#F2E8D5] text-[#141210] shadow-hard-sm">
          <Fist className="h-11 w-[34px]" fill="#E8A317" />
          <span className="text-[10px] font-black uppercase tracking-wider">Verificada</span>
        </span>
        <h1 id="ok-t" className="text-shadow-hard font-display text-4xl uppercase leading-none">
          Empresa Comprometida
        </h1>
        <p className="bg-[#141210] px-3 py-2.5 text-[15px] font-semibold">
          Seu selo aparece em todas as vagas. Você já pode buscar perfis e enviar convites.
        </p>
        <Button asChild variant="accent" className="self-stretch shadow-none">
          <Link href="/contratante">Ir para o painel</Link>
        </Button>
      </section>
    );
  }

  const steps = [
    { done: true, title: "Dados enviados", hint: fmt(employer.created_at) },
    { done: true, title: "Compromisso assinado", hint: `Por ${employer.responsible_name}` },
    { done: false, current: true, title: "Conferência da equipe", hint: employer.verification_status === "rejected" ? "Não aprovada" : "Em andamento" },
    { done: false, title: "Acesso aos candidatos", hint: "Liberado após aprovação" },
  ];

  return (
    <div className="flex flex-col gap-5">
      <VerifiedBadge status={employer.verification_status} />
      <h1 className="font-display text-[42px] uppercase leading-[0.98]">
        {employer.verification_status === "rejected" ? "Precisamos de ajustes" : "Recebemos seu cadastro"}
      </h1>
      {employer.verification_status === "rejected" ? (
        <Alert variant="destructive">
          <p>
            {employer.rejection_reason ?? "Não conseguimos confirmar os dados."} Corrija o cadastro e ele volta para a fila.
          </p>
        </Alert>
      ) : (
        <p className="text-base font-medium leading-relaxed">
          Estamos conferindo o documento e a pessoa responsável. Avisamos por e-mail em até 2 dias úteis.
        </p>
      )}
      <ol className="mr-1.5 border-3 border-foreground bg-card shadow-hard">
        {steps.map((s, i) => (
          <li key={s.title} className={cn("flex items-center gap-3.5 p-3.5", i < steps.length - 1 && "border-b-2 border-foreground", s.current && "bg-accent/25")}>
            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center border-2 border-foreground",
                s.done ? "bg-success text-success-foreground" : s.current ? "bg-accent" : "border-dashed",
              )}
            >
              {s.done ? <Check className="size-4" strokeWidth={3.6} /> : s.current ? <Clock className="size-4" strokeWidth={3} /> : null}
            </span>
            <div>
              <strong className="block text-[15px] font-extrabold">{s.title}</strong>
              <span className="text-[13px]">{s.hint}</span>
            </div>
          </li>
        ))}
      </ol>
      <div className="flex flex-col gap-3 pr-1.5">
        <Button asChild variant="outline">
          <Link href="/contratante/vagas/nova">Rascunhar uma vaga</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/cadastro/contratante">Corrigir dados do cadastro</Link>
        </Button>
      </div>
    </div>
  );
}
