import Link from "next/link";
import { Fist } from "@/components/brand/fist";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main id="conteudo" className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-5 px-4 text-center">
      <div aria-hidden="true" className="flex size-36 items-center justify-center rounded-full border-[4px] border-foreground bg-rays-mustard shadow-hard">
        <Fist className="h-20 w-[60px]" strokeWidth={6} />
      </div>
      <h1 className="font-display text-5xl uppercase leading-none">Página não encontrada</h1>
      <p className="font-medium">O endereço pode ter mudado, ou esse conteúdo não está disponível para a sua conta.</p>
      <Button asChild>
        <Link href="/">Voltar ao início</Link>
      </Button>
    </main>
  );
}
