import type { Metadata } from "next";
import Link from "next/link";
import { Bell, Plus } from "lucide-react";
import { AnonBox, InitialsBox } from "@/components/brand/initials-box";
import { ApplicantActions } from "@/components/employer/applicant-actions";
import { JobStatusMenu } from "@/components/employer/job-status-menu";
import { VerifiedBadge } from "@/components/employer/verified-badge";
import { SectionTitle } from "@/components/layout/app-shell";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { APPLICATION_STATUS, MODALITIES } from "@/lib/constants";
import { requireEmployer } from "@/lib/employer";

export const metadata: Metadata = { title: "Painel do contratante" };

type Applicant = {
  application_id: string;
  job_id: string;
  job_title: string;
  status: keyof typeof APPLICATION_STATUS;
  candidate_id: string;
  public_code: string;
  display_name: string | null;
  headline: string | null;
  years_experience: number | null;
  region: string;
  skills: string[];
  contact_status: "pending" | "accepted" | "declined" | "revoked" | null;
  contact_id: string | null;
};

export default async function ContratantePage() {
  const { supabase, employer, user } = await requireEmployer();
  const verified = employer.verification_status === "verified";

  const [{ data: jobs }, applicantsRes, { data: contacts }] = await Promise.all([
    supabase.from("jobs").select("id,title,city,modality,status,updated_at").eq("employer_id", user.id).order("updated_at", { ascending: false }),
    verified ? supabase.rpc("employer_applicants", { p_limit: 20 }) : Promise.resolve({ data: [] as Applicant[] }),
    supabase.from("contact_requests").select("id,status").eq("employer_id", user.id),
  ]);
  const applicants = (applicantsRes.data ?? []) as Applicant[];
  const activeJobs = (jobs ?? []).filter((j) => j.status === "active").length;
  const conversations = (contacts ?? []).filter((c) => c.status === "accepted").length;

  return (
    <div className="flex flex-col gap-7">
      <section className="-mx-4 -mt-5 flex flex-col gap-4 border-b-3 border-foreground bg-[#141210] px-4 pb-5 pt-4 text-[#F2E8D5] md:mx-0 md:mt-0 md:border-3">
        <div className="flex items-center gap-3">
          <InitialsBox name={employer.display_name} className="border-[#F2E8D5]" />
          <div className="min-w-0 flex-1">
            <strong className="block truncate text-base font-black">{employer.display_name}</strong>
            <VerifiedBadge status={employer.verification_status} />
          </div>
          <Link href="/mensagens" aria-label="Mensagens" className="flex size-11 items-center justify-center border-3 border-[#F2E8D5]">
            <Bell className="size-5" strokeWidth={2.6} />
          </Link>
        </div>
        <h1 className="font-display text-[40px] uppercase leading-none">Seu painel</h1>
        <dl className="grid grid-cols-3 gap-2">
          {[
            { v: activeJobs, l: "Vagas ativas" },
            { v: applicants.length, l: "Interessados" },
            { v: conversations, l: "Conversas" },
          ].map((s) => (
            <div key={s.l} className="flex flex-col-reverse border-3 border-[#F2E8D5] p-2.5">
              <dt className="text-xs font-extrabold uppercase">{s.l}</dt>
              <dd className="font-display text-[32px] leading-none text-[#E8A317]">{s.v}</dd>
            </div>
          ))}
        </dl>
      </section>

      {!verified && (
        <Alert variant="accent">
          <p>
            Seu cadastro está {employer.verification_status === "rejected" ? "com pendências" : "em verificação"}. Você pode rascunhar
            vagas, mas só publica e vê candidatos depois da aprovação.{" "}
            <Link href="/contratante/verificacao" className="underline">
              Ver status
            </Link>
          </p>
        </Alert>
      )}

      <div className="pr-1.5">
        <Button asChild size="lg" className="w-full">
          <Link href="/contratante/vagas/nova">
            <Plus strokeWidth={3} aria-hidden="true" /> Publicar nova vaga
          </Link>
        </Button>
      </div>

      <section aria-label="Vagas publicadas" className="flex flex-col gap-3">
        <SectionTitle>Suas vagas</SectionTitle>
        {jobs && jobs.length > 0 ? (
          <ul className="border-3 border-foreground bg-card">
            {jobs.map((j, i) => (
              <li key={j.id} className={`flex items-center gap-3 px-3.5 py-3 ${i < jobs.length - 1 ? "border-b-2 border-foreground" : ""}`}>
                <div className="min-w-0 flex-1">
                  <strong className="block truncate text-[15px] font-black">{j.title}</strong>
                  <span className="text-[13px] font-semibold">
                    {j.city ?? "Qualquer lugar"} · {MODALITIES[j.modality as keyof typeof MODALITIES]}
                  </span>
                </div>
                <JobStatusMenu id={j.id} status={j.status} canPublish={verified} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="border-3 border-dashed border-foreground p-5 text-center font-semibold">Nenhuma vaga ainda. Que tal publicar a primeira?</p>
        )}
      </section>

      {verified && (
        <section aria-label="Candidatos interessados" className="flex flex-col gap-3">
          <SectionTitle
            action={
              <Link href="/contratante/candidatos" className="text-[13px] font-extrabold underline">
                Buscar perfis
              </Link>
            }
          >
            Candidatos interessados
          </SectionTitle>
          <p className="text-[13px] font-semibold">Perfis anônimos: você vê habilidades e experiência, não nomes.</p>
          {applicants.length === 0 && <p className="border-3 border-dashed border-foreground p-5 text-center font-semibold">Ainda ninguém se candidatou.</p>}
          <ul className="flex flex-col gap-3 pr-1.5">
            {applicants.map((a) => (
              <li key={a.application_id} className="flex flex-col gap-3 border-3 border-foreground bg-card p-3.5 shadow-hard-sm">
                <div className="flex items-center gap-3">
                  {a.display_name ? <InitialsBox name={a.display_name} className="size-11" /> : <AnonBox className="size-11" />}
                  <div className="min-w-0 flex-1">
                    <strong className="block text-[15px] font-black">
                      {a.display_name ?? `#${a.public_code}`} · {a.headline}
                    </strong>
                    <span className="text-[13px] font-semibold">
                      {a.years_experience ?? 0} anos · {a.region}
                      {a.skills.length ? ` · ${a.skills.slice(0, 2).join(", ")}` : ""}
                    </span>
                  </div>
                  <Badge variant={APPLICATION_STATUS[a.status].variant}>{APPLICATION_STATUS[a.status].label}</Badge>
                </div>
                <span className="text-xs font-bold uppercase">Vaga: {a.job_title}</span>
                <ApplicantActions applicant={a} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
