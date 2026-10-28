import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft, EyeOff, FileText, Lock, MapPin } from "lucide-react";
import { AnonBox, InitialsBox } from "@/components/brand/initials-box";
import { InviteDialog } from "@/components/employer/invite-dialog";
import { SectionTitle } from "@/components/layout/app-shell";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CONTRACT_TYPES, MODALITIES } from "@/lib/constants";
import { requireEmployer } from "@/lib/employer";
import type { CandidateCard } from "@/lib/types";

export const metadata: Metadata = { title: "Perfil de candidato", robots: { index: false } };

export default async function CandidatoPerfilPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { supabase, employer, user } = await requireEmployer();
  if (employer.verification_status !== "verified") redirect("/contratante/verificacao");
  if (!/^[A-Z0-9]{4,8}$/i.test(code)) notFound();

  const { data } = await supabase.rpc("candidate_card", { p_code: code });
  const c = data as CandidateCard | null;
  if (!c) notFound();

  const { data: jobs } = await supabase.from("jobs").select("id,title").eq("employer_id", user.id).eq("status", "active");
  let resumeUrl: string | null = null;
  if (c.revealed && c.resume_path) {
    const { data: signed } = await supabase.storage.from("resumes").createSignedUrl(c.resume_path, 300);
    resumeUrl = signed?.signedUrl ?? null;
  }

  return (
    <div className="flex flex-col gap-6">
      <Link href="/contratante/candidatos" className="-ml-2 flex h-11 items-center gap-1 self-start text-sm font-extrabold uppercase">
        <ChevronLeft className="size-5" strokeWidth={3} /> Voltar
      </Link>

      <section className="mr-1.5 flex flex-col gap-3.5 border-3 border-foreground bg-card p-4 shadow-hard">
        <div className="flex items-center gap-3.5">
          {c.display_name ? (
            <InitialsBox name={c.display_name} className="size-[72px] text-3xl" />
          ) : (
            <span role="img" aria-label="Foto oculta" className="relative">
              <AnonBox className="size-[72px]" />
              <Lock className="absolute inset-0 m-auto size-7 rounded-sm bg-muted p-1" strokeWidth={2.6} aria-hidden="true" />
            </span>
          )}
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-3xl uppercase leading-none">{c.display_name ?? `Candidato(a) #${c.public_code}`}</h1>
            <span className="text-[15px] font-bold">
              {c.headline} · {c.years_experience ?? 0} anos de experiência
            </span>
            <span className="flex items-center gap-1 text-[13px] font-semibold">
              <MapPin className="size-3.5 text-primary" strokeWidth={2.8} aria-hidden="true" /> {c.region}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {c.available_from && <Badge variant="secondary">{c.available_from}</Badge>}
          {c.modalities.map((m) => (
            <Badge key={m} variant="outline">
              {MODALITIES[m]}
            </Badge>
          ))}
          {c.contract_types.map((t) => (
            <Badge key={t} variant="outline">
              {CONTRACT_TYPES[t]}
            </Badge>
          ))}
        </div>
      </section>

      {!c.revealed && (
        <Alert variant="ink">
          <EyeOff aria-hidden="true" />
          <p>
            <strong className="text-accent">Perfil anônimo.</strong> Nome, contato e currículo aparecem só se a pessoa aceitar seu convite.
          </p>
        </Alert>
      )}

      {c.skills.length > 0 && (
        <section className="flex flex-col gap-2.5">
          <SectionTitle>Habilidades</SectionTitle>
          <ul className="flex flex-wrap gap-2">
            {c.skills.map((s) => (
              <li key={s} className="border-2 border-foreground bg-accent px-2.5 py-1.5 text-sm font-bold text-accent-foreground">
                {s}
              </li>
            ))}
          </ul>
        </section>
      )}

      {c.experiences.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionTitle>Experiência</SectionTitle>
          <ol>
            {c.experiences.map((x, i) => (
              <li key={i} className="flex gap-3.5">
                <span className="flex flex-col items-center">
                  <span className={`size-4 border-3 border-foreground ${i === 0 ? "bg-primary" : "bg-background"}`} />
                  {i < c.experiences.length - 1 && <span className="w-[3px] flex-1 bg-foreground" />}
                </span>
                <div className="pb-4">
                  <strong className="block text-base font-black">{x.role_title}</strong>
                  <span className="block text-sm font-semibold">
                    {[x.employer, x.start_year && `${x.start_year}–${x.end_year ?? "atual"}`].filter(Boolean).join(" · ")}
                  </span>
                  {x.description && <p className="mt-1.5 text-sm leading-relaxed">{x.description}</p>}
                </div>
              </li>
            ))}
          </ol>
          {!c.revealed && <p className="text-[13px] font-semibold">Nomes de empregadores ficam ocultos até o aceite.</p>}
        </section>
      )}

      <section className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <SectionTitle>Disponibilidade e formação</SectionTitle>
        </div>
        {[
          ["Turnos", c.shifts.join(", ") || "—"],
          ["Escolaridade", c.education ?? "—"],
          ["Cursos", c.courses ?? "—"],
        ].map(([k, v]) => (
          <div key={k} className="border-3 border-foreground bg-card p-3">
            <span className="block text-xs font-black uppercase">{k}</span>
            <strong className="text-[15px]">{v}</strong>
          </div>
        ))}
        <div className="border-3 border-foreground bg-card p-3">
          <span className="block text-xs font-black uppercase">Currículo</span>
          {resumeUrl ? (
            <a href={resumeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[15px] font-bold underline">
              <FileText className="size-4" strokeWidth={2.6} aria-hidden="true" /> Abrir PDF
            </a>
          ) : (
            <strong className="inline-flex items-center gap-1 text-[15px]">
              {c.has_resume ? (
                <>
                  <Lock className="size-3.5" strokeWidth={2.8} aria-hidden="true" /> Após aceite
                </>
              ) : (
                "Não enviado"
              )}
            </strong>
          )}
        </div>
      </section>

      <div className="flex flex-col gap-2.5 pr-1.5">
        {c.contact_status === "accepted" && c.contact_id ? (
          <Button asChild size="lg">
            <Link href={`/mensagens/${c.contact_id}`}>Abrir conversa</Link>
          </Button>
        ) : c.contact_status === "pending" ? (
          <p className="border-3 border-foreground bg-accent p-3 text-center font-extrabold text-accent-foreground">Convite enviado · aguardando resposta</p>
        ) : c.invites_paused ? (
          <p className="border-3 border-dashed border-foreground p-3 text-center font-semibold">Esta pessoa pausou os convites por enquanto.</p>
        ) : (
          <>
            <InviteDialog candidateId={c.id} code={c.public_code} jobs={jobs ?? []} />
            <span className="text-center text-[13px] font-semibold">A pessoa recebe o convite e decide se quer conversar.</span>
          </>
        )}
      </div>
    </div>
  );
}
