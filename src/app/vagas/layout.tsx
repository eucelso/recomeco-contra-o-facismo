import { AppShell } from "@/components/layout/app-shell";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getSession } from "@/lib/auth";

export default async function VagasLayout({ children }: { children: React.ReactNode }) {
  const { role } = await getSession();
  if (role) return <AppShell role={role} className="max-w-3xl">{children}</AppShell>;
  return (
    <>
      <SiteHeader />
      <main id="conteudo" className="mx-auto w-full max-w-3xl px-4 pb-16 pt-6">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
