"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { moderateReport } from "@/app/admin/verificacoes/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function ReportModeration({ id, story, flagged }: { id: string; story: string; flagged: boolean }) {
  const [text, setText] = useState(story);
  const [pending, start] = useTransition();
  const run = (decision: "approve" | "reject" | "keep" | "remove", ok: string) =>
    start(async () => {
      const r = await moderateReport(id, decision, text);
      if (!r.ok) toast.error(r.error);
      else toast.success(ok);
    });

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={`story-${id}`} className="sr-only">
        Texto do relato
      </label>
      {!flagged && (
        <>
          <Textarea id={`story-${id}`} rows={6} value={text} onChange={(e) => setText(e.target.value)} />
          <p className="text-xs font-semibold">Edite o texto para tirar nomes e dados que identifiquem alguém. O que estiver aqui é o que será publicado.</p>
        </>
      )}
      <div className="flex gap-2">
        {flagged ? (
          <>
            <Button variant="outline" size="sm" className="flex-1 shadow-none" disabled={pending} onClick={() => run("keep", "Mantido. Denúncias zeradas.")}>
              Manter
            </Button>
            <Button size="sm" className="flex-1 shadow-none" disabled={pending} onClick={() => run("remove", "Removido.")}>
              Remover
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" size="sm" className="flex-1 shadow-none" disabled={pending} onClick={() => run("reject", "Rejeitado e apagado.")}>
              Rejeitar
            </Button>
            <Button size="sm" className="flex-1 shadow-none" disabled={pending} onClick={() => run("approve", "Aprovado. Já aparece em Relatos.")}>
              Aprovar
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
