"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function applyToJob(jobId: string): Promise<{ ok: boolean; error?: string; needLogin?: boolean; needProfile?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, needLogin: true };
  const { data: c } = await supabase.from("candidates").select("completed_at").eq("id", user.id).maybeSingle();
  if (!c?.completed_at) return { ok: false, needProfile: true };
  const { error } = await supabase.from("applications").insert({ job_id: jobId, candidate_id: user.id });
  if (error && error.code !== "23505") return { ok: false, error: "Não deu para registrar seu interesse agora." };
  revalidatePath("/vagas");
  revalidatePath("/painel");
  return { ok: true };
}
