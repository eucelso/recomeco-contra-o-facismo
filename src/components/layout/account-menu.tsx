"use client";

import { useRef } from "react";
import Link from "next/link";
import { Briefcase, Building, ChevronDown, Clock, House, LogOut, ShieldCheck, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Role } from "@/lib/types";
import { initials } from "@/lib/utils";

const ROLE_LABEL: Record<Role, string> = { candidate: "Candidato(a)", employer: "Contratante", lawyer: "Advogado(a)", admin: "Admin" };

export function AccountMenu({ role, name, email }: { role: Role; name: string; email: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const home = role === "employer" ? "/contratante" : role === "lawyer" ? "/advogado" : role === "admin" ? "/admin/verificacoes" : "/painel";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`Menu da conta de ${name}`}
          className="flex h-11 items-center gap-2 border-3 border-foreground bg-card pl-1 pr-2 data-[state=open]:bg-accent"
        >
          <span aria-hidden="true" className="flex size-8 items-center justify-center bg-secondary font-display text-sm text-secondary-foreground">
            {initials(name) || "?"}
          </span>
          <span className="hidden max-w-[160px] truncate text-sm font-extrabold sm:block">{name}</span>
          <ChevronDown className="size-4" strokeWidth={3} aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>
            <span className="block truncate text-[15px] font-black">{name}</span>
            <span className="block truncate text-[13px] font-medium">{email}</span>
            <span className="mt-1 inline-block border-2 border-foreground px-1.5 text-[11px] font-black uppercase">{ROLE_LABEL[role]}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={home}>
              <House strokeWidth={2.4} aria-hidden="true" /> Meu painel
            </Link>
          </DropdownMenuItem>
          {role === "employer" && (
            <>
              <DropdownMenuItem asChild>
                <Link href="/contratante/vagas/nova">
                  <Briefcase strokeWidth={2.4} aria-hidden="true" /> Publicar vaga
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/cadastro/contratante">
                  <Building strokeWidth={2.4} aria-hidden="true" /> Dados da empresa
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/contratante/verificacao">
                  <Clock strokeWidth={2.4} aria-hidden="true" /> Status da verificação
                </Link>
              </DropdownMenuItem>
            </>
          )}
          {role === "lawyer" && (
            <DropdownMenuItem asChild>
              <Link href="/cadastro/advogado">
                <User strokeWidth={2.4} aria-hidden="true" /> Editar meu perfil
              </Link>
            </DropdownMenuItem>
          )}
          {role === "candidate" && (
            <DropdownMenuItem asChild>
              <Link href="/cadastro/candidato">
                <User strokeWidth={2.4} aria-hidden="true" /> Editar meu perfil
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem asChild>
            <Link href="/privacidade">
              <ShieldCheck strokeWidth={2.4} aria-hidden="true" /> Privacidade e dados
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => formRef.current?.requestSubmit()} className="text-primary data-[highlighted]:text-accent-foreground">
            <LogOut strokeWidth={2.6} aria-hidden="true" /> Sair da conta
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <form ref={formRef} action="/auth/sair" method="post" hidden />
    </>
  );
}
