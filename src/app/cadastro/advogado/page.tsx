import type { Metadata } from "next";
import { LawyerForm } from "@/components/lawyer/lawyer-form";
import { requireRole } from "@/lib/auth";

export const metadata: Metadata = { title: "Cadastro de advogado(a)" };

export default async function CadastroAdvogadoPage() {
  const { supabase, user } = await requireRole("lawyer");
  const { data: l } = await supabase.from("lawyers").select("*").eq("id", user.id).maybeSingle();
  return (
    <LawyerForm
      initial={
        l
          ? {
              full_name: l.full_name,
              oab_state: l.oab_state,
              oab_number: l.oab_number,
              areas: l.areas,
              city: l.city,
              state: l.state,
              online: l.online,
              contact_kind: l.contact_kind,
              contact_value: l.contact_value,
              bio: l.bio ?? "",
            }
          : null
      }
    />
  );
}
