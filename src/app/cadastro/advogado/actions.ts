"use server";

import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { LAWYER_COMMITMENT_VERSION } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { lawyerSchema, onlyDigits } from "@/lib/validation";

export async function saveLawyer(input: z.input<typeof lawyerSchema>): Promise<{ ok: true } | { ok: false; error: string; field?: string }> {
  const parsed = lawyerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Confira os campos." };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada. Entre de novo." };

  const d = parsed.data;
  const row = {
    id: user.id,
    full_name: d.full_name,
    oab_state: d.oab_state,
    oab_number: d.oab_number,
    areas: d.areas,
    city: d.city,
    state: d.state,
    online: d.online,
    contact_kind: d.contact_kind,
    contact_value: d.contact_kind === "whatsapp" ? onlyDigits(d.contact_value) : d.contact_value.toLowerCase(),
    bio: d.bio || null,
    commitment_version: LAWYER_COMMITMENT_VERSION,
    commitment_accepted_at: new Date().toISOString(),
  };
  const { error } = await supabase.from("lawyers").upsert(row);
  if (error) {
    if (error.code === "23505") return { ok: false, error: "Essa OAB já está cadastrada.", field: "oab_number" };
    return { ok: false, error: "Não conseguimos salvar agora. Tente de novo." };
  }
  await supabase.from("consent_events").insert({ user_id: user.id, kind: `compromisso_advogado_${LAWYER_COMMITMENT_VERSION}`, granted: true });
  revalidatePath("/advogado");
  revalidatePath("/advogados");
  return { ok: true };
}

/** Pausa ou retoma a aparição na lista pública, sem mexer na verificação. */
export async function setAccepting(value: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const };
  const { error } = await supabase.from("lawyers").update({ accepting: value }).eq("id", user.id);
  if (error) return { ok: false as const };
  revalidatePath("/advogado");
  revalidatePath("/advogados");
  return { ok: true as const };
}
