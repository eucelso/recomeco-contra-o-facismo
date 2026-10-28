import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Search } from "lucide-react";
import { AnonBox, InitialsBox } from "@/components/brand/initials-box";
import { PageTitle } from "@/components/layout/app-shell";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AREAS, STATES } from "@/lib/constants";
import { requireEmployer } from "@/lib/employer";
import type { CandidateSearchRow } from "@/lib/types";

export const metadata: Metadata = { title: "Buscar candidatos" };

export default async function CandidatosPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { supabase, employer } = await requireEmployer();
  if (employer.verification_status !== "verified") redirect("/contratante/verificacao");
  const sp = await searchParams;
  const area = AREAS.includes(sp.area as (typeof AREAS)[number]) ? sp.area : undefined;
  const uf = STATES.includes(sp.uf as (typeof STATES)[number]) ? sp.uf : undefined;
  const q = sp.q?.trim().slice(0, 60) || undefined;

  const { data, error } = await supabase.rpc("search_candidates", { p_area: area ?? null, p_state: uf ?? null, p_query: q ?? null, p_limit: 40 });
  const rows = (data ?? []) as CandidateSearchRow[];

  return (
    <div className="flex flex-col gap-6">
      <PageTitle kicker="Perfis anônimos">Buscar candidatos</PageTitle>
      <form className="flex flex-col gap-3" role="search">
        <label htmlFor="q" className="sr-only">
          Profissão ou habilidade
        </label>
        <div className="flex h-[54px] items-center gap-2.5 border-3 border-foreground bg-white px-3 text-[#141210]">
          <Search className="size-5" strokeWidth={2.8} aria-hidden="true" />
          <input id="q" name="q" defaultValue={q} placeholder="Profissão ou habilidade" className="min-w-0 flex-1 bg-transparent text-base outline-none" />
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_110px] gap-3">
          <select name="area" defaultValue={area ?? ""} aria-label="Área" className="h-[54px] border-3 border-foreground bg-white px-3 text-base text-[#141210]">
            <option value="">Todas as áreas</option>
            {AREAS.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
          <select name="uf" defaultValue={uf ?? ""} aria-label="Estado" className="h-[54px] border-3 border-foreground bg-white px-3 text-base text-[#141210]">
            <option value="">UF</option>
            {STATES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <Button type="submit" variant="secondary" className="shadow-none">
          Buscar
        </Button>
      </form>

      <Alert variant="accent">
        <p>Pelo Compromisso, é proibido perguntar sobre voto ou posição política em qualquer etapa.</p>
      </Alert>

      {error && <Alert variant="destructive">Não conseguimos buscar agora. Tente de novo.</Alert>}
      <p className="text-sm font-extrabold" role="status">
        {rows.length} {rows.length === 1 ? "perfil encontrado" : "perfis encontrados"}
      </p>
      <ul className="flex flex-col gap-3 pr-1.5">
        {rows.map((c) => (
          <li key={c.id}>
            <Link href={`/contratante/candidatos/${c.public_code}`} className="flex items-center gap-3 border-3 border-foreground bg-card p-3.5 shadow-hard-sm">
              {c.display_name ? <InitialsBox name={c.display_name} className="size-11" /> : <AnonBox className="size-11" />}
              <span className="min-w-0 flex-1">
                <strong className="block text-[15px] font-black">
                  {c.display_name ?? `#${c.public_code}`} · {c.headline}
                </strong>
                <span className="text-[13px] font-semibold">
                  {c.years_experience ?? 0} anos · {c.region}
                  {c.skills.length ? ` · ${c.skills.slice(0, 3).join(", ")}` : ""}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {rows.length === 0 && !error && (
        <p className="border-3 border-dashed border-foreground p-6 text-center font-semibold">Nenhum perfil com esses filtros. Tente ampliar a busca.</p>
      )}
    </div>
  );
}
