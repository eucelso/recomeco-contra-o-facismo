import { AppShell } from "@/components/layout/app-shell";
import { requireRole } from "@/lib/auth";

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const { role } = await requireRole("candidate");
  return <AppShell role={role}>{children}</AppShell>;
}
