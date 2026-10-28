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
