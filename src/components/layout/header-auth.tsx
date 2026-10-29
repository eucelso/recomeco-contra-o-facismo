"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

/**
 * Botões de entrar/painel. A sessão é lida no navegador (do cookie, sem ir à rede),
 * assim o resto do cabeçalho e as páginas públicas continuam estáticos.
 */
export function HeaderAuth() {
  const [logged, setLogged] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    try {
      createClient()
        .auth.getSession()
        .then(({ data }) => alive && setLogged(Boolean(data.session)))
        .catch(() => alive && setLogged(false));
    } catch {
      setLogged(false);
    }
    return () => {
      alive = false;
    };
  }, []);

  if (logged === null) return <span aria-hidden="true" className="h-9 w-24" />;
  if (logged)
    return (
      <Button asChild variant="secondary" size="sm" className="shadow-none">
        {/* A rota decide o destino pelo tipo de conta */}
        <Link href="/auth/continuar" prefetch={false}>
          Meu painel
        </Link>
      </Button>
    );
  return (
    <>
      <Button asChild variant="ghost" size="sm" className="shadow-none">
        <Link href="/entrar">Entrar</Link>
      </Button>
      <Button asChild variant="secondary" size="sm" className="hidden shadow-none sm:inline-flex">
        <Link href="/entrar?modo=cadastro">Criar conta</Link>
      </Button>
    </>
  );
}
