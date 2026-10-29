import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";

/**
 * Identificador temporário só para limitar abuso: hash de rede + dia, sem guardar o IP.
 * Muda todo dia e não tem ligação com o relato.
 */
export async function throttleBucket() {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0]?.trim() || h.get("x-real-ip") || "desconhecido";
  const day = new Date().toISOString().slice(0, 10);
  return createHash("sha256").update(`${ip}|${h.get("user-agent") ?? ""}|${day}|${process.env.SUPABASE_SERVICE_ROLE_KEY ?? "recomeco"}`).digest("hex");
}
