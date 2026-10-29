import "server-only";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";

export type LawyerRow = {
  id: string;
  full_name: string;
  oab_state: string;
  oab_number: string;
  areas: string[];
  city: string;
  state: string;
  online: boolean;
  accepting: boolean;
  contact_kind: "whatsapp" | "email";
  contact_value: string;
  bio: string | null;
  verification_status: "pending" | "verified" | "rejected";
  rejection_reason: string | null;
  suspended_at: string | null;
  suspension_reason: string | null;
  created_at: string;
};

export async function requireLawyer() {
  const session = await requireRole("lawyer");
  const { data } = await session.supabase.from("lawyers").select("*").eq("id", session.user.id).maybeSingle();
  if (!data) redirect("/cadastro/advogado");
  return { ...session, lawyer: data as LawyerRow };
}
