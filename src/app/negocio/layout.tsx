import { AppShell } from "@/components/layout/app-shell";
import { requireRole } from "@/lib/auth";

export default async function NegocioLayout({ children }: { children: React.ReactNode }) {
  const { role } = await requireRole("business");
  return <AppShell role={role}>{children}</AppShell>;
}
