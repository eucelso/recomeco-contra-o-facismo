import Link from "next/link";
import { Logo } from "@/components/brand/fist";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { HeaderAuth } from "@/components/layout/header-auth";

const LINKS = [
  { href: "/#como-funciona", label: "Como funciona" },
  { href: "/vagas", label: "Vagas" },
  { href: "/direitos", label: "Seus direitos" },
  { href: "/advogados", label: "Advogados" },
  { href: "/apoie", label: "Apoie negócios" },
  { href: "/#empresas", label: "Para empresas" },
];

export function SiteHeader() {
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
          <HeaderAuth />
          <MobileMenu links={LINKS} />
        </div>
      </div>
    </header>
  );
}
