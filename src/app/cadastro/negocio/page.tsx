import type { Metadata } from "next";
import { BusinessForm } from "@/components/business/business-form";
import { requireRole } from "@/lib/auth";

export const metadata: Metadata = { title: "Cadastro do negócio" };

export default async function CadastroNegocioPage() {
  const { supabase, user } = await requireRole("business");
  const { data: b } = await supabase.from("businesses").select("*").eq("id", user.id).maybeSingle();
  return (
    <BusinessForm
      initial={
        b
          ? {
              kind: b.kind,
              document: b.document,
              display_name: b.display_name,
              category: b.category,
              city: b.city,
              state: b.state,
              neighborhood: b.neighborhood ?? "",
              address: b.address ?? "",
              whatsapp: b.whatsapp ?? "",
              instagram: b.instagram ?? "",
              website: b.website ?? "",
              hours: b.hours ?? "",
              story: b.story,
            }
          : null
      }
    />
  );
}
