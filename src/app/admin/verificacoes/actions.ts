"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function reviewEmployer(id: string, approve: boolean, reason?: string) {
  const supabase = await createClient();
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) return { ok: false as const, error: "Sem permissão." };
  const { error } = await supabase
    .from("employers")
    .update(approve ? { verification_status: "verified", rejection_reason: null } : { verification_status: "rejected", rejection_reason: reason?.slice(0, 300) || "Não conseguimos confirmar os dados." })
    .eq("id", id);
  if (error) return { ok: false as const, error: "Não deu para salvar." };
  revalidatePath("/admin/verificacoes");
  return { ok: true as const };
}

export async function reviewLawyer(id: string, approve: boolean, reason?: string) {
  const supabase = await createClient();
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) return { ok: false as const, error: "Sem permissão." };
  const { error } = await supabase
    .from("lawyers")
    .update(approve ? { verification_status: "verified", rejection_reason: null } : { verification_status: "rejected", rejection_reason: reason?.slice(0, 300) || "Não conseguimos confirmar a inscrição na OAB." })
    .eq("id", id);
  if (error) return { ok: false as const, error: "Não deu para salvar." };
  revalidatePath("/admin/verificacoes");
  revalidatePath("/advogados");
  return { ok: true as const };
}

export async function reviewBusiness(id: string, approve: boolean, reason?: string) {
  const supabase = await createClient();
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) return { ok: false as const, error: "Sem permissão." };
  const { error } = await supabase
    .from("businesses")
    .update(approve ? { verification_status: "verified", rejection_reason: null } : { verification_status: "rejected", rejection_reason: reason?.slice(0, 300) || "Não conseguimos confirmar os dados." })
    .eq("id", id);
  if (error) return { ok: false as const, error: "Não deu para salvar." };
  revalidatePath("/admin/verificacoes");
  revalidatePath("/apoie");
  return { ok: true as const };
}

/** Moderação de relatos anônimos. "reject" e "remove" apagam o relato: não guardamos nada dele. */
export async function moderateReport(id: string, decision: "approve" | "reject" | "keep" | "remove", text?: string) {
  const supabase = await createClient();
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) return { ok: false as const, error: "Sem permissão." };

  let error;
  if (decision === "approve") {
    const story = text?.trim();
    if (!story || story.length < 30 || story.length > 1500) return { ok: false as const, error: "O texto precisa ter de 30 a 1.500 caracteres." };
    ({ error } = await supabase.from("public_reports").update({ story, status: "approved", approved_at: new Date().toISOString() }).eq("id", id));
  } else if (decision === "keep") {
    ({ error } = await supabase.from("public_reports").update({ flags: 0 }).eq("id", id));
    if (!error) await supabase.from("report_flags").delete().eq("report_id", id);
  } else {
    ({ error } = await supabase.from("public_reports").delete().eq("id", id));
  }
  if (error) return { ok: false as const, error: "Não deu para salvar." };
  revalidatePath("/admin/verificacoes");
  revalidatePath("/relatos");
  return { ok: true as const };
}
