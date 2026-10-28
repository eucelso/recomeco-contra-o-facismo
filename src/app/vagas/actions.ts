"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function applyToJob(
  jobId: string,
): Promise<{ ok: boolean; error?: string; needLogin?: boolean; needProfile?: boolean; matched?: boolean; contactId?: string; peerName?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, needLogin: true };
  const { data: c } = await supabase.from("candidates").select("completed_at").eq("id", user.id).maybeSingle();
  if (!c?.completed_at) return { ok: false, needProfile: true };
  // Mesmo caminho do Combina: "Tenho interesse" no mural = deslizar para a direita
  const { data, error } = await supabase.rpc("combina_candidate_swipe", { p_job: jobId, p_choice: "like" });
  if (error) return { ok: false, error: "Não deu para registrar seu interesse agora." };
  const d = (data ?? {}) as { matched?: boolean; contact_id?: string; peer_name?: string };
  revalidatePath("/vagas");
  revalidatePath("/painel");
  revalidatePath("/combina");
  return { ok: true, matched: Boolean(d.matched), contactId: d.contact_id, peerName: d.peer_name };
}
