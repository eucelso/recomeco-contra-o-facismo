import "server-only";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";

export async function requireEmployer() {
  const session = await requireRole("employer");
  const { data: employer } = await session.supabase.from("employers").select("*").eq("id", session.user.id).maybeSingle();
  if (!employer) redirect("/cadastro/contratante");
  return { ...session, employer: employer as {
    id: string;
    display_name: string;
    kind: "cnpj" | "cpf";
    sector: string;
    city: string;
    state: string;
    responsible_name: string;
    verification_status: "pending" | "verified" | "rejected";
    rejection_reason: string | null;
    created_at: string;
    commitment_accepted_at: string;
  } };
}
