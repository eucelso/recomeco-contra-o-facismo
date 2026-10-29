import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ChevronLeft, MapPin } from "lucide-react";
import { InitialsBox } from "@/components/brand/initials-box";
import { VerifiedBadge } from "@/components/employer/verified-badge";
import { ApplyButton } from "@/components/jobs/apply-button";
import { JobText, plainPreview } from "@/components/jobs/job-text";
import { JobCard } from "@/components/jobs/job-card";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth";
import { CONTRACT_TYPES, MODALITIES } from "@/lib/constants";
import type { JobListing } from "@/lib/types";
import { formatBRL, timeAgo } from "@/lib/utils";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const getJob = cache(async (id: string) => {
  if (!UUID.test(id)) return null;
  const { supabase } = await getSession();
  if (!supabase) return null;
  const { data } = await supabase.from("job_listings").select("*").eq("id", id).maybeSingle();
  return (data as JobListing | null) ?? null;
});

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const job = await getJob((await params).id);
  return job ? { title: `${job.title} · ${job.employer_name}`, description: plainPreview(job.description).slice(0, 150) } : { title: "Vaga" };
}

export default async function VagaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await getJob(id);
  if (!job) notFound();

  const { supabase, user, role } = await getSession();
  const [{ data: appliedRows }, { data: others }] = await Promise.all([
    user && role === "candidate" ? supabase.from("applications").select("job_id").eq("candidate_id", user.id).eq("job_id", job.id) : Promise.resolve({ data: [] }),
    supabase.from("job_listings").select("*").eq("employer_id", job.employer_id).neq("id", job.id).order("published_at", { ascending: false }).limit(3),
  ]);
  const applied = (appliedRows ?? []).length > 0;
  const canApply = !user || role === "candidate";
  const otherJobs = (others ?? []) as JobListing[];

  const salary =
    job.salary_min && job.salary_max
      ? `${formatBRL(job.salary_min)} a ${formatBRL(job.salary_max)}`
      : job.salary_min
        ? `${formatBRL(job.salary_min)} / mês`
        : "Salário a combinar";

  return (
    <article className="flex flex-col gap-6">
      <Link href="/vagas" className="inline-flex items-center gap-1 self-start text-sm font-bold underline-offset-2 hover:underline">
        <ChevronLeft className="size-4" strokeWidth={3} aria-hidden="true" /> Todas as vagas
      </Link>

      <header className="flex items-start gap-3.5">
        <InitialsBox name={job.employer_name} className="size-14" />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <h1 className="font-display text-[34px] uppercase leading-[0.98] sm:text-5xl">{job.title}</h1>
          <Link href={`/empresas/${job.employer_id}`} className="self-start text-base font-bold underline underline-offset-2">
            {job.employer_name}
          </Link>
          <span className="self-start">
            <VerifiedBadge />
          </span>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 text-sm font-bold">
          <MapPin className="size-4 text-primary" strokeWidth={2.8} aria-hidden="true" />
          {job.city ? `${job.city}, ${job.state}` : "Qualquer lugar"}
        </span>
        <span className="bg-secondary px-2 py-0.5 text-xs font-black uppercase text-secondary-foreground">{MODALITIES[job.modality]}</span>
        <span className="border-2 border-foreground px-2 text-xs font-black uppercase">{CONTRACT_TYPES[job.contract_type]}</span>
        <span className="border-2 border-dashed border-foreground px-2 text-xs font-black uppercase">{job.area}</span>
      </div>

      <div className="mr-1.5 flex flex-wrap items-center justify-between gap-4 border-3 border-foreground bg-card p-4 shadow-hard">
        <div className="flex flex-col">
          <strong className="text-xl font-black">{salary}</strong>
          <span className="text-xs font-semibold">Publicada {timeAgo(job.published_at)}</span>
        </div>
        {canApply ? <ApplyButton jobId={job.id} applied={applied} /> : <span className="text-sm font-bold">Só candidatos podem demonstrar interesse.</span>}
      </div>

      <section aria-labelledby="desc" className="flex flex-col gap-2">
        <h2 id="desc" className="border-b-3 border-foreground pb-1.5 text-[15px] font-black uppercase">
          Sobre a vaga
        </h2>
        <JobText text={job.description} />
      </section>

      {job.benefits && (
        <section aria-labelledby="ben" className="flex flex-col gap-2">
          <h2 id="ben" className="border-b-3 border-foreground pb-1.5 text-[15px] font-black uppercase">
            Benefícios
          </h2>
          <JobText text={job.benefits} />
        </section>
      )}

      <section aria-labelledby="emp" className="mr-1.5 flex flex-col gap-3 border-3 border-foreground bg-accent/20 p-4">
        <h2 id="emp" className="text-[15px] font-black uppercase">
          Sobre a empresa
        </h2>
        <p className="text-sm font-semibold">
          {job.employer_name} · {job.employer_sector}. Empresa que assinou o Compromisso de Contratação Justa e foi verificada pela nossa equipe.
        </p>
        <Button asChild variant="outline" className="self-start">
          <Link href={`/empresas/${job.employer_id}`}>Ver todas as vagas da empresa</Link>
        </Button>
      </section>

      {otherJobs.length > 0 && (
        <section aria-labelledby="mais" className="flex flex-col gap-4">
          <h2 id="mais" className="border-b-3 border-foreground pb-1.5 text-[15px] font-black uppercase">
            Outras vagas de {job.employer_name}
          </h2>
          {otherJobs.map((j) => (
            <JobCard key={j.id} job={j} applied={false} canApply={false} />
          ))}
        </section>
      )}
    </article>
  );
}
