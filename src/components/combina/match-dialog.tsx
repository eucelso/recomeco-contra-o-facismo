"use client";

import Link from "next/link";
import { Send } from "lucide-react";
import { Fist } from "@/components/brand/fist";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { initials } from "@/lib/utils";

export function MatchDialog({
  open,
  onOpenChange,
  meName,
  peerName,
  contactId,
  note,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  meName: string;
  peerName: string;
  contactId?: string;
  note: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[560px] border-[4px] bg-rays-red p-7 text-center text-white sm:p-9 [&>button]:text-white">
        <DialogTitle className="text-shadow-hard text-[76px] leading-[0.88] sm:text-[96px]">DEU LIGA!</DialogTitle>
        <div className="flex items-center justify-center gap-3" aria-hidden="true">
          <span className="flex size-[84px] -rotate-[4deg] items-center justify-center border-[4px] border-foreground bg-accent font-display text-3xl text-accent-foreground shadow-hard">
            {initials(meName) || "EU"}
          </span>
          <span className="flex size-14 items-center justify-center rounded-full border-3 border-foreground bg-[#F2E8D5]">
            <Fist className="h-9 w-7" fill="#C8102E" />
          </span>
          <span className="flex size-[84px] rotate-[4deg] items-center justify-center border-[4px] border-foreground bg-success font-display text-3xl text-success-foreground shadow-hard">
            {initials(peerName) || "?"}
          </span>
        </div>
        <DialogDescription className="mx-auto max-w-sm bg-[#141210] px-3.5 py-2.5 text-[15px] font-semibold text-[#F2E8D5]">
          Você e <strong>{peerName}</strong> têm interesse um no outro. {note}
        </DialogDescription>
        <div className="flex flex-col justify-center gap-3 pr-1.5 sm:flex-row">
          {contactId && (
            <Link
              href={`/mensagens/${contactId}`}
              className="flex h-14 items-center justify-center gap-2 border-3 border-foreground bg-accent px-6 font-black uppercase text-accent-foreground shadow-hard"
            >
              <Send className="size-5" strokeWidth={2.8} aria-hidden="true" /> Mandar mensagem
            </Link>
          )}
          <DialogClose className="h-14 border-3 border-[#F2E8D5] px-5 font-black uppercase text-white">Continuar combinando</DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
