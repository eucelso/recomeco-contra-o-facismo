"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { SwipeChoice, SwipeResult } from "@/lib/types";

const UUID = /^[0-9a-f-]{36}$/;

function toResult(data: unknown, error: { message: string } | null): SwipeResult {
  if (error) {
    const m = error.message;
    if (m.includes("profile incomplete")) return { ok: false, error: "Complete seu cadastro para combinar." };
    if (m.includes("not verified")) return { ok: false, error: "Sua empresa ainda está em verificação." };
    if (m.includes("not available")) return { ok: false, error: "Essa carta não está mais disponível." };
    return { ok: false, error: "Não deu para registrar agora. Tente de novo." };
  }
  const d = (data ?? {}) as { matched?: boolean; contact_id?: string; peer_name?: string };
  if (d.matched) {
    revalidatePath("/mensagens");
    revalidatePath("/painel");
    revalidatePath("/contratante");
  }
  return { ok: true, matched: Boolean(d.matched), contactId: d.contact_id, peerName: d.peer_name };
}

export async function swipeJob(jobId: string, choice: SwipeChoice): Promise<SwipeResult> {
  if (!UUID.test(jobId) || (choice !== "like" && choice !== "pass")) return { ok: false, error: "Pedido inválido." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("combina_candidate_swipe", { p_job: jobId, p_choice: choice });
  return toResult(data, error);
}

export async function undoJob(jobId: string) {
  if (!UUID.test(jobId)) return { ok: false as const };
  const supabase = await createClient();
  const { error } = await supabase.rpc("combina_candidate_undo", { p_job: jobId });
  return error ? { ok: false as const, error: error.message.includes("matched") ? "Já deu liga: não dá para desfazer." : "Não deu para desfazer." } : { ok: true as const };
}

export async function swipeCandidate(jobId: string, candidateId: string, choice: SwipeChoice): Promise<SwipeResult> {
  if (!UUID.test(jobId) || !UUID.test(candidateId) || (choice !== "like" && choice !== "pass")) return { ok: false, error: "Pedido inválido." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("combina_employer_swipe", { p_job: jobId, p_candidate: candidateId, p_choice: choice });
  return toResult(data, error);
}

export async function undoCandidate(jobId: string, candidateId: string) {
  if (!UUID.test(jobId) || !UUID.test(candidateId)) return { ok: false as const };
  const supabase = await createClient();
  const { error } = await supabase.rpc("combina_employer_undo", { p_job: jobId, p_candidate: candidateId });
  return error ? { ok: false as const, error: error.message.includes("matched") ? "Já deu liga: não dá para desfazer." : "Não deu para desfazer." } : { ok: true as const };
}
