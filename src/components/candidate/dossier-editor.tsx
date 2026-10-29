"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CircleAlert, FileDown, Pencil, Plus, Scale, Trash } from "lucide-react";
import { toast } from "sonner";
import { deleteFact, saveFact, saveNotes } from "@/app/painel/dossie/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { dossierGaps, sortFacts, type Fact } from "@/lib/dossier";
import { rememberReturn } from "@/lib/signup-draft";

type Draft = { happened_on: string; place: string; who: string; what: string; evidence: string; witnesses: string };
const EMPTY: Draft = { happened_on: "", place: "", who: "", what: "", evidence: "", witnesses: "" };
const day = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString("pt-BR");
const today = () => new Date().toISOString().slice(0, 10);

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-xs font-black uppercase">
      {label}
      {children}
      {hint && <span className="text-xs font-semibold normal-case">{hint}</span>}
    </label>
  );
}

function FactForm({ fact, onClose }: { fact: Fact | null; onClose: () => void }) {
  const [d, setD] = useState<Draft>(
    fact
      ? {
          happened_on: fact.happened_on ?? "",
          place: fact.place ?? "",
          who: fact.who ?? "",
          what: fact.what,
          evidence: fact.evidence ?? "",
          witnesses: fact.witnesses ?? "",
        }
      : EMPTY,
  );
  const [pending, start] = useTransition();
  const set = (k: keyof Draft) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setD((x) => ({ ...x, [k]: e.target.value }));
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const r = await saveFact(fact?.id ?? null, d);
      if (!r.ok) return void toast.error(r.error);
      toast.success(fact ? "Fato atualizado." : "Fato guardado.");
      onClose();
    });
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 border-3 border-foreground bg-card p-4 shadow-hard-sm">
      <Field label="O que aconteceu? (obrigatório)">
        <Textarea rows={4} maxLength={1000} value={d.what} onChange={set("what")} placeholder="Ex.: O gerente disse no grupo da equipe que quem votasse no candidato X seria demitido." />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Quando foi?" hint="Se não lembrar o dia exato, uma data aproximada ajuda.">
          <Input type="date" max={today()} value={d.happened_on} onChange={set("happened_on")} />
        </Field>
        <Field label="Onde?" hint="Local, grupo de mensagens, setor…">
          <Input maxLength={160} value={d.place} onChange={set("place")} />
        </Field>
      </div>
      <Field label="Quem fez ou disse?" hint="Nome e cargo, se souber.">
        <Input maxLength={160} value={d.who} onChange={set("who")} />
      </Field>
      <Field label="Provas que você tem" hint="Ex.: print da conversa, áudio, e-mail, contracheque.">
        <Input maxLength={500} value={d.evidence} onChange={set("evidence")} />
      </Field>
      <Field label="Testemunhas" hint="Quem viu ou ouviu, e como falar com a pessoa.">
        <Input maxLength={300} value={d.witnesses} onChange={set("witnesses")} />
      </Field>
      <div className="flex gap-2">
        <Button type="button" variant="outline" className="flex-1 shadow-none" disabled={pending} onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" className="flex-1" disabled={pending || !d.what.trim()}>
          {pending ? "Salvando…" : "Guardar"}
        </Button>
      </div>
    </form>
  );
}

function FactItem({ fact, onEdit }: { fact: Fact; onEdit: () => void }) {
  const [pending, start] = useTransition();
  const remove = () =>
    start(async () => {
      if (!window.confirm("Apagar este fato para sempre?")) return;
      const r = await deleteFact(fact.id);
      if (!r.ok) toast.error(r.error);
      else toast.success("Fato apagado.");
    });
  const rows: [string, string | null][] = [
    ["Onde", fact.place],
    ["Quem", fact.who],
    ["Provas", fact.evidence],
    ["Testemunhas", fact.witnesses],
  ];
  return (
    <li className="flex flex-col gap-2 border-3 border-foreground bg-card p-4 shadow-hard-sm">
      <strong className="text-sm font-black uppercase text-primary">{fact.happened_on ? day(fact.happened_on) : "Sem data"}</strong>
      <p className="whitespace-pre-wrap break-words text-[15px] font-medium leading-relaxed">{fact.what}</p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-sm">
        {rows
          .filter(([, v]) => v)
          .map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="font-black uppercase">{k}</dt>
              <dd className="break-words">{v}</dd>
            </div>
          ))}
      </dl>
      <div className="flex gap-4 pt-1">
        <button type="button" onClick={onEdit} className="flex h-11 items-center gap-1 text-sm font-extrabold underline">
          <Pencil className="size-4" aria-hidden="true" /> Editar
        </button>
        <button type="button" disabled={pending} onClick={remove} className="flex h-11 items-center gap-1 text-sm font-extrabold text-destructive underline">
          <Trash className="size-4" aria-hidden="true" /> Apagar
        </button>
      </div>
    </li>
  );
}

