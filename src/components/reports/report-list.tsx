"use client";

import { useMemo, useState } from "react";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import { flagReport } from "@/app/(site)/relatos/actions";
import { Badge } from "@/components/ui/badge";
import { REPORT_TOPICS, STATES } from "@/lib/constants";
import type { ReportPublic } from "@/lib/types";

const monthFmt = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });

export function ReportList({ reports }: { reports: ReportPublic[] }) {
  const [uf, setUf] = useState("");
  const [topic, setTopic] = useState("");
  const [flagged, setFlagged] = useState<Set<string>>(new Set());

  const list = useMemo(() => reports.filter((r) => (!uf || r.state === uf) && (!topic || r.topic === topic)), [reports, uf, topic]);

  async function flag(id: string) {
    const r = await flagReport(id);
    if (r.ok) {
      setFlagged((s) => new Set(s).add(id));
      toast.success("Obrigado. A equipe vai revisar este relato.");
    } else toast.error("Não deu para enviar agora.");
  }

  const field = "h-12 w-full border-3 border-foreground bg-card px-3 text-sm font-bold";
  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3 sm:grid-cols-2">
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
          Tipo
          <select value={topic} onChange={(e) => setTopic(e.target.value)} className={field}>
            <option value="">Todos</option>
            {REPORT_TOPICS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="text-sm font-semibold" aria-live="polite">
        {list.length} {list.length === 1 ? "relato" : "relatos"}
      </p>
      {list.length === 0 ? (
        <p className="border-3 border-dashed border-foreground p-6 text-center font-semibold">Nenhum relato com esse filtro ainda.</p>
      ) : (
        <ul className="flex flex-col gap-4 pr-1.5">
          {list.map((r) => (
            <li key={r.id} className="flex flex-col gap-3 border-3 border-foreground bg-card p-4 shadow-hard">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="accent">{r.topic}</Badge>
                <span className="text-xs font-bold">
                  {[r.city, r.state].filter(Boolean).join(", ")}
                  {(r.city || r.state) && r.month ? " · " : ""}
                  {r.month ? monthFmt.format(new Date(r.month)) : ""}
                </span>
              </div>
              <p className="whitespace-pre-line text-[15px] leading-relaxed">{r.story}</p>
              <button
                type="button"
                onClick={() => flag(r.id)}
                disabled={flagged.has(r.id)}
                className="inline-flex items-center gap-1.5 self-start text-xs font-bold underline disabled:no-underline disabled:opacity-60"
              >
                <Flag className="size-3.5" aria-hidden="true" /> {flagged.has(r.id) ? "Denunciado" : "Denunciar este relato"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
