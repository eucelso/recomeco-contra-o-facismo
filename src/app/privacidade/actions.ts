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
  const [{ error }, { error: factsError }] = await Promise.all([
    supabase.from("confidential_reports").delete().eq("candidate_id", user.id),
    supabase.from("report_facts").delete().eq("candidate_id", user.id),
  ]);
  if (error || factsError) return { ok: false as const };
  await supabase.from("consent_events").insert({ user_id: user.id, kind: "relato_confidencial", granted: false });
  revalidatePath("/privacidade");
  revalidatePath("/painel/dossie");
  return { ok: true as const };
}

export async function deleteAccount(confirmation: string) {
  if (confirmation.trim().toUpperCase() !== "EXCLUIR") return { ok: false as const, error: "Digite EXCLUIR para confirmar." };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Sessão expirada." };

  // Conta de admin não se exclui por aqui (a checagem final também é do banco).
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role === "admin") return { ok: false as const, error: "Contas de administração não podem ser excluídas por aqui." };

  // Currículo (só candidatos têm): a própria pessoa pode apagar a pasta dela.
  const { data: files } = await supabase.storage.from("resumes").list(user.id);
  if (files?.length) await supabase.storage.from("resumes").remove(files.map((f) => `${user.id}/${f.name}`));

  // Apagar o usuário apaga em cascata perfil, vagas, cadastros, convites e mensagens.
  const { error } = await supabase.rpc("delete_my_account");
  if (error) {
    // Plano B, enquanto a função do banco não estiver aplicada: usa a chave de serviço, se houver.
    let fallbackOk = false;
    try {
      const { error: e2 } = await createAdminClient().auth.admin.deleteUser(user.id);
      fallbackOk = !e2;
    } catch {
      /* sem chave de serviço */
    }
    if (!fallbackOk) return { ok: false as const, error: "Não conseguimos excluir agora. Tente de novo em instantes ou fale com a equipe." };
  }

  await supabase.auth.signOut();
  // As vitrines públicas são guardadas por alguns minutos: atualiza já.
  revalidatePath("/advogados");
  revalidatePath("/apoie");
  revalidatePath("/empresas", "layout");
  revalidatePath("/vagas", "layout");
  redirect("/?conta=excluida");
}
