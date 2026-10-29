"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { InitialsBox } from "@/components/brand/initials-box";
import { VerifiedBadge } from "@/components/employer/verified-badge";
import { STATES } from "@/lib/constants";
import type { EmployerPublic } from "@/lib/types";

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export type EmployerRow = EmployerPublic & { jobs: number };

export function EmployerDirectory({ employers }: { employers: EmployerRow[] }) {
  const [q, setQ] = useState("");
  const [uf, setUf] = useState("");

  const list = useMemo(() => {
    const n = norm(q.trim());
    return employers.filter((e) => (!uf || e.state === uf) && (!n || norm(e.display_name).includes(n) || norm(e.sector).includes(n) || norm(e.city).includes(n)));
  }, [employers, q, uf]);

  const field = "h-12 w-full border-3 border-foreground bg-card px-3 text-sm font-bold";
  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_160px]">
        <label className="flex flex-col gap-1 text-xs font-black uppercase">
          Buscar empresa
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nome, setor ou cidade" className={field} />
        </label>
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
      </div>

      <p className="text-sm font-semibold" aria-live="polite">
        {list.length} {list.length === 1 ? "empresa" : "empresas"}
      </p>

      {list.length === 0 ? (
        <p className="border-3 border-dashed border-foreground p-6 text-center font-semibold">Nenhuma empresa com esse filtro ainda.</p>
      ) : (
        <ul className="flex flex-col gap-4 pr-1.5">
          {list.map((e) => (
            <li key={e.id}>
              <Link
                href={`/empresas/${e.id}`}
                className="flex items-center gap-3.5 border-3 border-foreground bg-card p-4 shadow-hard hover:bg-accent/10 focus-visible:ring-4 focus-visible:ring-accent"
              >
                <InitialsBox name={e.display_name} className="size-14" />
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <strong className="text-lg font-black leading-tight">{e.display_name}</strong>
                  <span className="text-sm font-semibold">{e.sector}</span>
                  <span className="inline-flex items-center gap-1 text-[13px] font-bold">
                    <MapPin className="size-3.5 text-primary" strokeWidth={2.8} aria-hidden="true" />
                    {e.city}, {e.state}
                  </span>
                  <span className="self-start">
                    <VerifiedBadge />
                  </span>
                </span>
                <span className="flex shrink-0 flex-col items-center border-2 border-foreground px-2.5 py-1.5 text-center">
                  <strong className="font-display text-2xl leading-none">{e.jobs}</strong>
                  <span className="text-[11px] font-black uppercase">{e.jobs === 1 ? "vaga" : "vagas"}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
