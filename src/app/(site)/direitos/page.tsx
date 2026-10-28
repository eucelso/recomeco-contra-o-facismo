import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, CircleAlert } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { OFFICIAL_CHANNELS } from "@/lib/channels";

export const metadata: Metadata = {
  title: "Seus direitos",
  description: "Assédio eleitoral e demissão discriminatória: o que é, como guardar provas e onde denunciar.",
};

const HARASSMENT = [
  "Ameaçar demitir se um candidato ganhar ou perder",
  "Prometer bônus, folga ou promoção em troca de voto",
  "Obrigar a usar camiseta, adesivo ou ir a ato de campanha",
  "Pedir foto do voto na urna ou perguntar em quem você votou",
  "Humilhar, isolar ou demitir por causa da sua posição política",
];

const PROOFS = [
  ["Tire prints completos", "Mostrando data, hora, nome e número de quem enviou. Não apague a conversa original."],
  ["Salve áudios, vídeos e e-mails", "Exporte para um lugar seguro (nuvem pessoal, pendrive), fora do celular ou do e-mail da empresa."],
  ["Anote testemunhas", "Nome e contato de colegas que viram ou ouviram. Juntos é mais forte."],
  ["Guarde documentos", "Aviso de demissão, contracheques, carteira de trabalho, comunicados internos."],
  ["Escreva o que aconteceu", "Datas, lugares e frases ditas. Você pode usar o relato confidencial do app, que só você vê."],
];

const FAQ = [
  ["Posso denunciar sem me identificar?", "No Ministério Público do Trabalho, sim: você pode pedir sigilo. Para entrar com ação na Justiça do Trabalho, é preciso se identificar."],
  ["O Recomeço faz a denúncia por mim?", "Não. A gente não recebe nem publica denúncias, e não mantém listas de empresas ou pessoas. Só mostra os canais oficiais."],
  ["E se eu ainda estiver trabalhando lá?", "Guarde as provas com discrição e procure o sindicato ou o MPT. Retaliar quem denuncia também é ilegal."],
  ["Preciso de advogado?", "Para falar com o MPT, não. Para a ação trabalhista, a Defensoria Pública e o sindicato podem orientar sem custo."],
];

