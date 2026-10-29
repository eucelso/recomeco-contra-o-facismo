"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { COMPANIES_LINK, MAIN_LINKS, SUPPORT_LINKS, handleHashClick } from "@/lib/site-nav";
import { cn } from "@/lib/utils";

const item = "flex h-11 items-center px-3 text-sm font-black uppercase hover:underline hover:decoration-[3px] hover:underline-offset-4";

export function SiteNav() {
  const pathname = usePathname();
  const inSupport = SUPPORT_LINKS.some((l) => pathname === l.href || pathname.startsWith(l.href + "/"));

  const link = (l: { href: string; label: string }) => (
    <Link
      key={l.href}
      href={l.href}
      onClick={(e) => handleHashClick(e, l.href, pathname)}
      aria-current={pathname === l.href ? "page" : undefined}
      className={cn(item, pathname === l.href && "bg-accent text-accent-foreground no-underline")}
    >
      {l.label}
    </Link>
  );

  return (
    <nav aria-label="Principal" className="hidden items-center gap-1 lg:flex">
      {MAIN_LINKS.map(link)}
      <DropdownMenu>
        <DropdownMenuTrigger className={cn(item, "gap-1.5 data-[state=open]:bg-accent data-[state=open]:text-accent-foreground", inSupport && "bg-accent text-accent-foreground")}>
          Apoio <ChevronDown className="size-4" strokeWidth={3} aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[300px]">
          {SUPPORT_LINKS.map((l) => (
            <DropdownMenuItem asChild key={l.href} className="h-auto flex-col items-start justify-center gap-0.5 py-2.5 text-left">
              <Link href={l.href}>
                <span className="text-sm font-black uppercase">{l.label}</span>
                <span className="text-[13px] font-medium normal-case">{l.hint}</span>
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {link(COMPANIES_LINK)}
    </nav>
  );
}
