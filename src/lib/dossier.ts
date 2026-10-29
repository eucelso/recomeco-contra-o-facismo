import { z } from "zod";

const opt = (max: number) => z.string().trim().max(max, `Passou de ${max} caracteres.`).optional();

export const factSchema = z.object({
  happened_on: z
    .string()
    .trim()
    .regex(/^$|^\d{4}-\d{2}-\d{2}$/, "Data inválida.")
    .refine((v) => !v || v <= new Date().toISOString().slice(0, 10), "A data não pode ser no futuro.")
    .optional(),
  place: opt(160),
  who: opt(160),
  what: z.string({ error: "Conte o que aconteceu." }).trim().min(1, "Conte o que aconteceu.").max(1000, "Passou de 1000 caracteres."),
  evidence: opt(500),
  witnesses: opt(300),
});
export type FactInput = z.input<typeof factSchema>;

export type Fact = {
  id: string;
  happened_on: string | null;
  place: string | null;
  who: string | null;
  what: string;
  evidence: string | null;
  witnesses: string | null;
  created_at: string;
};

export const MAX_FACTS = 50;

/** Linha do tempo: por data (sem data vai para o fim), depois por ordem de criação. */
export function sortFacts<T extends Pick<Fact, "happened_on" | "created_at">>(facts: T[]): T[] {
  return [...facts].sort((a, b) => {
    if (a.happened_on && b.happened_on && a.happened_on !== b.happened_on) return a.happened_on < b.happened_on ? -1 : 1;
    if (a.happened_on && !b.happened_on) return -1;
    if (!a.happened_on && b.happened_on) return 1;
    return a.created_at < b.created_at ? -1 : 1;
  });
}

/** O que costuma faltar para um advogado ou o MPT conseguirem usar o relato. */
export function dossierGaps(facts: Fact[]): { fact: string[]; overall: string[] } {
  const overall: string[] = [];
  if (facts.length > 0) {
    if (!facts.some((f) => f.evidence)) overall.push("Nenhuma prova registrada ainda (prints, áudios, documentos).");
    if (!facts.some((f) => f.witnesses)) overall.push("Nenhuma testemunha anotada.");
  }
  const undated = facts.filter((f) => !f.happened_on).length;
  return {
    fact: undated ? [`${undated} ${undated > 1 ? "fatos estão" : "fato está"} sem data.`] : [],
    overall,
  };
}
