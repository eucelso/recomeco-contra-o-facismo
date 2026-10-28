"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function respondInvite(id: string, accept: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("respond_contact", { p_id: id, p_accept: accept });
  if (error) return { ok: false as const, error: "Este convite não está mais disponível." };
  revalidatePath("/painel");
  revalidatePath("/mensagens");
  return { ok: true as const };
}

export async function revokeAccess(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("revoke_contact", { p_id: id });
  if (error) return { ok: false as const, error: "Não deu para revogar agora." };
  revalidatePath("/privacidade");
  revalidatePath("/painel");
  return { ok: true as const };
}

export async function withdrawApplication(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("applications").delete().eq("id", id);
  if (error) return { ok: false as const, error: "Não deu para cancelar agora." };
  revalidatePath("/painel");
  return { ok: true as const };
}
