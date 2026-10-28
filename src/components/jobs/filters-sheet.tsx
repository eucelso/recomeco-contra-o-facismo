"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { filterHref, type JobFilters } from "@/components/jobs/filters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AREAS, CONTRACT_TYPES, STATES } from "@/lib/constants";

const selectCls = "h-[54px] w-full border-3 border-foreground bg-white px-3 text-base text-[#141210]";

export function FiltersSheet({ current }: { current: JobFilters }) {
  const router = useRouter();
  const [f, setF] = useState<JobFilters>(current);
  const count = [current.area, current.uf, current.cidade, current.contrato].filter(Boolean).length;

  return (
    <Sheet>
      <SheetTrigger className="flex h-[54px] shrink-0 items-center gap-1.5 border-3 border-foreground bg-secondary px-3 text-sm font-black uppercase text-secondary-foreground">
        <SlidersHorizontal className="size-[18px]" strokeWidth={2.6} aria-hidden="true" />
        Filtros{count ? ` (${count})` : ""}
      </SheetTrigger>
      <SheetContent side="bottom" className="mx-auto max-w-xl">
        <SheetTitle>Filtros</SheetTitle>
        <SheetDescription className="sr-only">Refine as vagas por lugar, área e contrato</SheetDescription>
        <div className="grid grid-cols-[minmax(0,1fr)_110px] gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="f-cidade">Cidade</Label>
            <Input id="f-cidade" value={f.cidade ?? ""} onChange={(e) => setF({ ...f, cidade: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="f-uf">Estado</Label>
            <select id="f-uf" className={selectCls} value={f.uf ?? ""} onChange={(e) => setF({ ...f, uf: e.target.value || undefined })}>
              <option value="">Todos</option>
              {STATES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="f-area">Área</Label>
          <select id="f-area" className={selectCls} value={f.area ?? ""} onChange={(e) => setF({ ...f, area: e.target.value || undefined })}>
            <option value="">Todas</option>
            {AREAS.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="f-ct">Contrato</Label>
          <select id="f-ct" className={selectCls} value={f.contrato ?? ""} onChange={(e) => setF({ ...f, contrato: e.target.value || undefined })}>
            <option value="">Todos</option>
            {Object.entries(CONTRACT_TYPES).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-3 pr-1.5 pt-2">
          <SheetClose asChild>
            <Button variant="outline" className="flex-1" onClick={() => router.push(filterHref({ q: current.q, modalidade: current.modalidade }, {}))}>
              Limpar
            </Button>
          </SheetClose>
          <SheetClose asChild>
            <Button className="flex-[2]" onClick={() => router.push(filterHref(current, { ...f, cidade: f.cidade?.trim() || undefined }))}>
              Ver vagas
            </Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}
