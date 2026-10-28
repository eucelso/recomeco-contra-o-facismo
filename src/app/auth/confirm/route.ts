import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { routeAfterLogin } from "@/lib/post-login";

// Link mágico por e-mail (token_hash). Funciona mesmo se o e-mail for aberto em outro navegador.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = (searchParams.get("type") ?? "email") as EmailOtpType;
  if (!tokenHash) return NextResponse.redirect(`${origin}/entrar?erro=link`);

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
  if (error) return NextResponse.redirect(`${origin}/entrar?erro=link`);

  // Parâmetros extras chegam dentro de redirect_to (= emailRedirectTo)
  let tipo = searchParams.get("tipo");
  let next = searchParams.get("next");
  const redirectTo = searchParams.get("redirect_to");
  if (redirectTo) {
    try {
      const inner = new URL(redirectTo);
      tipo ??= inner.searchParams.get("tipo");
      next ??= inner.searchParams.get("next");
    } catch {
      /* ignora redirect_to malformado */
    }
  }

  const path = await routeAfterLogin(supabase, tipo, next);
  return NextResponse.redirect(`${origin}${path}`);
}
