import type { NextRequest } from "next/server";
import { handleAuthCallback } from "@/lib/auth-callback";

// Retorno do link mágico por e-mail
export function GET(request: NextRequest) {
  return handleAuthCallback(request);
}
