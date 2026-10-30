"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { MAX_FACTS, factSchema, type FactInput } from "@/lib/dossier";
import { MissingKeyError } from "@/lib/dossier-crypto";
import { sealFact, sealNotes } from "@/lib/dossier-server";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function ctx() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const uid = data?.claims?.sub;
  return uid ? { supabase, uid } : null;
}

const blank = (v?: string) => (v && v.length ? v : null);
const KEY_ERROR = { ok: false as const, error: "A criptografia não está configurada neste ambiente. Avise a equipe." };

/** Registra o consentimento na primeira vez que a pessoa começa a guardar algo. */
async function ensureConsent(supabase: Awaited<ReturnType<typeof createClient>>, uid: string) {
  const [{ count: facts }, { count: notes }] = await Promise.all([
    supabase.from("report_facts").select("id", { count: "exact", head: true }).eq("candidate_id", uid),
    supabase.from("confidential_reports").select("candidate_id", { count: "exact", head: true }).eq("candidate_id", uid),
  ]);
  if (!facts && !notes) await supabase.from("consent_events").insert({ user_id: uid, kind: "relato_confidencial", granted: true });
}

export async function saveFact(id: string | null, input: FactInput) {
  const parsed = factSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Confira os campos." };
  if (id && !UUID.test(id)) return { ok: false as const, error: "Pedido inválido." };
  const c = await ctx();
  if (!c) return { ok: false as const, error: "Sessão expirada. Entre de novo." };
  const d = parsed.data;
  const data = { happened_on: blank(d.happened_on), place: blank(d.place), who: blank(d.who), what: d.what, evidence: blank(d.evidence), witnesses: blank(d.witnesses) };

  try {
    if (id) {
      const { error } = await c.supabase.from("report_facts").update({ data_enc: sealFact(c.uid, id, data) }).eq("id", id).eq("candidate_id", c.uid);
      if (error) return { ok: false as const, error: "Não deu para salvar agora." };
    } else {
      const { count } = await c.supabase.from("report_facts").select("id", { count: "exact", head: true }).eq("candidate_id", c.uid);
      if ((count ?? 0) >= MAX_FACTS) return { ok: false as const, error: `Limite de ${MAX_FACTS} fatos. Junte os parecidos em um só.` };
      await ensureConsent(c.supabase, c.uid);
      const newId = randomUUID();
      const { error } = await c.supabase.from("report_facts").insert({ id: newId, candidate_id: c.uid, data_enc: sealFact(c.uid, newId, data) });
      if (error) return { ok: false as const, error: "Não deu para salvar agora." };
    }
  } catch (e) {
    if (e instanceof MissingKeyError) return KEY_ERROR;
    throw e;
  }
  revalidatePath("/painel/dossie");
  return { ok: true as const };
}

export async function deleteFact(id: string) {
  if (!UUID.test(id)) return { ok: false as const, error: "Pedido inválido." };
  const c = await ctx();
  if (!c) return { ok: false as const, error: "Sessão expirada. Entre de novo." };
  const { error } = await c.supabase.from("report_facts").delete().eq("id", id).eq("candidate_id", c.uid);
  if (error) return { ok: false as const, error: "Não deu para apagar agora." };
  revalidatePath("/painel/dossie");
  return { ok: true as const };
}

/** Texto livre do dossiê (o mesmo relato confidencial do cadastro). Vazio apaga. */
export async function saveNotes(text: string) {
  const body = text.trim();
  if (body.length > 3000) return { ok: false as const, error: "Passou de 3000 caracteres." };
  const c = await ctx();
  if (!c) return { ok: false as const, error: "Sessão expirada. Entre de novo." };
  if (!body) {
    const { error } = await c.supabase.from("confidential_reports").delete().eq("candidate_id", c.uid);
    if (error) return { ok: false as const, error: "Não deu para salvar agora." };
  } else {
    await ensureConsent(c.supabase, c.uid);
    let sealed: string;
    try {
      sealed = sealNotes(c.uid, body);
    } catch (e) {
      if (e instanceof MissingKeyError) return KEY_ERROR;
      throw e;
    }
    const { error } = await c.supabase.from("confidential_reports").upsert({ candidate_id: c.uid, body: sealed, consent_at: new Date().toISOString() });
    if (error) return { ok: false as const, error: "Não deu para salvar agora." };
  }
  revalidatePath("/painel/dossie");
  revalidatePath("/painel");
  return { ok: true as const };
}
