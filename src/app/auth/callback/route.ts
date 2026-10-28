import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { routeAfterLogin } from "@/lib/post-login";

// Retorno do login com Google (OAuth, fluxo PKCE)
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  if (!code) return NextResponse.redirect(`${origin}/entrar?erro=link`);

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(`${origin}/entrar?erro=link`);

  const path = await routeAfterLogin(supabase, searchParams.get("tipo"), searchParams.get("next"));
  return NextResponse.redirect(`${origin}${path}`);
}
