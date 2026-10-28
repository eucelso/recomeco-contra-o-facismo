import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { requireRole } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { role } = await requireRole();
  if (role !== "admin") notFound();
  return <AppShell role={role} className="max-w-3xl">{children}</AppShell>;
}
