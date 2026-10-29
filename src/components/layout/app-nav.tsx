"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, GalleryHorizontalEnd, House, LayoutDashboard, MessageSquare, Scale, ShieldCheck, Store, UsersRound, User, Users } from "lucide-react";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";

const CANDIDATE = [
  { href: "/painel", label: "Início", Icon: House },
  { href: "/combina", label: "Combina", Icon: GalleryHorizontalEnd },
  { href: "/vagas", label: "Vagas", Icon: Briefcase },
  { href: "/mensagens", label: "Mensagens", Icon: MessageSquare },
  { href: "/privacidade", label: "Perfil", Icon: User },
];
const EMPLOYER = [
  { href: "/contratante", label: "Painel", Icon: LayoutDashboard },
  { href: "/combina", label: "Combina", Icon: GalleryHorizontalEnd },
  { href: "/contratante/candidatos", label: "Candidatos", Icon: Users },
  { href: "/mensagens", label: "Mensagens", Icon: MessageSquare },
];
const LAWYER = [
  { href: "/advogado", label: "Painel", Icon: LayoutDashboard },
  { href: "/advogados", label: "Advogados", Icon: Scale },
  { href: "/cadastro/advogado", label: "Perfil", Icon: User },
];
const BUSINESS = [
  { href: "/negocio", label: "Painel", Icon: LayoutDashboard },
  { href: "/apoie", label: "Apoie", Icon: Store },
  { href: "/cadastro/negocio", label: "Perfil", Icon: User },
];
const ADMIN = [
  { href: "/admin/verificacoes", label: "Verificações", Icon: ShieldCheck },
  { href: "/admin/contas", label: "Contas", Icon: UsersRound },
  { href: "/vagas", label: "Vagas", Icon: Briefcase },
];

export function AppNav({ role, variant }: { role: Role; variant: "top" | "bottom" }) {
  const pathname = usePathname();
  const items = role === "employer" ? EMPLOYER : role === "lawyer" ? LAWYER : role === "business" ? BUSINESS : role === "admin" ? ADMIN : CANDIDATE;
  const isActive = (href: string) =>
    pathname === href || (href !== "/contratante" && href !== "/painel" && href !== "/advogado" && href !== "/negocio" && pathname.startsWith(href + "/"));

  if (variant === "top") {
    return (
      <nav aria-label="Navegação do app" className="flex gap-1">
        {items.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            aria-current={isActive(href) ? "page" : undefined}
            className={cn(
              "flex h-11 items-center px-3 text-sm font-black uppercase",
              isActive(href) ? "bg-accent text-accent-foreground" : "hover:underline hover:underline-offset-4",
            )}
          >
            {label}
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <nav
      aria-label="Navegação do app"
      className="fixed inset-x-0 bottom-0 z-40 grid border-t-3 border-foreground bg-[#141210] pb-[env(safe-area-inset-bottom)] md:hidden"
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
    >
      {items.map(({ href, label, Icon }) => (
        <Link
          key={href}
          href={href}
          aria-current={isActive(href) ? "page" : undefined}
          className={cn(
            "flex h-[68px] flex-col items-center justify-center gap-1 text-[10px] font-extrabold uppercase sm:text-[11px]",
            isActive(href) ? "bg-[#E8A317] font-black text-[#141210]" : "text-[#F2E8D5]",
          )}
        >
          <Icon className="size-[22px]" strokeWidth={2.4} aria-hidden="true" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
