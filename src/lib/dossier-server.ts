import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Fact } from "@/lib/dossier";
import { ctxFact, ctxNotes, openJson, openText, sealJson, sealText } from "@/lib/dossier-crypto";

export type FactData = Omit<Fact, "id" | "created_at">;

export const sealFact = (candidateId: string, factId: string, d: FactData) => sealJson(ctxFact(candidateId, factId), d);
export const sealNotes = (candidateId: string, text: string) => sealText(ctxNotes(candidateId), text);

/** Fatos do dono, já descriptografados. Registro ilegível (chave trocada, dado adulterado) é pulado e contado. */
export async function loadFacts(supabase: SupabaseClient, candidateId: string) {
  const { data } = await supabase.from("report_facts").select("id,data_enc,created_at").eq("candidate_id", candidateId);
  const facts: Fact[] = [];
  let unreadable = 0;
  for (const row of data ?? []) {
    try {
      facts.push({ id: row.id, created_at: row.created_at, ...openJson<FactData>(ctxFact(candidateId, row.id), row.data_enc) });
    } catch {
      unreadable++;
    }
  }
  return { facts, unreadable };
}

export async function loadNotes(supabase: SupabaseClient, candidateId: string) {
  const { data } = await supabase.from("confidential_reports").select("body").eq("candidate_id", candidateId).maybeSingle();
  if (!data) return "";
  try {
    return openText(ctxNotes(candidateId), data.body);
  } catch {
    return "";
  }
}
