"use server";

import type { z } from "zod";
import { throttleBucket } from "@/lib/report-bucket";
import { createPublicClient } from "@/lib/supabase/public";
import { reportSchema } from "@/lib/validation";

export async function submitReport(input: z.input<typeof reportSchema>): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = reportSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Confira os campos." };
  const d = parsed.data;
  // Robô preencheu o campo escondido: finge que deu certo, sem gravar nada.
  if (d.website) return { ok: true };

  const { error } = await createPublicClient().rpc("submit_public_report", {
    p_story: d.story,
    p_topic: d.topic,
    p_city: d.city ?? null,
    p_state: d.state ?? null,
    p_bucket: await throttleBucket(),
  });
  if (error) {
    if (error.message.includes("rate_limit")) return { ok: false, error: "Você já enviou relatos demais por agora. Tente de novo mais tarde." };
    if (error.message.includes("busy")) return { ok: false, error: "Recebemos muitos relatos agora. Tente de novo daqui a pouco." };
    return { ok: false, error: "Não conseguimos enviar agora. Tente de novo." };
  }
  return { ok: true };
}
