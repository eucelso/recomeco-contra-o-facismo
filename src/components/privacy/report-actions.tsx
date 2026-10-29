"use client";

import { useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { deleteReport } from "@/app/privacidade/actions";

export function ReportActions({ hasReport }: { hasReport: boolean }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex gap-2">
      <Link href="/painel/dossie" className="flex h-11 flex-1 items-center justify-center border-2 border-[#F2E8D5] text-[13px] font-black uppercase">
        {hasReport ? "Abrir dossiê" : "Começar dossiê"}
      </Link>
      {hasReport && (
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              if (!window.confirm("Apagar o dossiê inteiro (fatos e texto) para sempre?")) return;
              const r = await deleteReport();
              if (r.ok) toast.success("Dossiê apagado.");
              else toast.error("Não deu para apagar agora.");
            })
          }
          className="h-11 flex-1 border-2 border-[#F2E8D5] text-[13px] font-black uppercase"
        >
          Apagar dossiê
        </button>
      )}
    </div>
  );
}
