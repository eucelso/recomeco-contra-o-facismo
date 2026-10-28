"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { inviteCandidate } from "@/app/contratante/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function InviteDialog({ candidateId, code, jobs }: { candidateId: string; code: string; jobs: { id: string; title: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [jobId, setJobId] = useState<string | undefined>(jobs[0]?.id);
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();

  const send = () =>
    start(async () => {
      const r = await inviteCandidate(candidateId, jobId ?? null, message);
      if (!r.ok) return void toast.error(r.error);
      toast.success("Convite enviado.");
      setOpen(false);
      router.refresh();
    });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg">
          <Send strokeWidth={2.6} aria-hidden="true" /> Enviar convite de contato
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convidar #{code}</DialogTitle>
          <DialogDescription>Se a pessoa aceitar, vocês podem conversar e você vê nome e currículo.</DialogDescription>
        </DialogHeader>
        {jobs.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="invite-job">Para qual vaga?</Label>
            <Select value={jobId} onValueChange={setJobId}>
              <SelectTrigger id="invite-job">
                <SelectValue placeholder="Escolha a vaga" />
              </SelectTrigger>
              <SelectContent>
                {jobs.map((j) => (
                  <SelectItem key={j.id} value={j.id}>
                    {j.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="invite-msg">
            Mensagem <span className="font-semibold normal-case">(opcional)</span>
          </Label>
          <Textarea id="invite-msg" maxLength={600} rows={4} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Conte por que o perfil chamou sua atenção." />
          <span className="self-end text-xs">{message.length} / 600</span>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={send} disabled={pending}>
            {pending ? "Enviando…" : "Enviar convite"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
