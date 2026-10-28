"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase/server";

const FIELDS = ["anonymous", "show_region_only", "invites_paused"] as const;
type Field = (typeof FIELDS)[number];

export async function setPrivacy(field: Field, value: boolean) {
  if (!FIELDS.includes(field)) return { ok: false as const };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const };
  const { error } = await supabase.from("candidates").update({ [field]: value }).eq("id", user.id);
  if (error) return { ok: false as const };
  await supabase.from("consent_events").insert({ user_id: user.id, kind: field, granted: value });
  revalidatePath("/privacidade");
  revalidatePath("/painel");
  return { ok: true as const };
}

export async function deleteReport() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const };
  const { error } = await supabase.from("confidential_reports").delete().eq("candidate_id", user.id);
  if (error) return { ok: false as const };
  await supabase.from("consent_events").insert({ user_id: user.id, kind: "relato_confidencial", granted: false });
  revalidatePath("/privacidade");
  return { ok: true as const };
}

export async function deleteAccount(confirmation: string) {
  if (confirmation.trim().toUpperCase() !== "EXCLUIR") return { ok: false as const, error: "Digite EXCLUIR para confirmar." };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Sessão expirada." };

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return { ok: false as const, error: "A exclusão ainda não está configurada no servidor. Fale com a equipe." };
  }
  const { data: files } = await admin.storage.from("resumes").list(user.id);
  if (files?.length) await admin.storage.from("resumes").remove(files.map((f) => `${user.id}/${f.name}`));
  // Apagar o usuário apaga em cascata perfil, currículo, relato, convites e mensagens.
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return { ok: false as const, error: "Não conseguimos excluir agora. Tente de novo." };
  await supabase.auth.signOut();
  redirect("/?conta=excluida");
}
