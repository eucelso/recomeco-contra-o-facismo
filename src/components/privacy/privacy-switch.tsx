"use client";

import { useId, useState, useTransition } from "react";
import { toast } from "sonner";
import { setPrivacy } from "@/app/privacidade/actions";
import { Switch } from "@/components/ui/switch";

export function PrivacySwitch({
  field,
  initial,
  title,
  hint,
}: {
  field: "anonymous" | "show_region_only" | "invites_paused";
  initial: boolean;
  title: string;
  hint: string;
}) {
  const id = useId();
  const [on, setOn] = useState(initial);
  const [pending, start] = useTransition();
  return (
    <div className="flex items-center gap-3 border-b-2 border-foreground p-4">
      <div className="flex-1">
        <label htmlFor={id} className="block text-[15px] font-extrabold">
          {title}
        </label>
        <span className="text-[13px] font-medium">{hint}</span>
      </div>
      <Switch
        id={id}
        checked={on}
        disabled={pending}
        onCheckedChange={(v) => {
          setOn(v);
          start(async () => {
            const r = await setPrivacy(field, v);
            if (!r.ok) {
              setOn(!v);
              toast.error("Não deu para salvar. Tente de novo.");
            }
          });
        }}
      />
    </div>
  );
}
