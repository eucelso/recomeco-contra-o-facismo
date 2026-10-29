"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { setAccepting } from "@/app/cadastro/advogado/actions";
import { Switch } from "@/components/ui/switch";

export function AcceptingSwitch({ initial }: { initial: boolean }) {
  const [on, setOn] = useState(initial);
  const [pending, start] = useTransition();
  return (
    <div className="flex items-center justify-between gap-4 border-3 border-foreground bg-card p-3.5">
      <label htmlFor="accepting" className="text-[15px] font-bold leading-snug">
        Estou aceitando novos casos
        <span className="block text-[13px] font-medium">Desligue para sumir da lista sem perder a verificação.</span>
      </label>
      <Switch
        id="accepting"
        checked={on}
        disabled={pending}
        onCheckedChange={(v) => {
          setOn(v);
          start(async () => {
            const r = await setAccepting(v);
            if (!r.ok) {
              setOn(!v);
              toast.error("Não deu para salvar.");
            }
          });
        }}
      />
    </div>
  );
}
