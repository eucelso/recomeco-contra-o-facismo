"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { reviewBusiness, reviewEmployer, reviewLawyer } from "@/app/admin/verificacoes/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ReviewButtons({ id, kind = "employer" }: { id: string; kind?: "employer" | "lawyer" | "business" }) {
  const [reason, setReason] = useState("");
  const [pending, start] = useTransition();
  const run = (approve: boolean) =>
    start(async () => {
      const r = await (kind === "lawyer" ? reviewLawyer : kind === "business" ? reviewBusiness : reviewEmployer)(id, approve, reason);
      if (!r.ok) toast.error(r.error);
      else toast.success(approve ? kind === "lawyer" ? "Aprovado. Já aparece na lista pública." : kind === "business" ? "Aprovado. Já aparece em Apoie." : "Aprovada. O selo já aparece." : kind === "lawyer" ? "Reprovado. O advogado verá o motivo." : kind === "business" ? "Reprovado. O dono verá o motivo." : "Reprovada. O contratante verá o motivo.");
    });
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={`reason-${id}`} className="sr-only">
        Motivo da reprovação
      </label>
      <Input id={`reason-${id}`} placeholder="Motivo, se reprovar (a pessoa vê)" value={reason} onChange={(e) => setReason(e.target.value)} />
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1 shadow-none" disabled={pending} onClick={() => run(false)}>
          Reprovar
        </Button>
        <Button size="sm" className="flex-1 shadow-none" disabled={pending} onClick={() => run(true)}>
          Aprovar
        </Button>
      </div>
    </div>
  );
}
