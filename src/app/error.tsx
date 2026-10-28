"use client";

import { Button } from "@/components/ui/button";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="conteudo" className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-5 px-4 text-center">
      <h1 className="font-display text-5xl uppercase leading-none">Algo deu errado</h1>
      <p className="font-medium">Não foi culpa sua. Tente de novo em instantes.</p>
      <Button onClick={reset}>Tentar de novo</Button>
    </main>
  );
}
