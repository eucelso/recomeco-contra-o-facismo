import type { MouseEvent } from "react";

export const MAIN_LINKS = [
  { href: "/#como-funciona", label: "Como funciona" },
  { href: "/vagas", label: "Vagas" },
] as const;

export const SUPPORT_LINKS = [
  { href: "/direitos", label: "Seus direitos", hint: "Assédio eleitoral e onde denunciar" },
  { href: "/advogados", label: "Advogados voluntários", hint: "Ajuda jurídica gratuita" },
  { href: "/relatos", label: "Relatos anônimos", hint: "Histórias de quem passou por isso" },
  { href: "/apoie", label: "Apoie negócios", hint: "Comércio local prejudicado" },
] as const;

export const COMPANIES_LINK = { href: "/#empresas", label: "Para empresas" } as const;

/**
 * Clique em âncora (/#secao) estando na home: rola até a seção mesmo quando o hash já está na URL.
 * O Link do Next ignora o clique nesse caso, e por isso o segundo clique "não fazia nada".
 * Devolve true quando tratou o clique.
 */
export function handleHashClick(e: MouseEvent, href: string, pathname: string, after?: () => void) {
  if (!href.startsWith("/#") || pathname !== "/") return false;
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return false;
  const id = href.slice(2);
  e.preventDefault();
  after?.();
  // Espera o menu (se estiver aberto) soltar a rolagem da página antes de rolar.
  window.setTimeout(() => {
    const el = document.getElementById(id);
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    if (window.location.hash !== `#${id}`) window.history.pushState(null, "", `/#${id}`);
    el.setAttribute("tabindex", "-1");
    el.focus({ preventScroll: true });
  }, 60);
  return true;
}
