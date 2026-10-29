import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ChevronLeft, MapPin } from "lucide-react";
import { InitialsBox } from "@/components/brand/initials-box";
import { VerifiedBadge } from "@/components/employer/verified-badge";
import { JobCard } from "@/components/jobs/job-card";
import { Button } from "@/components/ui/button";
import { hasSupabaseEnv } from "@/lib/auth";
import { createPublicClient } from "@/lib/supabase/public";
import type { EmployerPublic, JobListing } from "@/lib/types";

// Estática por empresa: gerada no primeiro acesso e refeita a cada 5 minutos.
export const revalidate = 300;
export function generateStaticParams() {
  return [];
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const getEmployer = cache(async (id: string) => {
  if (!UUID.test(id) || !hasSupabaseEnv()) return null;
  const supabase = createPublicClient();
  const [{ data: emp }, { data: jobs }] = await Promise.all([
    supabase.from("employer_public").select("id,display_name,sector,city,state").eq("id", id).maybeSingle(),
    supabase.from("job_listings").select("*").eq("employer_id", id).order("published_at", { ascending: false }).limit(100),
  ]);
  if (!emp) return null;
  return { employer: emp as EmployerPublic, jobs: (jobs ?? []) as JobListing[] };
});

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const data = await getEmployer((await params).id);
  return data ? { title: data.employer.display_name, description: `Vagas de ${data.employer.display_name} (${data.employer.sector}) no Recomeço.` } : { title: "Empresa" };
}

export default async function EmpresaPage({ params }: { params: Promise<{ id: string }> }) {
  const data = await getEmployer((await params).id);
  if (!data) notFound();
  const { employer, jobs } = data;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10 sm:py-14">
      <Link href="/empresas" className="inline-flex items-center gap-1 self-start text-sm font-bold underline-offset-2 hover:underline">
        <ChevronLeft className="size-4" strokeWidth={3} aria-hidden="true" /> Todas as empresas
      </Link>

      <header className="flex items-start gap-4">
        <InitialsBox name={employer.display_name} className="size-16 text-2xl" />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <h1 className="font-display text-[36px] uppercase leading-[0.98] sm:text-5xl">{employer.display_name}</h1>
          <p className="text-base font-semibold">{employer.sector}</p>
          <span className="inline-flex items-center gap-1 text-sm font-bold">
            <MapPin className="size-4 text-primary" strokeWidth={2.8} aria-hidden="true" />
            {employer.city}, {employer.state}
          </span>
          <span className="self-start">
            <VerifiedBadge />
          </span>
        </div>
      </header>

      <section aria-labelledby="vagas" className="flex flex-col gap-4">
        <h2 id="vagas" className="border-b-3 border-foreground pb-1.5 text-[15px] font-black uppercase">
          {jobs.length === 0 ? "Vagas abertas" : `${jobs.length} ${jobs.length === 1 ? "vaga aberta" : "vagas abertas"}`}
        </h2>
        {jobs.length === 0 ? (
          <div className="flex flex-col gap-3 border-3 border-dashed border-foreground p-6 text-center">
            <p className="font-semibold">Esta empresa não tem vagas abertas agora.</p>
            <Button asChild variant="outline" className="self-center">
              <Link href="/vagas">Ver todas as vagas</Link>
            </Button>
          </div>
        ) : (
          jobs.map((j) => <JobCard key={j.id} job={j} applied={false} canApply={false} />)
        )}
      </section>
    </div>
  );
}
