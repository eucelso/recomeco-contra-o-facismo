"use client";

import { useState, useTransition } from "react";
import { Trash } from "lucide-react";
import { deleteAccount } from "@/app/privacidade/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function DeleteAccountDialog() {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const ready = text.trim().toUpperCase() === "EXCLUIR";

  return (
    <Dialog onOpenChange={() => (setText(""), setError(null))}>
      <DialogTrigger className="mr-1.5 flex min-h-[60px] items-center gap-3 border-3 border-foreground bg-destructive px-3.5 py-2.5 text-left text-destructive-foreground shadow-hard-sm">
        <span className="flex size-10 shrink-0 items-center justify-center border-2 border-foreground bg-background text-destructive">
          <Trash className="size-5" strokeWidth={2.6} aria-hidden="true" />
        </span>
        <span className="flex-1">
          <strong className="block text-[15px] font-black uppercase">Excluir conta e dados</strong>
          <span className="text-[13px] font-medium">Apaga perfil, currículo, relato e mensagens.</span>
        </span>
      </DialogTrigger>
      <DialogContent tone="destructive" role="alertdialog">
        <DialogHeader>
          <DialogTitle>Excluir sua conta?</DialogTitle>
          <DialogDescription>Isso não pode ser desfeito. Apagamos de vez:</DialogDescription>
        </DialogHeader>
        <ul className="flex flex-col gap-1.5 text-sm font-bold">
          {["Perfil profissional e currículo", "Relato confidencial", "Candidaturas, convites e mensagens"].map((t) => (
            <li key={t} className="flex items-center gap-2">
              <span className="size-2 bg-destructive" aria-hidden="true" />
              {t}
            </li>
          ))}
        </ul>
        <a href="/privacidade/exportar" className="text-sm font-extrabold underline">
          Antes, quero baixar uma cópia dos meus dados
        </a>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="del-confirm">Digite EXCLUIR para confirmar</Label>
          <Input id="del-confirm" autoComplete="off" value={text} onChange={(e) => setText(e.target.value)} placeholder="EXCLUIR" />
          {error && (
            <p role="alert" className="text-[13px] font-extrabold text-destructive">
              {error}
            </p>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button
            variant="destructive"
            disabled={!ready || pending}
            onClick={() =>
              start(async () => {
                const r = await deleteAccount(text);
                if (r && !r.ok) setError(r.error);
              })
            }
          >
            {pending ? "Excluindo…" : "Excluir tudo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
