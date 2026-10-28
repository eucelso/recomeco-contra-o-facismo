import type { NextRequest } from "next/server";
import { handleAuthCallback } from "@/lib/auth-callback";

// Retorno do login com Google (OAuth)
export function GET(request: NextRequest) {
  return handleAuthCallback(request);
}
