export type JobFilters = { q?: string; uf?: string; cidade?: string; area?: string; modalidade?: string; contrato?: string };

export function filterHref(current: JobFilters, patch: Partial<JobFilters>) {
  const next = { ...current, ...patch };
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(next)) if (v) sp.set(k, v);
  const s = sp.toString();
  return s ? `/vagas?${s}` : "/vagas";
}
