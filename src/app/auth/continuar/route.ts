import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { routeAfterLogin } from "@/lib/post-login";

// Destino depois de entrar ou cadastrar com e-mail e senha: a sessão já existe, só falta decidir para onde ir.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const supabase = await createClient();
  const path = await routeAfterLogin(supabase, searchParams.get("tipo"), searchParams.get("next"));
  return NextResponse.redirect(`${origin}${path}`);
}
