import type { Metadata } from "next";
import { EmployerDirectory, type EmployerRow } from "@/components/employer/employer-directory";
import { hasSupabaseEnv } from "@/lib/auth";
import { createPublicClient } from "@/lib/supabase/public";

export const metadata: Metadata = {
  title: "Empresas comprometidas",
  description: "Empresas, cooperativas e autônomos que assinaram o Compromisso de Contratação Justa e foram verificados.",
};

// Página estática, refeita a cada 5 minutos: a busca roda no navegador.
export const revalidate = 300;

async function getEmployers(): Promise<EmployerRow[]> {
  if (!hasSupabaseEnv()) return [];
  try {
    const supabase = createPublicClient();
    const [{ data: emps }, { data: jobs }] = await Promise.all([
      supabase.from("employer_public").select("id,display_name,sector,city,state").order("display_name").limit(500),
      supabase.from("job_listings").select("employer_id").limit(5000),
    ]);
    const count = new Map<string, number>();
    for (const j of jobs ?? []) count.set(j.employer_id, (count.get(j.employer_id) ?? 0) + 1);
    return (emps ?? [])
      .map((e) => ({ ...e, jobs: count.get(e.id) ?? 0 }) as EmployerRow)
      .sort((a, b) => b.jobs - a.jobs || a.display_name.localeCompare(b.display_name, "pt-BR"));
  } catch {
    return [];
  }
}

export default async function EmpresasPage() {
  const employers = await getEmployers();
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10 sm:py-14">
      <div className="flex flex-col gap-3">
        <span className="text-[13px] font-black uppercase tracking-[0.08em] text-primary">Quem contrata</span>
        <h1 className="font-display text-[42px] uppercase leading-[0.98] sm:text-5xl">Empresas comprometidas</h1>
        <p className="text-base font-medium leading-relaxed">
          Todas assinaram o Compromisso de Contratação Justa e passaram pela verificação da nossa equipe. Abra uma empresa para ver todas as vagas dela.
        </p>
      </div>
      {employers.length === 0 ? (
        <p className="border-3 border-dashed border-foreground p-6 text-center font-semibold">Ainda estamos verificando as primeiras empresas.</p>
      ) : (
        <EmployerDirectory employers={employers} />
      )}
    </div>
  );
}
