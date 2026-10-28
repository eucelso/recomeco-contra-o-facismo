"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { setJobStatus } from "@/app/contratante/actions";
import { Badge } from "@/components/ui/badge";

const LABEL = { draft: "Rascunho", active: "Ativa", closed: "Encerrada" } as const;

export function JobStatusMenu({ id, status, canPublish }: { id: string; status: "draft" | "active" | "closed"; canPublish: boolean }) {
  const [pending, start] = useTransition();
  const run = (s: "draft" | "active" | "closed") =>
    start(async () => {
      const r = await setJobStatus(id, s);
      if (!r.ok) toast.error(r.error);
      else toast.success(s === "active" ? "Vaga publicada." : s === "closed" ? "Vaga encerrada." : "Vaga virou rascunho.");
    });

  return (
    <div className="flex shrink-0 items-center gap-2">
      <Badge variant={status === "active" ? "success" : "dashed"}>{LABEL[status]}</Badge>
      {status !== "active" && canPublish && (
        <button type="button" disabled={pending} onClick={() => run("active")} className="h-11 px-2 text-[13px] font-black uppercase underline">
          Publicar
        </button>
      )}
      {status === "active" && (
        <button type="button" disabled={pending} onClick={() => run("closed")} className="h-11 px-2 text-[13px] font-black uppercase underline">
          Encerrar
        </button>
      )}
    </div>
  );
}
