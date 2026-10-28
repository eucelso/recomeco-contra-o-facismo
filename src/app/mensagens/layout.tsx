import { AppShell } from "@/components/layout/app-shell";
import { requireRole } from "@/lib/auth";

export default async function MensagensLayout({ children }: { children: React.ReactNode }) {
  const { role } = await requireRole();
  return <AppShell role={role}>{children}</AppShell>;
}
