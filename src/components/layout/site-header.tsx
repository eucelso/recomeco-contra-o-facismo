import Link from "next/link";
import { Logo } from "@/components/brand/fist";
import { HeaderAuth } from "@/components/layout/header-auth";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { SiteNav } from "@/components/layout/site-nav";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b-3 border-foreground bg-background">
      <div className="container flex h-16 items-center justify-between gap-4 sm:h-[76px]">
        <Link href="/" aria-label="Recomeço — início">
          <Logo />
        </Link>
        <SiteNav />
        <div className="flex items-center gap-2">
          <HeaderAuth />
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
