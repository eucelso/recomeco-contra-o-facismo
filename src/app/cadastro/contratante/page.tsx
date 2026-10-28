import type { Metadata } from "next";
import { EmployerForm } from "@/components/onboarding/employer-form";
import { requireRole } from "@/lib/auth";

export const metadata: Metadata = { title: "Cadastro de contratante" };

export default async function CadastroContratantePage() {
  const { supabase, user } = await requireRole("employer");
  const { data: e } = await supabase.from("employers").select("*").eq("id", user.id).maybeSingle();
  return (
    <EmployerForm
      initial={
        e
          ? {
              kind: e.kind,
              document: e.document,
              display_name: e.display_name,
              legal_name: e.legal_name ?? "",
              sector: e.sector,
              city: e.city,
              state: e.state,
              responsible_name: e.responsible_name,
            }
          : null
      }
    />
  );
}
