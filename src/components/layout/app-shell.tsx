import Link from "next/link";
import { Logo } from "@/components/brand/fist";
import { AppNav } from "@/components/layout/app-nav";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";

export function AppShell({
  role,
  children,
  className,
}: {
  role: Role;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="hidden border-b-3 border-foreground md:block">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" aria-label="Recomeço — início">
            <Logo />
          </Link>
          <AppNav role={role} variant="top" />
        </div>
      </header>
      <main className={cn("mx-auto w-full max-w-2xl flex-1 px-4 pb-28 pt-5 md:pb-12 md:pt-8", className)}>{children}</main>
      <AppNav role={role} variant="bottom" />
    </div>
  );
}

export function PageTitle({ children, kicker, className }: { children: React.ReactNode; kicker?: string; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {kicker && <span className="text-[13px] font-black uppercase tracking-[0.08em] text-primary">{kicker}</span>}
      <h1 className="font-display text-[42px] uppercase leading-[0.98] sm:text-5xl">{children}</h1>
    </div>
  );
}

export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b-3 border-foreground pb-1.5">
      <h2 className="text-[15px] font-black uppercase">{children}</h2>
      {action}
    </div>
  );
}
