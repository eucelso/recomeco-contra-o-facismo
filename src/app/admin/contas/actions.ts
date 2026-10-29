"use server";

import { revalidatePath } from "next/cache";
import type { SuspendKind } from "@/lib/admin-accounts";
import { createClient } from "@/lib/supabase/server";

const KINDS: SuspendKind[] = ["lawyer", "business", "employer", "candidate"];

/** Oculta (ou volta a exibir) uma conta na plataforma. Só admin; a checagem final é do banco. */
export async function setSuspension(kind: SuspendKind, id: string, suspend: boolean, reason?: string) {
  if (!KINDS.includes(kind) || !/^[0-9a-f-]{36}$/i.test(id)) return { ok: false as const, error: "Pedido inválido." };
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
