import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { homeFor } from "@/lib/auth";
import type { Role } from "@/lib/types";

/** Decide para onde mandar a pessoa depois de entrar. Também grava o tipo de conta, se ainda não houver. */
export async function routeAfterLogin(supabase: SupabaseClient, requestedType: string | null, next: string | null) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "/entrar?erro=sessao";

  let { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!profile?.role && (requestedType === "candidate" || requestedType === "employer" || requestedType === "lawyer" || requestedType === "business")) {
    await supabase.rpc("set_my_role", { p_role: requestedType });
    ({ data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle());
  }
  const role = (profile?.role ?? null) as Role | null;
  if (!role) return "/entrar/tipo";

  if (role === "candidate") {
    const { data } = await supabase.from("candidates").select("completed_at").eq("id", user.id).maybeSingle();
    if (!data?.completed_at) return "/cadastro/candidato";
  }
  if (role === "employer") {
    const { data } = await supabase.from("employers").select("id").eq("id", user.id).maybeSingle();
    if (!data) return "/cadastro/contratante";
  }
  if (role === "business") {
    const { data } = await supabase.from("businesses").select("id").eq("id", user.id).maybeSingle();
    if (!data) return "/cadastro/negocio";
  }
  if (role === "lawyer") {
    const { data } = await supabase.from("lawyers").select("id").eq("id", user.id).maybeSingle();
    if (!data) return "/cadastro/advogado";
  }
  return safeNext(next) ?? homeFor(role);
}

/** Aceita só caminhos internos para evitar redirecionamento aberto. */
export function safeNext(next: string | null) {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return null;
  return next;
}
