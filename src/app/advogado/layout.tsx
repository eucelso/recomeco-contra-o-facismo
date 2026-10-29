import { AppShell } from "@/components/layout/app-shell";
import { requireRole } from "@/lib/auth";

export default async function AdvogadoLayout({ children }: { children: React.ReactNode }) {
  const { role } = await requireRole("lawyer");
  return <AppShell role={role}>{children}</AppShell>;
}
