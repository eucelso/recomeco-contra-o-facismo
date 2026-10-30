"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function requestRenewal(id: string) {
  if (!UUID.test(id)) return { ok: false as const, error: "Pedido inválido." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("lawyer_request_renewal", { p_id: id });
  if (error || !data) return { ok: false as const, error: "Só dá para pedir renovação na última semana de validade ou depois de vencer." };
  revalidatePath("/advogado");
  revalidatePath("/painel/dossie");
  return { ok: true as const };
}
