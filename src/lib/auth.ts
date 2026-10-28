import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/types";

export function hasSupabaseEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export async function getSession() {
  if (!hasSupabaseEnv()) return { supabase: null as never, user: null, role: null as Role | null };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, role: null as Role | null };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  return { supabase, user, role: (profile?.role ?? null) as Role | null };
}

/** Exige login e (opcionalmente) um papel. Redireciona quando não atende. */
export async function requireRole(role?: Role) {
  const session = await getSession();
  if (!session.user) redirect("/entrar");
  if (!session.role) redirect("/entrar/tipo");
  if (role && session.role !== role && session.role !== "admin") {
    redirect(session.role === "employer" ? "/contratante" : "/painel");
  }
  return session as typeof session & { user: NonNullable<typeof session.user>; role: Role };
}

export function homeFor(role: Role | null) {
  if (role === "employer") return "/contratante";
  if (role === "admin") return "/admin/verificacoes";
  return "/painel";
}
