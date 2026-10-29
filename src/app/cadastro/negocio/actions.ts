"use server";

import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { BUSINESS_COMMITMENT_VERSION } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { businessSchema, onlyDigits } from "@/lib/validation";

export async function saveBusiness(input: z.input<typeof businessSchema>): Promise<{ ok: true } | { ok: false; error: string; field?: string }> {
  const parsed = businessSchema.safeParse(input);
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
    category: d.category,
    city: d.city,
    state: d.state,
    neighborhood: d.neighborhood || null,
    address: d.address || null,
    whatsapp: d.whatsapp ? onlyDigits(d.whatsapp) : null,
    instagram: d.instagram ? d.instagram.replace(/^@/, "") : null,
    website: d.website || null,
    hours: d.hours || null,
    story: d.story,
    commitment_version: BUSINESS_COMMITMENT_VERSION,
    commitment_accepted_at: new Date().toISOString(),
  };
  const { error } = await supabase.from("businesses").upsert(row);
  if (error) {
    if (error.code === "23505") return { ok: false, error: "Esse documento já está cadastrado.", field: "document" };
    return { ok: false, error: "Não conseguimos salvar agora. Tente de novo." };
  }
  await supabase.from("consent_events").insert({ user_id: user.id, kind: `compromisso_negocio_${BUSINESS_COMMITMENT_VERSION}`, granted: true });
  revalidatePath("/negocio");
  revalidatePath("/apoie");
  return { ok: true };
}

/** Esconde ou mostra o negócio na lista pública, sem mexer na verificação. */
export async function setVisible(value: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const };
  const { error } = await supabase.from("businesses").update({ visible: value }).eq("id", user.id);
  if (error) return { ok: false as const };
  revalidatePath("/negocio");
  revalidatePath("/apoie");
  return { ok: true as const };
}
