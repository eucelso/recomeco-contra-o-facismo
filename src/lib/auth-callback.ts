import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { routeAfterLogin } from "@/lib/post-login";

/**
 * Trata os três formatos de retorno do Supabase Auth:
 *  1. ?code=...                (PKCE: Google ou link mágico com o template padrão; precisa ser o mesmo navegador)
 *  2. ?token_hash=...&type=... (template personalizado: funciona em qualquer navegador)
 *  3. ?error=...               (link expirado, já usado etc.)
 */
export async function handleAuthCallback(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;

  if (searchParams.get("error") || searchParams.get("error_code")) {
    return NextResponse.redirect(`${origin}/entrar?erro=link`);
  }

  // Parâmetros nossos podem vir direto ou dentro de redirect_to
  let tipo = searchParams.get("tipo");
  let next = searchParams.get("next");
  const redirectTo = searchParams.get("redirect_to");
  if (redirectTo) {
    try {
      const inner = new URL(redirectTo);
      tipo ??= inner.searchParams.get("tipo");
      next ??= inner.searchParams.get("next");
    } catch {
      /* ignora */
    }
  }

  const supabase = await createClient();
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("[auth] exchangeCodeForSession:", error.message);
      return NextResponse.redirect(`${origin}/entrar?erro=${error.message.includes("verifier") ? "navegador" : "link"}`);
    }
  } else if (tokenHash) {
    const type = (searchParams.get("type") ?? "email") as EmailOtpType;
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error) {
      console.error("[auth] verifyOtp:", error.message);
      return NextResponse.redirect(`${origin}/entrar?erro=link`);
    }
  } else {
    return NextResponse.redirect(`${origin}/entrar?erro=link`);
  }

  const path = await routeAfterLogin(supabase, tipo, next);
  return NextResponse.redirect(`${origin}${path}`);
}
