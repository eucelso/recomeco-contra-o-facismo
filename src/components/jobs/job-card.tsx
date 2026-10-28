import { MapPin } from "lucide-react";
import { InitialsBox } from "@/components/brand/initials-box";
import { VerifiedBadge } from "@/components/employer/verified-badge";
import { ApplyButton } from "@/components/jobs/apply-button";
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
    <article className="mr-1.5 flex flex-col gap-3 border-3 border-foreground bg-card p-4 shadow-hard">
      <div className="flex items-start gap-3">
        <InitialsBox name={job.employer_name} className="size-[52px]" />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h2 className="text-lg font-black leading-tight">{job.title}</h2>
          <span className="text-sm font-semibold">{job.employer_name}</span>
          <span className="self-start">
            <VerifiedBadge />
          </span>
        </div>
      </div>
      <p className="line-clamp-3 text-sm leading-relaxed">{job.description}</p>
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
        {canApply && <ApplyButton jobId={job.id} applied={applied} />}
      </div>
    </article>
  );
}
