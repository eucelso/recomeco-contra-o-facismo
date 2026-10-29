import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Building, Scale, Search } from "lucide-react";
import { getSession, homeFor } from "@/lib/auth";
import { chooseRole } from "./actions";

export const metadata: Metadata = { title: "Tipo de conta" };

export default async function TipoPage() {
  const { user, role } = await getSession();
  if (!user) redirect("/entrar");
  if (role) redirect(homeFor(role));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-[46px] uppercase leading-[0.98]">Falta só uma coisa</h1>
      <p className="text-base font-medium">Como você quer usar o Recomeço? Essa escolha não pode ser trocada depois.</p>
      <form action={chooseRole} className="flex flex-col gap-3 pr-1.5">
        <button name="role" value="candidate" className="flex items-center gap-3.5 border-3 border-foreground bg-card p-4 text-left shadow-hard">
          <span className="flex size-12 items-center justify-center border-3 border-foreground bg-primary text-primary-foreground">
            <Search className="size-6" strokeWidth={2.8} aria-hidden="true" />
          </span>
          <span>
            <strong className="block text-base font-black uppercase">Procuro trabalho</strong>
            <span className="text-sm font-medium">Grátis. Anônimo até você aceitar.</span>
          </span>
        </button>
        <button name="role" value="employer" className="flex items-center gap-3.5 border-3 border-foreground bg-card p-4 text-left shadow-hard">
          <span className="flex size-12 items-center justify-center border-3 border-foreground bg-secondary text-accent">
            <Building className="size-6" strokeWidth={2.8} aria-hidden="true" />
          </span>
          <span>
            <strong className="block text-base font-black uppercase">Quero contratar</strong>
            <span className="text-sm font-medium">Empresa, cooperativa ou autônomo.</span>
          </span>
        </button>
        <button name="role" value="lawyer" className="flex items-center gap-3.5 border-3 border-foreground bg-card p-4 text-left shadow-hard">
          <span className="flex size-12 items-center justify-center border-3 border-foreground bg-accent text-accent-foreground">
            <Scale className="size-6" strokeWidth={2.8} aria-hidden="true" />
          </span>
          <span>
            <strong className="block text-base font-black uppercase">Sou advogado(a)</strong>
            <span className="text-sm font-medium">Quero ajudar como voluntário(a).</span>
          </span>
        </button>
      </form>
    </div>
  );
}
