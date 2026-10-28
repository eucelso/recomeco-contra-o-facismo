import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CandidateCombina } from "@/components/combina/candidate-combina";
import { EmployerCombina } from "@/components/combina/employer-combina";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth";
import { MODALITIES } from "@/lib/constants";
import type { CombinaJob, CombinaProfile, Connection } from "@/lib/types";

export const metadata: Metadata = { title: "Combina", robots: { index: false } };

function Header({ kicker, text }: { kicker: string; text: string }) {
  return (
    <div className="mb-6 flex flex-col gap-1.5">
      <h1 className="font-display text-5xl uppercase leading-none">
        Combina <span className="align-middle text-sm font-sans font-black tracking-wider text-primary">{kicker}</span>
      </h1>
      <p className="max-w-xl text-[15px] font-medium">{text}</p>
    </div>
  );
}

export default async function CombinaPage({ searchParams }: { searchParams: Promise<{ vaga?: string }> }) {
  const { supabase, user, role } = await requireRole();
  const { data: conns } = await supabase.rpc("combina_connections", { p_limit: 20 });
  const connections = (conns ?? []) as Connection[];

  if (role === "employer") {
    const { data: emp } = await supabase.from("employers").select("display_name,verification_status").eq("id", user.id).maybeSingle();
    if (!emp) redirect("/cadastro/contratante");
    if (emp.verification_status !== "verified") {
      return (
        <div className="mx-auto max-w-xl">
          <Header kicker="PERFIS ANÔNIMOS" text="Deslize perfis anônimos para cada vaga. Se a pessoa também quiser, dá liga." />
          <Alert variant="accent">
            <p>
              O Combina libera depois que sua empresa for verificada.{" "}
              <Link href="/contratante/verificacao" className="underline">
                Ver status
              </Link>
            </p>
          </Alert>
        </div>
      );
    }
    const { data: jobs } = await supabase
      .from("jobs")
      .select("id,title,city")
      .eq("employer_id", user.id)
      .eq("status", "active")
      .order("published_at", { ascending: false });
    if (!jobs?.length) {
      return (
        <div className="mx-auto max-w-xl">
          <Header kicker="PERFIS ANÔNIMOS" text="Deslize perfis anônimos para cada vaga. Se a pessoa também quiser, dá liga." />
          <div className="flex flex-col gap-4 border-3 border-dashed border-foreground p-6 text-center">
            <p className="font-semibold">Publique uma vaga para começar a ver perfis.</p>
            <Button asChild>
              <Link href="/contratante/vagas/nova">Publicar vaga</Link>
            </Button>
          </div>
        </div>
      );
    }
    const { vaga } = await searchParams;
    const jobId = jobs.some((j) => j.id === vaga) ? vaga! : jobs[0].id;
    const { data: profiles, error } = await supabase.rpc("combina_employer_feed", { p_job: jobId, p_limit: 20 });
    return (
      <>
        <Header kicker="PERFIS ANÔNIMOS" text="Perfis anônimos para cada vaga. O nome só aparece se a pessoa também quiser conversar." />
        {error && <Alert variant="destructive">Não conseguimos carregar os perfis agora.</Alert>}
        <EmployerCombina jobs={jobs} jobId={jobId} profiles={(profiles ?? []) as CombinaProfile[]} connections={connections} meName={emp.display_name} />
      </>
    );
  }

  // Candidato
  const { data: me } = await supabase
    .from("candidates")
    .select("full_name,preferred_name,city,state,areas,modalities,completed_at")
    .eq("id", user.id)
    .maybeSingle();
  if (!me?.completed_at) redirect("/cadastro/candidato");

  const [{ data: jobs, error }, { count }] = await Promise.all([
    supabase.rpc("combina_candidate_feed", { p_limit: 20 }),
    supabase.from("applications").select("id", { count: "exact", head: true }).eq("candidate_id", user.id).in("status", ["sent", "viewed"]),
  ]);
  const filterSummary = [
    `${me.city}/${me.state}`,
    ...(me.areas as string[]),
    ...((me.modalities as (keyof typeof MODALITIES)[]).includes("remoto") ? ["Remoto"] : []),
  ];

  return (
    <>
      <Header kicker="VAGAS PARA VOCÊ" text="Vagas escolhidas para o seu perfil. Se a empresa também quiser, dá liga e a conversa abre." />
      {error && <Alert variant="destructive">Não conseguimos carregar as vagas agora.</Alert>}
      <CandidateCombina
        jobs={(jobs ?? []) as CombinaJob[]}
        connections={connections}
        likeCount={count ?? 0}
        meName={me.preferred_name || me.full_name}
        filterSummary={filterSummary}
      />
    </>
  );
}
