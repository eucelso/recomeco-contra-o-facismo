import { AppShell } from "@/components/layout/app-shell";
import { requireRole } from "@/lib/auth";

export default async function ContratanteLayout({ children }: { children: React.ReactNode }) {
  const { role } = await requireRole("employer");
  return <AppShell role={role}>{children}</AppShell>;
}