export default function DireitosPage() {
  return (
    <>
      <section className="border-b-3 border-foreground bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-10 sm:py-16">
          <span className="self-start bg-[#141210] px-2.5 py-1.5 text-xs font-black uppercase tracking-[0.08em] text-accent">Guia de direitos</span>
          <h1 className="text-shadow-hard font-display text-[50px] uppercase leading-[0.95] sm:text-7xl">Ninguém pode te punir pelo seu voto</h1>
          <p className="text-base font-semibold">Leitura de 4 minutos. Linguagem simples, sem juridiquês.</p>
        </div>
      </section>

      <div className="mx-auto flex max-w-3xl flex-col gap-10 px-4 py-8 sm:py-12">
        <p role="note" className="flex gap-3 border-3 border-foreground bg-accent p-4 text-sm font-bold leading-relaxed text-accent-foreground">
          <CircleAlert className="size-5 shrink-0" strokeWidth={2.6} aria-hidden="true" />
          Este guia é informativo e não substitui orientação jurídica. Para o seu caso, procure a Defensoria Pública, o sindicato ou
          um(a) advogado(a).
        </p>

        <section aria-labelledby="d1" className="flex flex-col gap-3">
          <h2 id="d1" className="flex items-baseline gap-2.5 font-display text-3xl uppercase leading-none sm:text-4xl">
            <span className="text-primary">01</span> O que é assédio eleitoral
          </h2>
          <p className="text-base leading-relaxed">
            É quando o patrão, chefe ou alguém da empresa usa o poder que tem sobre você para influenciar, controlar ou punir o seu voto.
          </p>
          <ul className="flex flex-col gap-2">
            {HARASSMENT.map((h) => (
              <li key={h} className="flex gap-2.5 border-3 border-foreground bg-card p-3 text-[15px] font-semibold">
                <span className="mt-1.5 size-2.5 shrink-0 bg-primary" aria-hidden="true" />
                {h}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="d2" className="mr-1.5 flex flex-col gap-3 border-3 border-foreground bg-[#141210] p-5 text-[#F2E8D5] shadow-hard-primary">
          <h2 id="d2" className="flex items-baseline gap-2.5 font-display text-3xl uppercase leading-none sm:text-4xl">
            <span className="text-[#E8A317]">02</span> É contra a lei
          </h2>
          <p className="text-[15px] leading-relaxed text-[#E6DAC2]">
            A <strong className="text-[#F2E8D5]">Constituição</strong> diz que ninguém pode ser privado de direitos por convicção política
            (art. 5º, VIII). Usar violência ou grave ameaça para forçar o voto de alguém é <strong className="text-[#F2E8D5]">crime eleitoral</strong>{" "}
            (Código Eleitoral). E a Justiça do Trabalho tem reconhecido a demissão por motivo político como{" "}
            <strong className="text-[#F2E8D5]">discriminatória</strong>.
          </p>
          <p className="text-[15px] leading-relaxed text-[#E6DAC2]">
            Na prática, você pode pedir <strong className="text-[#E8A317]">reintegração ao emprego</strong> ou{" "}
            <strong className="text-[#E8A317]">indenização</strong>, inclusive por dano moral.
          </p>
        </section>

        <section aria-labelledby="d3" className="flex flex-col gap-3">
          <h2 id="d3" className="flex items-baseline gap-2.5 font-display text-3xl uppercase leading-none sm:text-4xl">
            <span className="text-primary">03</span> Como guardar provas
          </h2>
          <ol className="border-3 border-foreground bg-card">
            {PROOFS.map(([t, d], i) => (
              <li key={t} className={`flex gap-3.5 p-3.5 ${i < PROOFS.length - 1 ? "border-b-2 border-foreground" : ""}`}>
                <span className="font-display text-3xl leading-none text-primary">{i + 1}</span>
                <div>
                  <strong className="block text-base font-black">{t}</strong>
                  <span className="text-sm leading-relaxed">{d}</span>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="d4" className="flex flex-col gap-3">
          <h2 id="d4" className="flex items-baseline gap-2.5 font-display text-3xl uppercase leading-none sm:text-4xl">
            <span className="text-primary">04</span> Onde denunciar
          </h2>
          <ul className="grid gap-3.5 pr-1.5 sm:grid-cols-2">
            {OFFICIAL_CHANNELS.map((c) => (
              <li key={c.name}>
                <a href={c.url} target="_blank" rel="noopener noreferrer" className="flex h-full flex-col gap-1.5 border-3 border-foreground bg-card p-4 shadow-hard">
                  <span className="flex items-start justify-between gap-2">
                    <strong className="text-[17px] font-black">{c.name}</strong>
                    <ArrowUpRight className="size-5 shrink-0" strokeWidth={2.8} aria-hidden="true" />
                  </span>
                  <span className="text-sm leading-relaxed">{c.long}</span>
                  <span className="sr-only">(abre em nova aba)</span>
                </a>
              </li>
            ))}
            <li className="flex flex-col gap-1.5 border-3 border-foreground bg-card p-4 shadow-hard">
              <strong className="text-[17px] font-black">Sindicato da sua categoria</strong>
              <span className="text-sm leading-relaxed">Pode acompanhar o caso e levar a denúncia de forma coletiva.</span>
            </li>
          </ul>
        </section>

        <section aria-labelledby="d5" className="flex flex-col gap-3">
          <h2 id="d5" className="border-b-3 border-foreground pb-1.5 text-[15px] font-black uppercase">
            Perguntas frequentes
          </h2>
          <Accordion type="single" collapsible className="flex flex-col gap-2.5">
            {FAQ.map(([q, a]) => (
              <AccordionItem key={q} value={q}>
                <AccordionTrigger>{q}</AccordionTrigger>
                <AccordionContent>{a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        <div className="mr-1.5 flex flex-col gap-3 border-3 border-foreground bg-accent p-5 text-accent-foreground shadow-hard">
          <strong className="font-display text-3xl uppercase leading-none">Enquanto isso, bora recomeçar?</strong>
          <Button asChild variant="secondary" className="shadow-none">
            <Link href="/vagas">Ver vagas</Link>
          </Button>
        </div>
      </div>
    </>
  );
}
