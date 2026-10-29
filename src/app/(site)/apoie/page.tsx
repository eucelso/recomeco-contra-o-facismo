import type { Metadata } from "next";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { BusinessDirectory } from "@/components/business/business-directory";
import { hasSupabaseEnv } from "@/lib/auth";
import { createPublicClient } from "@/lib/supabase/public";
import type { BusinessPublic } from "@/lib/types";

export const metadata: Metadata = {
  title: "Apoie negócios",
  description: "Negócios que foram prejudicados por boicote ou perseguição e precisam do apoio de quem mora perto.",
};

// Página estática, refeita a cada 5 minutos: o filtro roda no navegador.
export const revalidate = 300;

async function getBusinesses(): Promise<BusinessPublic[]> {
  if (!hasSupabaseEnv()) return [];
  try {
    const { data } = await createPublicClient()
      .from("businesses_public")
      .select("id,display_name,category,city,state,neighborhood,address,whatsapp,instagram,website,hours,story")
      .order("display_name")
      .limit(500);
    return (data ?? []) as BusinessPublic[];
  } catch {
    return [];
  }
}

export default async function ApoiePage() {
  const businesses = await getBusinesses();
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10 sm:py-14">
      <div className="flex flex-col gap-3">
        <span className="text-[13px] font-black uppercase tracking-[0.08em] text-primary">Comércio local</span>
        <h1 className="font-display text-[42px] uppercase leading-[0.98] sm:text-5xl">Apoie negócios</h1>
        <p className="text-base font-medium leading-relaxed">
          Estes negócios foram prejudicados por boicote ou perseguição e pedem a sua visita. Compre perto, conheça e divulgue.
        </p>
      </div>
      <Alert variant="accent">
        <p>
          Estes negócios se cadastraram e tiveram os dados conferidos pela nossa equipe. O Recomeço não investiga nem confirma os relatos, e não mantém listas
          de pessoas ou empresas a evitar.
        </p>
      </Alert>
      {businesses.length === 0 ? (
        <p className="border-3 border-dashed border-foreground p-6 text-center font-semibold">Ainda estamos conferindo os primeiros negócios.</p>
      ) : (
        <BusinessDirectory businesses={businesses} />
      )}
      <p className="text-sm font-semibold">
        Tem um negócio prejudicado?{" "}
        <Link href="/entrar?modo=cadastro&tipo=business" className="underline">
          Cadastre aqui
        </Link>
        .
      </p>
    </div>
  );
}
