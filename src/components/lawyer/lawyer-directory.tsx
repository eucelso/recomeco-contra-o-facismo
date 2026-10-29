"use client";

import { useMemo, useState } from "react";
import { MessageCircle, Mail, Monitor } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LEGAL_AREAS, STATES } from "@/lib/constants";
import type { LawyerPublic } from "@/lib/types";
import { cn } from "@/lib/utils";

function contactHref(l: LawyerPublic) {
  if (l.contact_kind === "email") return `mailto:${l.contact_value}`;
  const digits = l.contact_value.replace(/\D/g, "");
  return `https://wa.me/${digits.startsWith("55") ? digits : `55${digits}`}`;
}

export function LawyerDirectory({ lawyers }: { lawyers: LawyerPublic[] }) {
  const [uf, setUf] = useState("");
  const [area, setArea] = useState("");

  const list = useMemo(
    () =>
      lawyers.filter(
        (l) => (!uf || l.state === uf || l.online) && (!area || l.areas.includes(area)),
      ),
    [lawyers, uf, area],
  );

  const select = "h-12 w-full border-3 border-foreground bg-card px-3 text-sm font-bold";
  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs font-black uppercase">
          Seu estado
          <select value={uf} onChange={(e) => setUf(e.target.value)} className={select}>
            <option value="">Todos</option>
            {STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-black uppercase">
          Tipo de ajuda
          <select value={area} onChange={(e) => setArea(e.target.value)} className={select}>
            <option value="">Todas</option>
            {LEGAL_AREAS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="text-sm font-semibold" aria-live="polite">
        {list.length} {list.length === 1 ? "advogado(a)" : "advogados(as)"}
        {uf && " (inclui quem atende online)"}
      </p>

      {list.length === 0 ? (
        <p className="border-3 border-dashed border-foreground p-6 text-center font-semibold">
          Ninguém com esse filtro ainda. Tente outro estado ou tipo de ajuda.
        </p>
      ) : (
        <ul className="flex flex-col gap-4 pr-1.5">
          {list.map((l) => (
            <li key={l.id} className="flex flex-col gap-3 border-3 border-foreground bg-card p-4 shadow-hard">
              <div className="flex flex-col gap-1">
                <strong className="text-lg font-black">{l.full_name}</strong>
                <span className="text-sm font-semibold">
                  OAB/{l.oab_state} {l.oab_number} · {l.city}, {l.state}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {l.areas.map((a) => (
                  <Badge key={a} variant="accent">
                    {a}
                  </Badge>
                ))}
                {l.online && (
                  <Badge variant="dashed">
                    <Monitor aria-hidden="true" /> Atende online
                  </Badge>
                )}
              </div>
              {l.bio && <p className="text-[15px] leading-relaxed">{l.bio}</p>}
              <a
                href={contactHref(l)}
                target={l.contact_kind === "whatsapp" ? "_blank" : undefined}
                rel="noopener noreferrer"
                className={cn(
                  "inline-flex h-12 items-center justify-center gap-2 border-3 border-foreground bg-primary px-4 text-sm font-black uppercase text-primary-foreground shadow-hard-sm",
                )}
              >
                {l.contact_kind === "whatsapp" ? <MessageCircle className="size-5" aria-hidden="true" /> : <Mail className="size-5" aria-hidden="true" />}
                {l.contact_kind === "whatsapp" ? "Chamar no WhatsApp" : "Enviar e-mail"}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
