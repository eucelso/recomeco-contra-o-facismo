"use server";

import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { jobSchema } from "@/lib/validation";

type Result = { ok: true; id?: string } | { ok: false; error: string };

export async function createJob(input: z.input<typeof jobSchema>): Promise<Result> {
  const parsed = jobSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Confira os campos." };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada." };
  const d = parsed.data;
  const remote = d.modality === "remoto";
  const { data, error } = await supabase
    .from("jobs")
    .insert({
      employer_id: user.id,
      title: d.title,
      description: d.description,
      area: d.area,
      modality: d.modality,
      contract_type: d.contract_type,
      city: remote ? d.city || null : d.city,
      state: remote ? d.state || null : d.state,
      salary_min: d.salary_min ? Number(d.salary_min) : null,
      salary_max: d.salary_max ? Number(d.salary_max) : null,
      benefits: d.benefits || null,
      status: d.publish ? "active" : "draft",
    })
    .select("id")
    .single();
  if (error) {
    if (error.code === "42501") return { ok: false, error: "Só contratantes verificados publicam vagas. Salve como rascunho." };
    return { ok: false, error: "Não conseguimos salvar a vaga." };
  }
  revalidatePath("/contratante");
  revalidatePath("/vagas");
  return { ok: true, id: data.id };
}

export async function setJobStatus(id: string, status: "draft" | "active" | "closed"): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("jobs").update({ status }).eq("id", id);
  if (error) return { ok: false, error: status === "active" ? "Só contratantes verificados publicam vagas." : "Não deu para atualizar." };
  revalidatePath("/contratante");
  revalidatePath("/vagas");
  return { ok: true };
}

export async function inviteCandidate(candidateId: string, jobId: string | null, message: string): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada." };
  const text = message.trim().slice(0, 600);
  const { error } = await supabase
    .from("contact_requests")
    .insert({ employer_id: user.id, candidate_id: candidateId, job_id: jobId, message: text || null });
  if (error) {
    if (error.code === "23505") return { ok: false, error: "Você já tem um convite aberto para esta pessoa." };
    return { ok: false, error: "Não foi possível enviar o convite agora." };
  }
  revalidatePath("/contratante");
  return { ok: true };
}

export async function markApplication(id: string, status: "viewed" | "hired" | "closed"): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_application_status", { p_id: id, p_status: status });
  if (error) return { ok: false, error: "Não deu para atualizar." };
  revalidatePath("/contratante");
  return { ok: true };
}
