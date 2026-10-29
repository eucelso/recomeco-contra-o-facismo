import type { Metadata } from "next";
import Link from "next/link";
import { ReportForm } from "@/components/reports/report-form";

export const metadata: Metadata = { title: "Contar a minha história" };

export default function NovoRelatoPage() {
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 px-4 py-10 sm:py-14">
      <Link href="/relatos" className="text-sm font-bold underline">
        ← Voltar aos relatos
      </Link>
      <div className="flex flex-col gap-3">
        <h1 className="font-display text-[42px] uppercase leading-[0.98]">
          Conte a sua <span className="text-primary">história</span>
        </h1>
        <p className="text-base font-medium leading-relaxed">Sem conta, sem nome e sem e-mail. Só o que você quiser contar.</p>
      </div>
      <ReportForm />
    </div>
  );
}
