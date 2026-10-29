"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RETURN_KEY } from "@/lib/signup-draft";

/** Barra fixa embaixo (alcance do polegar) para quem veio do cadastro e quer continuar de onde parou. */
export function ReturnToSignup() {
  const [path, setPath] = useState<string | null>(null);
  useEffect(() => {
    try {
      const p = sessionStorage.getItem(RETURN_KEY);
      if (p === "/painel/dossie" || p?.startsWith("/cadastro/")) setPath(p);
    } catch {}
  }, []);
  if (!path) return null;

  return (
    <>
      <div aria-hidden="true" className="h-24" />
      <div className="fixed inset-x-0 bottom-0 z-40 border-t-3 border-foreground bg-background p-3">
        <Link
          href={path}
          onClick={() => {
            try {
              sessionStorage.removeItem(RETURN_KEY);
            } catch {}
          }}
          className="mx-auto flex h-12 max-w-3xl items-center justify-center gap-2 border-3 border-foreground bg-primary text-sm font-black uppercase text-primary-foreground shadow-hard-sm"
        >
          <ArrowLeft className="size-5" strokeWidth={3} aria-hidden="true" /> {path.startsWith("/cadastro/") ? "Voltar ao meu cadastro" : "Voltar ao meu dossiê"}
        </Link>
      </div>
    </>
  );
}
