"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { shareDossier } from "@/app/painel/dossie/compartilhar/actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { SHARE_DAYS } from "@/lib/dossier-share";

type Lawyer = { id: string; full_name: string; oab: string; place: string };

export function ShareConfirm({ lawyer, alreadyShared, facts, hasNotes }: { lawyer: Lawyer; alreadyShared: boolean; facts: number; hasNotes: boolean }) {
  const router = useRouter();
  const [kind, setKind] = useState<"" | "whatsapp" | "email">("");
  const [value, setValue] = useState("");
  const [agree, setAgree] = useState(false);
  const [pending, start] = useTransition();

  if (alreadyShared)
    return (
      <div className="flex flex-col gap-3 border-3 border-foreground bg-card p-4">
        <p className="font-semibold">Você já compartilhou o dossiê com {lawyer.full_name}. Para enviar uma cópia nova, revogue o compartilhamento atual em Meu dossiê.</p>
        <Button asChild size="sm" className="self-start shadow-none">
          <Link href="/painel/dossie">Ver compartilhamentos</Link>
        </Button>
      </div>
    );

  const submit = () =>
    start(async () => {
      const r = await shareDossier(lawyer.id, kind, value);
      if (!r.ok) return void toast.error(r.error);
      toast.success("Dossiê compartilhado.");
      router.push("/painel/dossie");
    });

  const field = "h-12 w-full border-3 border-foreground bg-card px-3 text-sm font-bold";
  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-1 border-3 border-foreground bg-card p-4 shadow-hard-sm">
        <strong className="text-lg font-black">{lawyer.full_name}</strong>
        <span className="text-sm font-semibold">
          {lawyer.oab} · {lawyer.place}
        </span>
      </section>

      <section className="flex flex-col gap-2 border-3 border-foreground bg-accent p-4 text-accent-foreground">
        <h2 className="font-display text-2xl uppercase leading-none">O que será enviado</h2>
        <ul className="list-disc pl-5 text-sm font-semibold">
          <li>
            {facts} {facts === 1 ? "fato" : "fatos"} da sua linha do tempo{hasNotes ? " e o seu texto" : ""}, <strong>como estão agora</strong> (uma cópia: o que você editar depois não chega a ele).
          </li>
          <li>Seu nome completo e, se você informar abaixo, um contato.</li>
          <li>Só este advogado vê. Nem empresas nem a equipe do Recomeço.</li>
          <li>O acesso vale {SHARE_DAYS} dias. Você pode revogar quando quiser, e a cópia é apagada.</li>
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-[15px] font-black uppercase">Como ele pode falar com você? (opcional)</h2>
        <p className="text-sm font-semibold">Sem contato, ele só vê o dossiê e não consegue responder. Você pode procurá-lo pelo contato dele em Advogados.</p>
        <div className="grid gap-3 sm:grid-cols-[180px_minmax(0,1fr)]">
          <select aria-label="Tipo de contato" value={kind} onChange={(e) => setKind(e.target.value as typeof kind)} className={field}>
            <option value="">Não informar</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="email">E-mail</option>
          </select>
          <Input
            aria-label="Contato"
            disabled={!kind}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            inputMode={kind === "email" ? "email" : "tel"}
            placeholder={kind === "email" ? "voce@exemplo.com" : kind === "whatsapp" ? "(81) 91234-5678" : ""}
            maxLength={120}
          />
        </div>
      </section>

      <label className="flex items-start gap-3 text-sm font-semibold leading-relaxed">
        <Checkbox checked={agree} onCheckedChange={(v) => setAgree(v === true)} className="mt-0.5" />
        <span>Entendo que {lawyer.full_name} vai ler o que escrevi, que o Recomeço não é parte da conversa e que isso não substitui contratar um advogado.</span>
      </label>

      <div className="flex gap-3">
        <Button asChild variant="outline" className="flex-1 shadow-none">
          <Link href="/painel/dossie/compartilhar">Voltar</Link>
        </Button>
        <Button className="flex-1" disabled={!agree || pending} onClick={submit}>
          {pending ? "Enviando…" : "Compartilhar"}
        </Button>
      </div>
    </div>
  );
}
