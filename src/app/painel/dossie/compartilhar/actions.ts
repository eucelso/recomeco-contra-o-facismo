"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import type { SharePayload } from "@/lib/dossier-share";
import { MissingKeyError, ctxShare, sealJson } from "@/lib/dossier-crypto";
import { sortFacts } from "@/lib/dossier";
import { loadFacts, loadNotes } from "@/lib/dossier-server";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const contactSchema = z
  .object({ kind: z.enum(["whatsapp", "email", ""]), value: z.string().trim().max(120) })
  .superRefine((c, ctx) => {
    if (c.kind === "" && c.value) ctx.addIssue({ code: "custom", message: "Escolha se o contato é WhatsApp ou e-mail." });
    if (c.kind === "email" && c.value && !z.email().safeParse(c.value).success) ctx.addIssue({ code: "custom", message: "Confira o e-mail." });
    if (c.kind === "whatsapp" && c.value && !/^\d{10,13}$/.test(c.value.replace(/\D/g, ""))) ctx.addIssue({ code: "custom", message: "Confira o número (com DDD)." });
    if (c.kind && !c.value) ctx.addIssue({ code: "custom", message: "Digite o contato ou deixe os dois campos vazios." });
  });

export async function shareDossier(lawyerId: string, kind: string, value: string) {
  if (!UUID.test(lawyerId)) return { ok: false as const, error: "Pedido inválido." };
  const parsed = contactSchema.safeParse({ kind, value });
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Confira o contato." };
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const uid = claims?.claims?.sub;
  if (!uid) return { ok: false as const, error: "Sessão expirada. Entre de novo." };

  const [{ data: me }, { facts }, notes] = await Promise.all([
    supabase.from("candidates").select("full_name").eq("id", uid).maybeSingle(),
    loadFacts(supabase, uid),
    loadNotes(supabase, uid),
  ]);
  if (!me) return { ok: false as const, error: "Só candidatos compartilham o dossiê." };
  if (facts.length === 0 && !notes) return { ok: false as const, error: "Seu dossiê está vazio. Adicione um fato ou escreva um texto antes." };

  const id = randomUUID();
  let payload: string;
  try {
    const body: SharePayload = {
      worker_name: me.full_name,
      contact_kind: parsed.data.kind || null,
      contact_value: parsed.data.value || null,
      facts: sortFacts(facts).map(({ happened_on, place, who, what, evidence, witnesses }) => ({ happened_on, place, who, what, evidence, witnesses })),
      notes: notes || null,
    };
    payload = sealJson(ctxShare(id), body);
  } catch (e) {
    if (e instanceof MissingKeyError) return { ok: false as const, error: "A criptografia não está configurada neste ambiente. Avise a equipe." };
    throw e;
  }

  const { error } = await supabase.rpc("create_dossier_share", {
    p_id: id,
    p_lawyer: lawyerId,
    p_has_contact: Boolean(parsed.data.kind && parsed.data.value),
    p_payload: payload,
  });
  if (error) {
    const m = error.message;
    if (m.includes("already shared")) return { ok: false as const, error: "Você já compartilhou com este advogado. Revogue o anterior para enviar uma cópia nova." };
    if (m.includes("too many")) return { ok: false as const, error: "Você já tem 5 compartilhamentos ativos. Revogue algum para continuar." };
    if (m.includes("empty dossier")) return { ok: false as const, error: "Seu dossiê está vazio. Adicione um fato ou escreva um texto antes." };
    if (m.includes("lawyer unavailable")) return { ok: false as const, error: "Este advogado não está disponível agora." };
    if (m.includes("not a candidate")) return { ok: false as const, error: "Só candidatos compartilham o dossiê." };
    return { ok: false as const, error: "Não deu para compartilhar agora. Confira se a migration dossier_shares foi aplicada." };
  }
  revalidatePath("/painel/dossie");
  revalidatePath("/advogado");
  return { ok: true as const };
}

export async function revokeShare(id: string) {
  if (!UUID.test(id)) return { ok: false as const, error: "Pedido inválido." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("revoke_dossier_share", { p_id: id });
  if (error || !data) return { ok: false as const, error: "Não deu para revogar agora." };
  revalidatePath("/painel/dossie");
  revalidatePath("/advogado");
  return { ok: true as const };
}

export async function renewShare(id: string) {
  if (!UUID.test(id)) return { ok: false as const, error: "Pedido inválido." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("renew_dossier_share", { p_id: id });
  if (error || !data) return { ok: false as const, error: "Não deu para renovar agora." };
  revalidatePath("/painel/dossie");
  revalidatePath("/advogado");
  return { ok: true as const };
}
