import type { Metadata } from "next";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ReportList } from "@/components/reports/report-list";
import { hasSupabaseEnv } from "@/lib/auth";
import { createPublicClient } from "@/lib/supabase/public";
import type { ReportPublic } from "@/lib/types";

export const metadata: Metadata = {
  title: "Relatos anônimos",
  description: "Relatos anônimos de pessoas que sofreram assédio eleitoral, demissão discriminatória ou intimidação.",
};

// Página estática, refeita a cada 5 minutos: o filtro roda no navegador.
export const revalidate = 300;

async function getReports(): Promise<ReportPublic[]> {
  if (!hasSupabaseEnv()) return [];
  try {
    const { data } = await createPublicClient()
      .from("reports_public")
      .select("id,story,topic,city,state,month")
      .order("month", { ascending: false })
      .limit(300);
    return (data ?? []) as ReportPublic[];
  } catch {
    return [];
  }
}

export default async function RelatosPage() {
  const reports = await getReports();
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10 sm:py-14">
      <div className="flex flex-col gap-3">
        <span className="text-[13px] font-black uppercase tracking-[0.08em] text-primary">Vozes</span>
        <h1 className="font-display text-[42px] uppercase leading-[0.98] sm:text-5xl">Relatos anônimos</h1>
        <p className="text-base font-medium leading-relaxed">
          Pessoas que sofreram assédio eleitoral, demissão discriminatória ou intimidação contam o que viveram, sem se identificar. Você não está sozinho(a).
        </p>
        <Button asChild className="self-start">
          <Link href="/relatos/novo">Contar a minha história</Link>
        </Button>
      </div>
      <Alert variant="accent">
        <p>
          A equipe lê cada relato antes de publicar e retira nomes e dados que identifiquem alguém. O Recomeço não confirma os relatos e não acusa ninguém.
          Para pedir a remoção de um relato, escreva para o contato indicado na{" "}
          <Link href="/politica-de-privacidade" className="underline">
            política de privacidade
          </Link>
          .
        </p>
      </Alert>
      {reports.length === 0 ? (
        <p className="border-3 border-dashed border-foreground p-6 text-center font-semibold">Ainda não há relatos publicados.</p>
      ) : (
        <ReportList reports={reports} />
      )}
      <p className="text-sm font-semibold">
        Quer denunciar de forma oficial? Veja os canais em{" "}
        <Link href="/direitos" className="underline">
          Seus direitos
        </Link>
        .
      </p>
    </div>
  );
}
