"use server";

import { revalidatePath } from "next/cache";
import type { SuspendKind } from "@/lib/admin-accounts";
import { createAdminClient, createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const KINDS: SuspendKind[] = ["lawyer", "business", "employer", "candidate"];

/** Oculta (ou volta a exibir) uma conta na plataforma. Só admin; a checagem final é do banco. */
export async function setSuspension(kind: SuspendKind, id: string, suspend: boolean, reason?: string) {
  if (!KINDS.includes(kind) || !UUID.test(id)) return { ok: false as const, error: "Pedido inválido." };
  const supabase = await createClient();
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) return { ok: false as const, error: "Sem permissão." };
  const { data, error } = await supabase.rpc("admin_set_suspension", { p_kind: kind, p_id: id, p_suspend: suspend, p_reason: reason ?? null });
  if (error || !data) return { ok: false as const, error: "Não deu para salvar." };
  revalidatePath("/admin/contas");
  revalidatePath("/advogados");
  revalidatePath("/apoie");
  revalidatePath("/empresas", "layout");
  revalidatePath("/vagas", "layout");
  return { ok: true as const };
}

/** Exclui de vez a conta de outra pessoa. Só admin; o banco recusa admin e a própria conta. */
export async function deleteAccountAsAdmin(id: string, confirmation: string) {
  if (!UUID.test(id)) return { ok: false as const, error: "Pedido inválido." };
  if (confirmation.trim().toUpperCase() !== "EXCLUIR") return { ok: false as const, error: "Digite EXCLUIR para confirmar." };
  const supabase = await createClient();
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) return { ok: false as const, error: "Sem permissão." };

  // Currículo (só candidatos têm). O arquivo não some sozinho com a conta: tenta apagar se houver chave de serviço.
  try {
    const admin = createAdminClient();
    const { data: files } = await admin.storage.from("resumes").list(id);
    if (files?.length) await admin.storage.from("resumes").remove(files.map((f) => `${id}/${f.name}`));
  } catch {
    /* sem chave de serviço: a exclusão segue, o arquivo (se existir) fica órfão */
  }

  const { data, error } = await supabase.rpc("admin_delete_account", { p_id: id });
  if (error) {
    if (error.message.includes("admin")) return { ok: false as const, error: "Contas de administração não podem ser excluídas." };
    if (error.message.includes("self")) return { ok: false as const, error: "Você não pode excluir a própria conta por aqui." };
    return { ok: false as const, error: "Não deu para excluir. Confira se a migration admin_delete_account foi aplicada." };
  }
  if (!data) return { ok: false as const, error: "Conta não encontrada (talvez já tenha sido excluída)." };
  revalidatePath("/admin/contas");
  revalidatePath("/advogados");
  revalidatePath("/apoie");
  revalidatePath("/empresas", "layout");
  revalidatePath("/vagas", "layout");
  return { ok: true as const };
}
