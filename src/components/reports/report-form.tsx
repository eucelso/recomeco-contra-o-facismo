"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { submitReport } from "@/app/(site)/relatos/novo/actions";
import { ChipGroup } from "@/components/forms/chip-group";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { REPORT_TOPICS, STATES } from "@/lib/constants";
import { reportSchema } from "@/lib/validation";

export function ReportForm() {
  const [topic, setTopic] = useState<string[]>([]);
  const [story, setStory] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [website, setWebsite] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = reportSchema.safeParse({ topic: topic[0], story, state: state || undefined, city: city || undefined, website });
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Confira os campos.");
    setError(null);
    start(async () => {
      const r = await submitReport(parsed.data);
      if (!r.ok) return setError(r.error);
      setDone(true);
    });
  };

  if (done)
    return (
      <div className="flex flex-col gap-4 border-3 border-foreground bg-card p-6 shadow-hard">
        <span className="flex size-12 items-center justify-center border-3 border-foreground bg-success text-success-foreground">
          <Check className="size-6" strokeWidth={3.6} aria-hidden="true" />
        </span>
        <h2 className="font-display text-3xl uppercase leading-none">Relato recebido</h2>
        <p className="text-base font-medium leading-relaxed">
          Obrigado por contar. A nossa equipe vai ler e, se estiver de acordo com as regras, publicar sem identificar você. Não guardamos seu nome, e-mail
          nem IP, então não conseguimos avisar quando for publicado.
        </p>
        <Button asChild variant="outline" className="self-start">
          <Link href="/relatos">Ver relatos publicados</Link>
        </Button>
      </div>
    );

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <span id="topic-label" className="text-sm font-black uppercase">
          O que aconteceu?
        </span>
        <ChipGroup options={REPORT_TOPICS} value={topic as (typeof REPORT_TOPICS)[number][]} onChange={setTopic} single ariaLabelledBy="topic-label" />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="story" className="text-sm font-black uppercase">
          Conte com suas palavras
        </label>
        <Textarea
          id="story"
          rows={7}
          className="min-h-[170px]"
          value={story}
          onChange={(e) => setStory(e.target.value)}
          placeholder="Ex.: Meu chefe disse que, se o candidato dele perdesse, haveria demissões."
        />
        <p className="text-xs font-semibold">
          Conte só o que você viveu. Não cite nomes de pessoas, de empresas nem de lugares que identifiquem alguém, e não coloque links, e-mails ou telefones. ({story.length}/1500)
        </p>
      </div>
      <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="uf" className="text-sm font-black uppercase">
            Estado
          </label>
          <select id="uf" value={state} onChange={(e) => setState(e.target.value)} className="h-12 border-3 border-foreground bg-card px-3 text-sm font-bold">
            <option value="">—</option>
            {STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="city" className="text-sm font-black uppercase">
            Cidade <span className="font-semibold normal-case">(opcional)</span>
          </label>
          <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} maxLength={80} />
        </div>
      </div>

      {/* Armadilha para robôs: escondida de quem usa o site */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Não preencha
          <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </label>
      </div>

      {error && (
        <Alert variant="destructive">
          <p role="alert">{error}</p>
        </Alert>
      )}
      <Alert variant="ink">
        <p>Não pedimos nome, e-mail nem telefone e não guardamos seu IP. A equipe revisa o texto antes de publicar e pode retirar trechos que identifiquem alguém.</p>
      </Alert>
      <div className="pr-1.5">
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "Enviando…" : "Enviar relato anônimo"}
        </Button>
      </div>
    </form>
  );
}
