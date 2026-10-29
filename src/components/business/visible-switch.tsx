"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { setVisible } from "@/app/cadastro/negocio/actions";
import { Switch } from "@/components/ui/switch";

export function VisibleSwitch({ initial }: { initial: boolean }) {
  const [on, setOn] = useState(initial);
  const [pending, start] = useTransition();
  return (
    <div className="flex items-center justify-between gap-4 border-3 border-foreground bg-card p-3.5">
      <label htmlFor="visible" className="text-[15px] font-bold leading-snug">
        Mostrar meu negócio na lista pública
        <span className="block text-[13px] font-medium">Desligue para esconder sem perder a aprovação.</span>
      </label>
      <Switch
        id="visible"
        checked={on}
        disabled={pending}
        onCheckedChange={(v) => {
          setOn(v);
          start(async () => {
            const r = await setVisible(v);
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
