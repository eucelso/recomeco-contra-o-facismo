"use server";

import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { COMMITMENT_VERSION } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { employerSchema, onlyDigits } from "@/lib/validation";

export async function saveEmployer(input: z.input<typeof employerSchema>): Promise<{ ok: true } | { ok: false; error: string; field?: string }> {
  const parsed = employerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Confira os campos." };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada. Entre de novo." };

  const d = parsed.data;
  const row = {
    id: user.id,
    kind: d.kind,
    document: onlyDigits(d.document),
    display_name: d.display_name,
    legal_name: d.legal_name || null,
    sector: d.sector,
    city: d.city,
    state: d.state,
    responsible_name: d.responsible_name,
    commitment_version: COMMITMENT_VERSION,
    commitment_accepted_at: new Date().toISOString(),
  };
  const { error } = await supabase.from("employers").upsert(row);
  if (error) {
    if (error.code === "23505") return { ok: false, error: "Esse documento já está cadastrado.", field: "document" };
    return { ok: false, error: "Não conseguimos salvar agora. Tente de novo." };
  }
  await supabase.from("consent_events").insert({ user_id: user.id, kind: `compromisso_${COMMITMENT_VERSION}`, granted: true });
  revalidatePath("/contratante");
  return { ok: true };
}
