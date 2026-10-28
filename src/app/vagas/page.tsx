import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Bell, Scale, Search, X } from "lucide-react";
import { Fist } from "@/components/brand/fist";
import { filterHref, type JobFilters } from "@/components/jobs/filters";
import { FiltersSheet } from "@/components/jobs/filters-sheet";
import { JobCard } from "@/components/jobs/job-card";
import { JobSkeleton } from "@/components/jobs/job-skeleton";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth";
import { AREAS, CONTRACT_TYPES, MODALITIES, STATES, type ContractType, type Modality } from "@/lib/constants";
import type { JobListing } from "@/lib/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Vagas", description: "Vagas de empresas que assinaram o Compromisso de Contratação Justa." };

function parse(sp: Record<string, string | undefined>): JobFilters {
  return {
    q: sp.q?.trim().slice(0, 60) || undefined,
    uf: STATES.includes(sp.uf as (typeof STATES)[number]) ? sp.uf : undefined,
    cidade: sp.cidade?.trim().slice(0, 80) || undefined,
    area: AREAS.includes(sp.area as (typeof AREAS)[number]) ? sp.area : undefined,
    modalidade: sp.modalidade && sp.modalidade in MODALITIES ? sp.modalidade : undefined,
    contrato: sp.contrato && sp.contrato in CONTRACT_TYPES ? sp.contrato : undefined,
  };
}

export default async function VagasPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const f = parse(await searchParams);
  const chips: { label: string; clear: Partial<JobFilters> }[] = [
    f.cidade || f.uf ? { label: [f.cidade, f.uf].filter(Boolean).join(", "), clear: { cidade: undefined, uf: undefined } } : null,
    f.area ? { label: f.area, clear: { area: undefined } } : null,
    f.contrato ? { label: CONTRACT_TYPES[f.contrato as ContractType], clear: { contrato: undefined } } : null,
  ].filter(Boolean) as { label: string; clear: Partial<JobFilters> }[];

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-display text-[44px] uppercase leading-none">Vagas</h1>
      <div className="flex gap-2.5">
        <form className="flex h-[54px] flex-1 items-center gap-2.5 border-3 border-foreground bg-white px-3 text-[#141210]" role="search">
          {Object.entries(f).map(([k, v]) => (k !== "q" && v ? <input key={k} type="hidden" name={k} value={v} /> : null))}
          <Search className="size-5 shrink-0" strokeWidth={2.8} aria-hidden="true" />
          <label htmlFor="busca" className="sr-only">
            Buscar vagas
          </label>
          <input id="busca" name="q" defaultValue={f.q} placeholder="Cargo ou palavra-chave" className="min-w-0 flex-1 bg-transparent text-base outline-none" />
        </form>
        <FiltersSheet current={f} />
      </div>
      {chips.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Filtros ativos">
          {chips.map((c) => (
            <li key={c.label}>
              <Link href={filterHref(f, c.clear)} className="inline-flex h-9 items-center gap-1.5 border-2 border-foreground bg-accent px-2.5 text-[13px] font-extrabold text-accent-foreground">
                {c.label}
                <X className="size-3.5" strokeWidth={3} aria-label="Remover filtro" />
              </Link>
            </li>
          ))}
        </ul>
      )}
      <nav aria-label="Modalidade" className="grid grid-cols-4 border-3 border-foreground">
        {[undefined, ...(Object.keys(MODALITIES) as Modality[])].map((m) => {
          const on = f.modalidade === m;
          return (
            <Link
              key={m ?? "todas"}
              href={filterHref(f, { modalidade: m })}
              aria-current={on ? "true" : undefined}
              className={cn("flex h-11 items-center justify-center text-[11px] font-black uppercase sm:text-[13px]", on ? "bg-primary text-primary-foreground" : "bg-background")}
            >
              {m ? MODALITIES[m] : "Todas"}
            </Link>
          );
        })}
      </nav>
      <Suspense key={JSON.stringify(f)} fallback={<JobSkeleton />}>
        <Results f={f} />
      </Suspense>
    </div>
  );
}

async function Results({ f }: { f: JobFilters }) {
  const { supabase, user, role } = await getSession();
  if (!supabase) return <Alert variant="destructive">Configure o Supabase no arquivo .env.local para ver as vagas.</Alert>;

  let query = supabase.from("job_listings").select("*").order("published_at", { ascending: false }).limit(50);
  if (f.modalidade) query = query.eq("modality", f.modalidade);
  if (f.contrato) query = query.eq("contract_type", f.contrato);
  if (f.area) query = query.eq("area", f.area);
  if (f.uf) query = query.or(`state.eq.${f.uf},modality.eq.remoto`);
  if (f.cidade) query = query.ilike("city", `%${f.cidade.replace(/[%_,()]/g, "")}%`);
  if (f.q) {
    const q = f.q.replace(/[%_,()]/g, "");
    query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
  }

  const [{ data, error }, appliedRes] = await Promise.all([
    query,
    user && role === "candidate" ? supabase.from("applications").select("job_id").eq("candidate_id", user.id) : Promise.resolve({ data: [] as { job_id: string }[] }),
  ]);
  if (error) return <Alert variant="destructive">Não conseguimos carregar as vagas. Tente de novo em instantes.</Alert>;
  const jobs = (data ?? []) as JobListing[];
  const applied = new Set((appliedRes.data ?? []).map((a) => a.job_id));
  const canApply = !user || role === "candidate";

  if (jobs.length === 0) return <EmptyState hasFilters={Object.values(f).some(Boolean)} />;

  return (
    <div className="flex flex-col gap-4">
      <p role="status" className="text-sm font-extrabold">
        {jobs.length} {jobs.length === 1 ? "vaga encontrada" : "vagas encontradas"}
      </p>
      {jobs.map((j) => (
        <JobCard key={j.id} job={j} applied={applied.has(j.id)} canApply={canApply} />
      ))}
    </div>
  );
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center gap-4 py-6 text-center">
      <div aria-hidden="true" className="flex size-44 items-center justify-center rounded-full border-[4px] border-foreground bg-rays-mustard shadow-hard">
        <Fist className="h-[106px] w-20" strokeWidth={6} />
      </div>
      <h2 className="font-display text-4xl uppercase leading-none">{hasFilters ? "Ainda não tem vaga com esses filtros" : "Ainda não há vagas publicadas"}</h2>
      <p className="max-w-xs text-base font-medium leading-relaxed">Não desanima: vaga nova chega todo dia. Tente ampliar a busca ou volte mais tarde.</p>
      <div className="flex w-full flex-col gap-3 pr-1.5">
        {hasFilters && (
          <Button asChild variant="outline">
            <Link href="/vagas">Limpar filtros</Link>
          </Button>
        )}
        <Button asChild>
          <Link href="/painel">
            <Bell strokeWidth={2.6} aria-hidden="true" /> Ir para meu painel
          </Link>
        </Button>
      </div>
      <Alert variant="ink" className="text-left">
        <Scale aria-hidden="true" />
        <p>
          Enquanto procura: foi demitido(a) por causa do voto?{" "}
          <Link href="/direitos" className="font-extrabold text-accent underline">
            Veja seus direitos
          </Link>
          .
        </p>
      </Alert>
    </div>
  );
}
