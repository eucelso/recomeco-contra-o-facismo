"use server";

import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { candidateStep1, candidateStep2, candidateStep3, candidateStep4 } from "@/lib/validation";

type Result = { ok: true } | { ok: false; error: string };

async function ctx() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sessão expirada. Entre de novo.");
  return { supabase, uid: user.id };
}

export async function saveStep1(input: z.input<typeof candidateStep1>): Promise<Result> {
  const parsed = candidateStep1.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Confira os campos destacados." };
  const { supabase, uid } = await ctx();
  const d = parsed.data;
  const { data: existing } = await supabase.from("candidates").select("onboarding_step").eq("id", uid).maybeSingle();
  const row = {
    id: uid,
    full_name: d.full_name,
    preferred_name: d.preferred_name || null,
    city: d.city,
    state: d.state,
    areas: d.areas,
    onboarding_step: Math.max(existing?.onboarding_step ?? 1, 2),
  };
  const { error } = existing
    ? await supabase.from("candidates").update(row).eq("id", uid)
    : await supabase.from("candidates").insert(row);
  if (error) return { ok: false, error: "Não conseguimos salvar agora. Tente de novo." };
  return { ok: true };
}

export async function saveStep2(input: z.input<typeof candidateStep2>): Promise<Result> {
  const parsed = candidateStep2.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Confira os campos destacados." };
  const { supabase, uid } = await ctx();
  const d = parsed.data;
  const { error } = await supabase
    .from("candidates")
    .update({
      headline: d.headline,
      years_experience: Number(d.years_experience),
      skills: d.skills,
      education: d.education ?? null,
      courses: d.courses || null,
      onboarding_step: 3,
    })
    .eq("id", uid);
  if (error) return { ok: false, error: "Não conseguimos salvar agora. Tente de novo." };

  await supabase.from("candidate_experiences").delete().eq("candidate_id", uid);
  if (d.experiences.length) {
    const { error: expErr } = await supabase.from("candidate_experiences").insert(
      d.experiences.map((x, i) => ({
        candidate_id: uid,
        role_title: x.role_title,
        employer_kind: x.employer_kind || null,
        employer_name: x.employer_name || null,
        start_year: x.start_year ? Number(x.start_year) : null,
        end_year: x.end_year ? Number(x.end_year) : null,
        description: x.description || null,
        position: i,
      })),
    );
    if (expErr) return { ok: false, error: "Não conseguimos salvar as experiências." };
  }
  return { ok: true };
}

export async function saveStep3(input: z.input<typeof candidateStep3>): Promise<Result> {
  const parsed = candidateStep3.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Confira os campos destacados." };
  const { supabase, uid } = await ctx();
  const { error } = await supabase.from("candidates").update({ ...parsed.data, onboarding_step: 4 }).eq("id", uid);
  if (error) return { ok: false, error: "Não conseguimos salvar agora. Tente de novo." };
  return { ok: true };
}

export async function finishOnboarding(input: z.input<typeof candidateStep4>, resumePath: string | null): Promise<Result> {
  const parsed = candidateStep4.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Confira os campos." };
  const { supabase, uid } = await ctx();
  const d = parsed.data;

  if (resumePath && !resumePath.startsWith(`${uid}/`)) return { ok: false, error: "Arquivo inválido." };

  if (d.report) {
    const { error } = await supabase
      .from("confidential_reports")
      .upsert({ candidate_id: uid, body: d.report, consent_at: new Date().toISOString() });
    if (error) return { ok: false, error: "Não conseguimos guardar o relato." };
  }

  const { error } = await supabase
    .from("candidates")
    .update({
      anonymous: d.anonymous,
      resume_path: resumePath,
      onboarding_step: 5,
      completed_at: new Date().toISOString(),
    })
    .eq("id", uid);
  if (error) return { ok: false, error: "Não conseguimos concluir agora. Tente de novo." };

  await supabase.from("consent_events").insert([
    { user_id: uid, kind: "perfil_anonimo", granted: d.anonymous },
    ...(d.report ? [{ user_id: uid, kind: "relato_confidencial", granted: true }] : []),
  ]);

  revalidatePath("/painel");
  return { ok: true };
}
