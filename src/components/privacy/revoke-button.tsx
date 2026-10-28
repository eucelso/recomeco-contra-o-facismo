"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { revokeAccess } from "@/app/painel/actions";

export function RevokeButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await revokeAccess(id);
          if (r.ok) toast.success("Acesso revogado. A conversa foi encerrada.");
          else toast.error(r.error);
        })
      }
      className="h-10 shrink-0 border-2 border-foreground bg-background px-2.5 text-xs font-black uppercase"
    >
      Revogar
    </button>
  );
}
