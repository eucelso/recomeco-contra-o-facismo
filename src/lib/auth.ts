import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/supabase/env";
import type { Role } from "@/lib/types";

export function hasSupabaseEnv() {
  return Boolean(SUPABASE_URL && SUPABASE_KEY);
}

export type SessionUser = { id: string; email: string | undefined; user_metadata: Record<string, unknown> };

/**
 * Uma chamada por requisição (deduplicada com React cache).
 * A identidade vem do JWT validado localmente (getClaims, chaves assimétricas): sem ida ao Auth do Supabase.
 * Ações sensíveis (ex.: excluir conta) continuam usando getUser.
 */
export const getSession = cache(async function getSession() {
  if (!hasSupabaseEnv()) return { supabase: null as never, user: null, role: null as Role | null };
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return { supabase, user: null, role: null as Role | null };
  const user: SessionUser = {
    id: claims.sub,
    email: claims.email,
    user_metadata: (claims.user_metadata as Record<string, unknown> | undefined) ?? {},
  };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  return { supabase, user, role: (profile?.role ?? null) as Role | null };
});

/** Exige login e (opcionalmente) um papel. Redireciona quando não atende. */
export async function requireRole(role?: Role) {
  const session = await getSession();
  if (!session.user) redirect("/entrar");
  if (!session.role) redirect("/entrar/tipo");
  if (role && session.role !== role && session.role !== "admin") {
    redirect(homeFor(session.role));
  }
  return session as typeof session & { user: NonNullable<typeof session.user>; role: Role };
}

export function homeFor(role: Role | null) {
  if (role === "employer") return "/contratante";
  if (role === "lawyer") return "/advogado";
  if (role === "business") return "/negocio";
  if (role === "admin") return "/admin/verificacoes";
  return "/painel";
}
