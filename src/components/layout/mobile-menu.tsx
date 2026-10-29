"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { COMPANIES_LINK, MAIN_LINKS, SUPPORT_LINKS, handleHashClick } from "@/lib/site-nav";

const row = "flex flex-col gap-0.5 border-b-3 border-foreground py-3.5";

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const close = () => setOpen(false);

  const link = (l: { href: string; label: string; hint?: string }) => (
    <Link key={l.href} href={l.href} onClick={(e) => (handleHashClick(e, l.href, pathname, close), close())} className={row}>
      <span className="text-lg font-black uppercase leading-tight">{l.label}</span>
      {l.hint && <span className="text-sm font-medium">{l.hint}</span>}
    </Link>
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label="Abrir menu"
        className="flex size-11 items-center justify-center border-3 border-foreground bg-secondary text-secondary-foreground lg:hidden"
      >
        <Menu className="size-5" strokeWidth={3} />
      </SheetTrigger>
      <SheetContent>
        <SheetTitle>Menu</SheetTitle>
        <SheetDescription className="sr-only">Links principais do site</SheetDescription>
        <nav aria-label="Menu" className="flex flex-col">
          {MAIN_LINKS.map(link)}
          {link(COMPANIES_LINK)}
          <span className="mt-5 text-[13px] font-black uppercase tracking-[0.1em] text-primary">Apoio</span>
          {SUPPORT_LINKS.map(link)}
          <Link
            href="/entrar?modo=cadastro"
            onClick={close}
            className="mt-6 flex h-12 items-center justify-center border-3 border-foreground bg-primary text-base font-black uppercase text-primary-foreground shadow-hard-sm"
          >
            Criar conta
          </Link>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
