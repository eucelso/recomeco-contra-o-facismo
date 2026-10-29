import "server-only";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";

export type BusinessRow = {
  id: string;
  kind: "cnpj" | "cpf";
  document: string;
  display_name: string;
  category: string;
  city: string;
  state: string;
  neighborhood: string | null;
  address: string | null;
  whatsapp: string | null;
  instagram: string | null;
  website: string | null;
  hours: string | null;
  story: string;
  visible: boolean;
  verification_status: "pending" | "verified" | "rejected";
  rejection_reason: string | null;
  suspended_at: string | null;
  suspension_reason: string | null;
  created_at: string;
};

export async function requireBusiness() {
  const session = await requireRole("business");
  const { data } = await session.supabase.from("businesses").select("*").eq("id", session.user.id).maybeSingle();
  if (!data) redirect("/cadastro/negocio");
  return { ...session, business: data as BusinessRow };
}
