import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Entrar ou criar conta" };

const ERRORS: Record<string, string> = {
  link: "Esse link expirou ou já foi usado. Peça um novo abaixo.",
  navegador: "Abra o link no mesmo navegador em que você pediu o acesso, ou peça um novo link aqui.",
  sessao: "Sua sessão terminou. Entre de novo, por favor.",
};

export default async function EntrarPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  return (
    <LoginForm
      initialMode={sp.modo === "cadastro" ? "signup" : "login"}
      initialType={sp.tipo === "employer" ? "employer" : "candidate"}
      next={sp.next ?? null}
      error={sp.erro ? ERRORS[sp.erro] ?? null : null}
    />
  );
}