function Notes({ initial }: { initial: string }) {
  const [text, setText] = useState(initial);
  const [pending, start] = useTransition();
  const dirty = text.trim() !== initial.trim();
  return (
    <section aria-labelledby="notes-t" className="flex flex-col gap-3">
      <h2 id="notes-t" className="font-display text-3xl uppercase leading-none">
        Suas palavras
      </h2>
      <p className="text-sm font-semibold">Conte do seu jeito qualquer coisa que não coube nos fatos. É opcional.</p>
      <Textarea rows={6} maxLength={3000} value={text} onChange={(e) => setText(e.target.value)} aria-labelledby="notes-t" />
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold" aria-live="polite">
          {text.length} / 3000
        </span>
        <Button
          size="sm"
          disabled={pending || !dirty}
          onClick={() =>
            start(async () => {
              const r = await saveNotes(text);
              if (!r.ok) toast.error(r.error);
              else toast.success(text.trim() ? "Texto guardado." : "Texto apagado.");
            })
          }
        >
          {pending ? "Salvando…" : "Guardar texto"}
        </Button>
      </div>
    </section>
  );
}

export function DossierEditor({ facts, notes }: { facts: Fact[]; notes: string }) {
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const sorted = sortFacts(facts);
  const gaps = dossierGaps(facts);
  const warnings = [...gaps.fact, ...gaps.overall];

  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="facts-t" className="flex flex-col gap-3">
        <h2 id="facts-t" className="font-display text-3xl uppercase leading-none">
          Linha do tempo
        </h2>
        <p className="text-sm font-semibold">Um fato por acontecimento. Comece pelo que lembra melhor, a ordem se ajusta pela data.</p>

        {warnings.length > 0 && (
          <div role="note" className="flex gap-3 border-3 border-foreground bg-accent p-3 text-sm font-bold text-accent-foreground">
            <CircleAlert className="mt-0.5 size-5 shrink-0" strokeWidth={2.6} aria-hidden="true" />
            <div className="flex flex-col gap-1">
              <span>Para o dossiê ficar mais forte:</span>
              <ul className="list-disc pl-4 font-semibold">
                {warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
              <Link href="/direitos" onClick={() => rememberReturn("/painel/dossie")} className="underline">
                Ver como guardar provas e onde denunciar
              </Link>
            </div>
          </div>
        )}

        {sorted.length === 0 && editing !== "new" && (
          <p className="border-3 border-dashed border-foreground p-5 text-center font-semibold">Nenhum fato ainda. Comece pelo primeiro episódio.</p>
        )}
        <ul className="flex flex-col gap-3 pr-1.5">
          {sorted.map((f) =>
            editing === f.id ? (
              <li key={f.id}>
                <FactForm fact={f} onClose={() => setEditing(null)} />
              </li>
            ) : (
              <FactItem key={f.id} fact={f} onEdit={() => setEditing(f.id)} />
            ),
          )}
        </ul>
        {editing === "new" ? (
          <FactForm fact={null} onClose={() => setEditing(null)} />
        ) : (
          <Button variant="secondary" className="self-start shadow-none" onClick={() => setEditing("new")}>
            <Plus strokeWidth={3} aria-hidden="true" /> Adicionar fato
          </Button>
        )}
      </section>

      <Notes initial={notes} />

      {(facts.length > 0 || notes.trim()) && (
        <section aria-labelledby="pdf-t" className="flex min-w-0 flex-col gap-2 border-3 border-foreground bg-accent p-4 text-accent-foreground">
          <h2 id="pdf-t" className="font-display text-2xl uppercase leading-none">
            Baixar em PDF
          </h2>
          <p className="text-sm font-semibold">
            Gera um PDF com a linha do tempo e o seu texto. Leve ao seu advogado, à Defensoria ou ao sindicato, ou procure um advogado voluntário e envie você mesmo.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="secondary" className="h-auto min-h-12 w-full whitespace-normal py-2 text-center shadow-none sm:w-auto">
              <Link href="/dossie/imprimir">
                <FileDown strokeWidth={2.8} aria-hidden="true" /> Gerar PDF do dossiê
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto min-h-12 w-full whitespace-normal py-2 text-center shadow-none sm:w-auto">
              <Link href="/advogados">
                <Scale strokeWidth={2.8} aria-hidden="true" /> Encontrar advogado voluntário
              </Link>
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
