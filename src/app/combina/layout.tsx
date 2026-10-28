import { AppShell } from "@/components/layout/app-shell";
import { requireRole } from "@/lib/auth";

export default async function CombinaLayout({ children }: { children: React.ReactNode }) {
  const { role } = await requireRole();
  return (
    <AppShell role={role} className="max-w-7xl">
      {children}
    </AppShell>
  );
}
