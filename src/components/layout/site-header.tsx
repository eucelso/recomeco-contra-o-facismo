import Link from "next/link";
import { Logo } from "@/components/brand/fist";
import { Button } from "@/components/ui/button";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { getSession, homeFor } from "@/lib/auth";

const LINKS = [
  { href: "/#como-funciona", label: "Como funciona" },
  { href: "/vagas", label: "Vagas" },
  { href: "/direitos", label: "Seus direitos" },
  { href: "/#empresas", label: "Para empresas" },
];

export async function SiteHeader() {
  const { user, role } = await getSession();
  return (
    <header className="border-b-3 border-foreground bg-background">
      <div className="container flex h-16 items-center justify-between gap-4 sm:h-[76px]">
        <Link href="/" aria-label="Recomeço — início">
          <Logo />
        </Link>
        <nav aria-label="Principal" className="hidden gap-7 text-sm font-extrabold uppercase tracking-wider lg:flex">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:underline hover:decoration-[3px] hover:underline-offset-4">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <Button asChild variant="secondary" size="sm" className="shadow-none">
              <Link href={homeFor(role)}>Meu painel</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="shadow-none">
                <Link href="/entrar">Entrar</Link>
              </Button>
              <Button asChild variant="secondary" size="sm" className="hidden shadow-none sm:inline-flex">
                <Link href="/entrar?modo=cadastro">Criar conta</Link>
              </Button>
            </>
          )}
          <MobileMenu links={LINKS} />
        </div>
      </div>
    </header>
  );
}
