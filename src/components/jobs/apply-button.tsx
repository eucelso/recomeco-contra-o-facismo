"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { applyToJob } from "@/app/vagas/actions";
import { Button } from "@/components/ui/button";

export function ApplyButton({ jobId, applied }: { jobId: string; applied: boolean }) {
  const router = useRouter();
  const [done, setDone] = useState(applied);
  const [pending, start] = useTransition();
  if (done)
    return (
      <span className="inline-flex h-11 items-center gap-1.5 border-3 border-foreground bg-success px-3 text-[13px] font-black uppercase text-success-foreground">
        <Check className="size-4" strokeWidth={3.4} aria-hidden="true" /> Interesse enviado
      </span>
    );
  return (
    <Button
      size="sm"
      className="shadow-none"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await applyToJob(jobId);
          if (r.needLogin) return router.push(`/entrar?modo=cadastro&tipo=candidate&next=/vagas`);
          if (r.needProfile) return router.push("/cadastro/candidato");
          if (!r.ok) return void toast.error(r.error);
          setDone(true);
          toast.success("Interesse enviado. A empresa vê seu perfil anônimo.");
        })
      }
    >
      {pending ? "Enviando…" : "Tenho interesse"}
    </Button>
  );
}
