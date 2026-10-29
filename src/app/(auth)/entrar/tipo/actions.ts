"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function chooseRole(formData: FormData) {
  const role = formData.get("role");
  if (role !== "candidate" && role !== "employer" && role !== "lawyer" && role !== "business") return;
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_my_role", { p_role: role });
  if (error) redirect("/entrar?erro=sessao");
  redirect(role === "employer" ? "/cadastro/contratante" : role === "lawyer" ? "/cadastro/advogado" : role === "business" ? "/cadastro/negocio" : "/cadastro/candidato");
}
