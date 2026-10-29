"use client";

import { useMemo, useState } from "react";
import { AtSign, Clock, Globe, MapPin, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BUSINESS_CATEGORIES, STATES } from "@/lib/constants";
import type { BusinessPublic } from "@/lib/types";

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function waHref(digits: string) {
  return `https://wa.me/${digits.startsWith("55") ? digits : `55${digits}`}`;
}

const linkCls = "inline-flex h-11 items-center gap-2 border-3 border-foreground bg-card px-3 text-sm font-black uppercase shadow-hard-sm";

export function BusinessDirectory({ businesses }: { businesses: BusinessPublic[] }) {
  const [uf, setUf] = useState("");
  const [city, setCity] = useState("");
  const [cat, setCat] = useState("");

  const list = useMemo(() => {
    const c = norm(city.trim());
    return businesses.filter((b) => (!uf || b.state === uf) && (!cat || b.category === cat) && (!c || norm(b.city).includes(c)));
  }, [businesses, uf, city, cat]);

  const field = "h-12 w-full border-3 border-foreground bg-card px-3 text-sm font-bold";
  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs font-black uppercase">
          Estado
          <select value={uf} onChange={(e) => setUf(e.target.value)} className={field}>
            <option value="">Todos</option>
            {STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-black uppercase">
          Cidade
          <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Digite a cidade" className={field} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-black uppercase">
          Categoria
          <select value={cat} onChange={(e) => setCat(e.target.value)} className={field}>
            <option value="">Todas</option>
            {BUSINESS_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="text-sm font-semibold" aria-live="polite">
        {list.length} {list.length === 1 ? "negócio" : "negócios"}
      </p>

      {list.length === 0 ? (
        <p className="border-3 border-dashed border-foreground p-6 text-center font-semibold">Nenhum negócio com esse filtro ainda. Tente outra cidade ou categoria.</p>
      ) : (
        <ul className="flex flex-col gap-4 pr-1.5">
          {list.map((b) => (
            <li key={b.id} className="flex flex-col gap-3 border-3 border-foreground bg-card p-4 shadow-hard">
              <div className="flex flex-col gap-1.5">
                <strong className="text-lg font-black">{b.display_name}</strong>
                <Badge variant="accent" className="self-start">
                  {b.category}
                </Badge>
              </div>
              <p className="flex items-start gap-2 text-sm font-semibold">
                <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>
                  {[b.address, b.neighborhood, `${b.city}, ${b.state}`].filter(Boolean).join(" · ")}
                </span>
              </p>
              {b.hours && (
                <p className="flex items-start gap-2 text-sm font-semibold">
                  <Clock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  {b.hours}
                </p>
              )}
              <p className="border-l-[5px] border-accent pl-3 text-[15px] leading-relaxed">{b.story}</p>
              <div className="flex flex-wrap gap-2">
                {b.whatsapp && (
                  <a href={waHref(b.whatsapp)} target="_blank" rel="noopener noreferrer" className={linkCls}>
                    <MessageCircle className="size-5" aria-hidden="true" /> WhatsApp
                  </a>
                )}
                {b.instagram && (
                  <a href={`https://instagram.com/${b.instagram}`} target="_blank" rel="noopener noreferrer" className={linkCls}>
                    <AtSign className="size-5" aria-hidden="true" /> @{b.instagram}
                  </a>
                )}
                {b.website && (
                  <a href={b.website} target="_blank" rel="noopener noreferrer nofollow" className={linkCls}>
                    <Globe className="size-5" aria-hidden="true" /> Site
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
