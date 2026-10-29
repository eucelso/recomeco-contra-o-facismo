import Link from "next/link";
import { MapPin } from "lucide-react";
import { InitialsBox } from "@/components/brand/initials-box";
import { VerifiedBadge } from "@/components/employer/verified-badge";
import { ApplyButton } from "@/components/jobs/apply-button";
import { plainPreview } from "@/components/jobs/job-text";
import { CONTRACT_TYPES, MODALITIES } from "@/lib/constants";
import type { JobListing } from "@/lib/types";
import { formatBRL, timeAgo } from "@/lib/utils";

export function JobCard({ job, applied, canApply }: { job: JobListing; applied: boolean; canApply: boolean }) {
  const salary =
    job.salary_min && job.salary_max
      ? `${formatBRL(job.salary_min)} a ${formatBRL(job.salary_max)}`
      : job.salary_min
        ? `${formatBRL(job.salary_min)} / mês`
        : "Salário a combinar";
  return (
    <article className="group relative mr-1.5 flex flex-col gap-3 border-3 border-foreground bg-card p-4 shadow-hard focus-within:ring-4 focus-within:ring-accent hover:bg-accent/10">
      <div className="flex items-start gap-3">
        <InitialsBox name={job.employer_name} className="size-[52px]" />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h2 className="text-lg font-black leading-tight">
            {/* Link esticado: o card inteiro abre a vaga, e os botões abaixo ficam por cima */}
            <Link href={`/vagas/${job.id}`} className="outline-none after:absolute after:inset-0 group-hover:underline">
              {job.title}
            </Link>
          </h2>
          <Link href={`/empresas/${job.employer_id}`} className="relative z-10 self-start text-sm font-semibold underline-offset-2 hover:underline">
            {job.employer_name}
          </Link>
          <span className="self-start">
            <VerifiedBadge />
          </span>
        </div>
      </div>
      <p className="line-clamp-3 text-sm leading-relaxed">{plainPreview(job.description)}</p>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 inline-flex items-center gap-1 text-[13px] font-bold">
          <MapPin className="size-3.5 text-primary" strokeWidth={2.8} aria-hidden="true" />
          {job.city ? `${job.city}, ${job.state}` : "Qualquer lugar"}
        </span>
        <span className="bg-secondary px-2 py-0.5 text-xs font-black uppercase text-secondary-foreground">{MODALITIES[job.modality]}</span>
        <span className="border-2 border-foreground px-2 text-xs font-black uppercase">{CONTRACT_TYPES[job.contract_type]}</span>
      </div>
      <div className="flex items-center justify-between gap-3 border-t-2 border-foreground pt-3">
        <div className="flex flex-col">
          <strong className="text-[17px] font-black">{salary}</strong>
          <span className="text-xs font-semibold">Publicada {timeAgo(job.published_at)}</span>
        </div>
        {canApply && (
          <span className="relative z-10">
            <ApplyButton jobId={job.id} applied={applied} />
          </span>
        )}
      </div>
    </article>
  );
}
