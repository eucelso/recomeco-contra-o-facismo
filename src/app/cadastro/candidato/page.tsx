import type { Metadata } from "next";
import { CandidateWizard, type CandidateDraft } from "@/components/onboarding/candidate-wizard";
import { requireRole } from "@/lib/auth";
import { loadNotes } from "@/lib/dossier-server";

export const metadata: Metadata = { title: "Seu cadastro" };

export default async function CadastroCandidatoPage() {
  const { supabase, user } = await requireRole("candidate");
  const [{ data: c }, { data: exps }, notes] = await Promise.all([
    supabase.from("candidates").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("candidate_experiences").select("*").eq("candidate_id", user.id).order("position"),
    loadNotes(supabase, user.id),
  ]);

  const draft: CandidateDraft = {
    step: c ? Math.min(c.onboarding_step ?? 1, 4) : 1,
    userId: user.id,
    full_name: c?.full_name ?? (user.user_metadata?.full_name as string | undefined) ?? "",
    preferred_name: c?.preferred_name ?? "",
    city: c?.city ?? "",
    state: c?.state ?? undefined,
    areas: c?.areas ?? [],
    headline: c?.headline ?? "",
    years_experience: c?.years_experience != null ? String(c.years_experience) : "",
    skills: c?.skills ?? [],
    education: c?.education ?? undefined,
    courses: c?.courses ?? "",
    experiences: (exps ?? []).map((x) => ({
      role_title: x.role_title,
      employer_kind: x.employer_kind ?? "",
      employer_name: x.employer_name ?? "",
      start_year: x.start_year ? String(x.start_year) : "",
      end_year: x.end_year ? String(x.end_year) : "",
      description: x.description ?? "",
    })),
    available_from: c?.available_from ?? undefined,
    shifts: c?.shifts ?? [],
    modalities: c?.modalities ?? [],
    contract_types: c?.contract_types ?? [],
    resume_path: c?.resume_path ?? null,
    report: notes,
    anonymous: c?.anonymous ?? true,
    completed: Boolean(c?.completed_at),
  };

  return <CandidateWizard draft={draft} />;
}
