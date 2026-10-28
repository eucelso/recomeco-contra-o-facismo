import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b-3 border-foreground">
        <div className="mx-auto flex h-[60px] max-w-md items-center justify-between px-2">
          <Link href="/" aria-label="Voltar para o início" className="flex size-11 items-center justify-center">
            <ChevronLeft className="size-7" strokeWidth={3} />
          </Link>
          <span className="font-display text-[22px]">RECOMEÇO</span>
          <span className="w-11" />
        </div>
      </header>
      <main id="conteudo" className="mx-auto w-full max-w-md flex-1 px-4 pb-10 pt-6">
        {children}
      </main>
    </div>
  );
}
