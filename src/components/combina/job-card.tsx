import { MapPin } from "lucide-react";
import { PortraitCampo, PortraitComercio, PortraitEscritorio, PortraitIndustria, PortraitServicos } from "@/components/brand/portraits";
import { VerifiedBadge } from "@/components/employer/verified-badge";
import { CONTRACT_TYPES, MODALITIES } from "@/lib/constants";
import type { CombinaJob } from "@/lib/types";
import { formatBRL, timeAgo } from "@/lib/utils";

const ART: Record<string, { C: () => React.JSX.Element; bg: string }> = {
  "Campo e agro": { C: PortraitCampo, bg: "bg-rays-mustard" },
  Comércio: { C: PortraitComercio, bg: "bg-rays-red" },
  Alimentação: { C: PortraitComercio, bg: "bg-rays-mustard" },
  Beleza: { C: PortraitComercio, bg: "bg-rays-red" },
  Administrativo: { C: PortraitEscritorio, bg: "bg-rays-olive" },
  Tecnologia: { C: PortraitEscritorio, bg: "bg-rays-olive" },
  Educação: { C: PortraitEscritorio, bg: "bg-rays-mustard" },
  "Comunicação e cultura": { C: PortraitEscritorio, bg: "bg-rays-red" },
  Indústria: { C: PortraitIndustria, bg: "bg-rays-mustard" },
};
const FALLBACK = { C: PortraitServicos, bg: "bg-halftone" };

export function salaryLabel(j: Pick<CombinaJob, "salary_min" | "salary_max">) {
  if (j.salary_min && j.salary_max) return `${formatBRL(j.salary_min)} a ${formatBRL(j.salary_max)}`;
  if (j.salary_min) return `${formatBRL(j.salary_min)} / mês`;
  return "Salário a combinar";
}

export function CombinaJobCard({ job }: { job: CombinaJob }) {
  const { C, bg } = ART[job.area] ?? FALLBACK;
  return (
    <div className="flex h-full flex-col">
      <div className={`relative h-[200px] shrink-0 border-b-3 border-foreground sm:h-[220px] ${bg}`}>
        <C />
        <span className="absolute left-3 top-3">
          <VerifiedBadge />
        </span>
        <span className="absolute right-3 top-3 bg-[#141210] px-2 py-1 text-[11px] font-black uppercase text-[#F2E8D5]">
          {timeAgo(job.published_at)}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2.5 p-4 sm:p-5">
        <div>
          <h2 className="font-display text-3xl uppercase leading-none sm:text-[34px]">{job.title}</h2>
          <span className="mt-1 block text-[15px] font-extrabold">{job.employer_name}</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 inline-flex items-center gap-1 text-[13px] font-bold">
            <MapPin className="size-3.5 text-primary" strokeWidth={2.8} aria-hidden="true" />
            {job.city ? `${job.city}, ${job.state}` : "De casa"}
          </span>
          <span className="bg-secondary px-2 py-0.5 text-[11px] font-black uppercase text-secondary-foreground">{MODALITIES[job.modality]}</span>
          <span className="border-2 border-foreground px-2 text-[11px] font-black uppercase">{CONTRACT_TYPES[job.contract_type]}</span>
        </div>
        <strong className="text-xl font-black">{salaryLabel(job)}</strong>
        {job.reasons.length > 0 && (
          <div className="flex flex-col gap-1.5 border-2 border-dashed border-foreground p-2.5">
            <span className="text-[11px] font-black uppercase tracking-wider text-primary">Por que combina com você</span>
            <ul className="flex flex-wrap gap-1.5">
              {job.reasons.map((r) => (
                <li key={r} className="border-2 border-foreground bg-accent px-2 py-0.5 text-xs font-extrabold text-accent-foreground">
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export function CombinaJobDetails({ job }: { job: CombinaJob }) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="border-b-3 border-foreground pb-1 text-sm font-black uppercase">Sobre a vaga</h3>
      <p className="whitespace-pre-line text-[15px] leading-relaxed">{job.description}</p>
      <dl className="grid grid-cols-3 border-3 border-foreground bg-background">
        <div className="border-r-2 border-foreground p-2.5">
          <dt className="text-[11px] font-black uppercase">Salário</dt>
          <dd className="text-sm font-bold">{salaryLabel(job)}</dd>
        </div>
        <div className="border-r-2 border-foreground p-2.5">
          <dt className="text-[11px] font-black uppercase">Contrato</dt>
          <dd className="text-sm font-bold">{CONTRACT_TYPES[job.contract_type]}</dd>
        </div>
        <div className="p-2.5">
          <dt className="text-[11px] font-black uppercase">Modalidade</dt>
          <dd className="text-sm font-bold">{MODALITIES[job.modality]}</dd>
        </div>
      </dl>
      {job.benefits && (
        <div>
          <h4 className="text-sm font-black uppercase">Benefícios</h4>
          <p className="text-sm">{job.benefits}</p>
        </div>
      )}
      <div>
        <h4 className="text-sm font-black uppercase">A empresa</h4>
        <p className="text-sm leading-relaxed">
          {job.employer_name} · {job.employer_sector} · {job.employer_city}/{job.employer_state}. Verificada e signatária do Compromisso de
          Contratação Justa.
        </p>
      </div>
      <p className="bg-[#141210] p-3 text-[13px] leading-relaxed text-[#F2E8D5]">
        A empresa só vê seu nome e currículo <strong className="text-[#E8A317]">se der liga</strong>. Um “agora não” nunca é avisado.
      </p>
    </div>
  );
}
