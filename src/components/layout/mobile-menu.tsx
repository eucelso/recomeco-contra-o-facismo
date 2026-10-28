"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export function MobileMenu({ links }: { links: { href: string; label: string }[] }) {
  return (
    <Sheet>
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
          {links.map((l) => (
            <SheetClose asChild key={l.href}>
              <Link href={l.href} className="border-b-3 border-foreground py-4 text-lg font-black uppercase">
                {l.label}
              </Link>
            </SheetClose>
          ))}
          <SheetClose asChild>
            <Link href="/entrar?modo=cadastro" className="py-4 text-lg font-black uppercase text-primary">
              Criar conta
            </Link>
          </SheetClose>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
