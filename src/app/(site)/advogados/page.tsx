import type { Metadata } from "next";
import { Alert } from "@/components/ui/alert";
import { LawyerDirectory } from "@/components/lawyer/lawyer-directory";
import { hasSupabaseEnv } from "@/lib/auth";
import { createPublicClient } from "@/lib/supabase/public";
import type { LawyerPublic } from "@/lib/types";

export const metadata: Metadata = {
  title: "Advogados voluntários",
  description: "Advogados que se ofereceram para ajudar de graça quem sofreu assédio eleitoral ou demissão discriminatória.",
};

// Página estática, refeita a cada 5 minutos: o filtro roda no navegador.
export const revalidate = 300;

async function getLawyers(): Promise<LawyerPublic[]> {
  if (!hasSupabaseEnv()) return [];
  try {
    const { data } = await createPublicClient()
      .from("lawyers_public")
      .select("id,full_name,oab_state,oab_number,areas,city,state,online,contact_kind,contact_value,bio")
      .order("full_name")
      .limit(500);
    return (data ?? []) as LawyerPublic[];
  } catch {
    return [];
  }
}

export default async function AdvogadosPage() {
  const lawyers = await getLawyers();
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10 sm:py-14">
      <div className="flex flex-col gap-3">
        <span className="text-[13px] font-black uppercase tracking-[0.08em] text-primary">Ajuda jurídica</span>
        <h1 className="font-display text-[42px] uppercase leading-[0.98] sm:text-5xl">Advogados voluntários</h1>
        <p className="text-base font-medium leading-relaxed">
          Sofreu assédio eleitoral, foi demitido por sua posição política ou perseguido no trabalho? Estes advogados se ofereceram para ajudar de graça,
          ou por valor social combinado com transparência. Você não precisa de conta para falar com eles.
        </p>
      </div>
      <Alert variant="accent">
        <p>
          Os advogados abaixo tiveram a inscrição na OAB conferida pela nossa equipe. O Recomeço não presta assessoria jurídica nem garante resultado. Na
          primeira mensagem, conte só o básico: não envie documentos nem dados sensíveis.
        </p>
      </Alert>
      {lawyers.length === 0 ? (
        <p className="border-3 border-dashed border-foreground p-6 text-center font-semibold">
          Ainda estamos conferindo os primeiros advogados. Enquanto isso, veja os canais oficiais em{" "}
          <a href="/direitos" className="underline">
            Seus direitos
          </a>
          .
        </p>
      ) : (
        <LawyerDirectory lawyers={lawyers} />
      )}
    </div>
  );
}
