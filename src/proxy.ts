import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  // A home é estática e pública: dispensa a checagem de sessão (o cabeçalho lê a sessão no navegador).
  if (request.nextUrl.pathname === "/") return NextResponse.next();
  return updateSession(request);
}

// Páginas públicas estáticas ficam fora do proxy para serem servidas direto do CDN.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|direitos$|advogados$|apoie$|relatos$|politica-de-privacidade$|.*\\.(?:svg|png|jpg|jpeg|gif|webp|pdf)$).*)"],
};
