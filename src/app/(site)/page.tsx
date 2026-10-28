import Link from "next/link";
import { ArrowRight, Camera, Lock, Scale, Send } from "lucide-react";
import { Fist } from "@/components/brand/fist";
import { PortraitMosaic } from "@/components/brand/portraits";
import { Button } from "@/components/ui/button";
import { hasSupabaseEnv } from "@/lib/auth";
import { COMMITMENT_ITEMS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";


type Stats = { active_jobs: number; hires: number; verified_employers: number; cities: number };

async function getStats(): Promise<Stats | null> {
  if (!hasSupabaseEnv()) return null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.rpc("public_stats");
    return (data as Stats) ?? null;
  } catch {
    return null;
  }
}

const fmt = (n: number | undefined) => (n == null ? "—" : n.toLocaleString("pt-BR"));

const STEPS = [
  {
    n: "01",
    title: "Crie seu perfil profissional",
    text: "Conte o que você sabe fazer e onde quer trabalhar. Uns 5 minutos pelo celular. Nada sobre política aparece no perfil.",
  },
  {
    n: "02",
    title: "Receba convites de empresas verificadas",
    text: "Só quem assinou o Compromisso de Contratação Justa e passou pela verificação vê perfis. Seu nome fica oculto até você aceitar.",
  },
  {
    n: "03",
    title: "Converse e volte a trabalhar",
    text: "Aceitou? O chat é liberado para combinar entrevista. Você pode recusar ou bloquear a qualquer momento.",
  },
];

const STORIES = [
  {
    quote:
      "Fui dispensada depois da eleição. Aqui ninguém perguntou em quem votei — perguntaram o que eu sei fazer. Em três semanas eu estava trabalhando.",
    name: "Márcia, 41",
    role: "Auxiliar administrativa · Goiânia, GO",
    initial: "M",
    avatar: "bg-accent text-accent-foreground",
    rotate: "-rotate-[0.8deg]",
  },
  {
    quote:
      "O guia de direitos me ensinou a guardar as provas e procurar o MPT. Enquanto isso, entrei numa cooperativa perto de casa.",
    name: "José, 52",
    role: "Operador de máquinas · Chapecó, SC",
    initial: "J",
    avatar: "bg-primary text-primary-foreground",
    rotate: "rotate-[0.6deg]",
  },
  {
    quote:
      "Tenho um restaurante pequeno e queria contratar com responsabilidade. Encontrei gente experiente, com um processo simples.",
    name: "Ana, 36",
    role: "Dona de restaurante · Belém, PA",
    initial: "A",
    avatar: "bg-secondary text-secondary-foreground",
    rotate: "-rotate-[0.4deg]",
  },
];

export default async function LandingPage() {
  const stats = await getStats();

  return (
    <>
      {/* Hero */}
      <section className="container grid grid-cols-1 items-center gap-14 py-10 sm:py-16 lg:grid-cols-[1.05fr_1fr] lg:py-20">
        <div className="flex min-w-0 flex-col gap-6 sm:gap-7">
          <span className="inline-flex items-center gap-2 self-start bg-secondary px-3.5 py-2 text-xs font-black uppercase tracking-[0.1em] text-accent sm:text-[13px]">
            <Lock className="size-4" strokeWidth={2.6} aria-hidden="true" />
            Gratuito e sigiloso para trabalhadores
          </span>
          <h1 className="font-display text-[56px] uppercase leading-[0.93] sm:text-[84px] lg:text-[80px] xl:text-[96px]">
            Seu voto é seu.
            <br />
            Seu trabalho <span className="highlight-accent text-primary">também.</span>
          </h1>
          <p className="max-w-[580px] text-lg font-medium leading-relaxed sm:text-xl">
            Perseguiram você por causa do voto? Aqui você encontra quem contrata sem discriminação — e aprende a defender
            seus direitos. Ninguém solta a mão de ninguém.
          </p>
          <div className="flex flex-col gap-4 pr-1.5 sm:flex-row sm:flex-wrap">
            <Button asChild size="xl" className="h-auto min-h-16 whitespace-normal px-5 py-3 text-center text-base sm:whitespace-nowrap sm:px-7 sm:text-lg">
              <Link href="/entrar?modo=cadastro&tipo=candidate">
                Estou procurando trabalho <ArrowRight strokeWidth={3} aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="xl" variant="outline" className="px-5 text-base sm:px-7 sm:text-lg">
              <Link href="/entrar?modo=cadastro&tipo=employer">Quero contratar</Link>
            </Button>
          </div>
          <ul className="flex flex-col gap-2.5 text-[15px] font-bold sm:flex-row sm:flex-wrap sm:gap-x-6">
            {["Seu voto nunca aparece no perfil", "Empresas verificadas", "Anônimo até você aceitar"].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <span className="size-2.5 bg-primary" aria-hidden="true" />
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative">
          <PortraitMosaic />
          <div
            aria-hidden="true"
            className="absolute -right-2 -top-8 hidden size-28 rotate-[8deg] items-center justify-center rounded-full border-3 border-foreground bg-primary shadow-hard-sm sm:flex"
          >
            <Fist className="h-[70px] w-[52px]" strokeWidth={6} />
          </div>
        </div>
      </section>

      {/* Slogan */}
      <div
        aria-hidden="true"
        className="overflow-hidden whitespace-nowrap border-y-3 border-foreground bg-[#141210] py-3 font-display text-[22px] tracking-wider text-[#F2E8D5] sm:py-4 sm:text-3xl"
      >
        NINGUÉM SOLTA A MÃO DE NINGUÉM <span className="text-accent">★</span> TRABALHO DIGNO{" "}
        <span className="text-[#E8344E]">★</span> ANTIFASCISTA <span className="text-accent">★</span> VOTO LIVRE{" "}
        <span className="text-[#E8344E]">★</span> NINGUÉM SOLTA A MÃO DE NINGUÉM <span className="text-accent">★</span> TRABALHO
        DIGNO
      </div>

      {/* Como funciona */}
      <section id="como-funciona" className="container flex scroll-mt-6 flex-col gap-10 py-14 sm:py-24">
        <div className="flex max-w-3xl flex-col gap-3">
          <span className="text-sm font-black uppercase tracking-[0.12em] text-primary">Como funciona</span>
          <h2 className="font-display text-[44px] uppercase leading-[0.98] sm:text-[64px]">Três passos para recomeçar</h2>
        </div>
        <ol className="grid gap-5 pr-1.5 md:grid-cols-3 md:gap-6">
          {STEPS.map((s) => (
            <li key={s.n} className="flex gap-4 border-3 border-foreground bg-card p-5 shadow-hard md:flex-col md:p-7">
              <span className="font-display text-[52px] leading-[0.9] text-primary md:text-[88px]">{s.n}</span>
              <div className="flex flex-col gap-2">
                <h3 className="text-lg font-black uppercase leading-tight md:text-2xl">{s.title}</h3>
                <p className="text-[15px] leading-relaxed md:text-[17px]">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Números */}
      <section className="border-y-3 border-foreground bg-primary text-primary-foreground">
        <div className="container flex flex-col gap-6 py-10 sm:py-16">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-6 lg:grid-cols-4">
            {[
              { v: stats?.active_jobs, l: "vagas abertas agora" },
              { v: stats?.hires, l: "pessoas contratadas" },
              { v: stats?.verified_employers, l: "empresas comprometidas" },
              { v: stats?.cities, l: "cidades com vagas" },
            ].map((s) => (
              <div key={s.l} className="flex flex-col-reverse gap-1 border-l-[6px] border-accent pl-3 sm:pl-5">
                <dt className="text-[13px] font-extrabold uppercase tracking-wide sm:text-[17px]">{s.l}</dt>
                <dd className="font-display text-[44px] leading-none sm:text-[72px]">{fmt(s.v)}</dd>
              </div>
            ))}
          </dl>
          <p className="text-sm font-semibold">Números atualizados automaticamente com as vagas e contratações confirmadas.</p>
        </div>
      </section>

      {/* Histórias */}
      <section className="container flex flex-col gap-8 py-14 sm:gap-10 sm:py-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-display text-[44px] uppercase leading-[0.98] sm:text-[64px]">Quem recomeçou</h2>
          <span className="border-2 border-foreground px-3 py-1.5 text-xs font-extrabold uppercase tracking-wider">
            Depoimentos ilustrativos
          </span>
        </div>
        <div className="grid gap-7 pr-1.5 md:grid-cols-3">
          {STORIES.map((s) => (
            <figure key={s.name} className={`flex flex-col gap-5 border-3 border-foreground bg-card p-6 shadow-hard sm:p-7 ${s.rotate}`}>
              <span aria-hidden="true" className="font-display text-7xl leading-[0.6] text-primary">
                “
              </span>
              <blockquote className="text-[17px] font-semibold leading-relaxed sm:text-[19px]">{s.quote}</blockquote>
              <figcaption className="mt-auto flex items-center gap-3 border-t-2 border-foreground pt-4">
                <span className={`flex size-11 items-center justify-center border-3 border-foreground font-display text-xl ${s.avatar}`}>
                  {s.initial}
                </span>
                <span className="flex flex-col">
                  <strong className="text-[15px] font-black uppercase">{s.name}</strong>
                  <span className="text-sm font-semibold text-muted-foreground">{s.role}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Direitos */}
      <section className="bg-[#141210] text-[#F2E8D5]">
        <div className="container grid grid-cols-1 gap-10 py-14 sm:py-24 lg:grid-cols-2 lg:gap-12">
          <div className="flex flex-col gap-5">
            <span className="text-sm font-black uppercase tracking-[0.12em] text-[#E8A317]">Conheça seus direitos</span>
            <h2 className="font-display text-[44px] uppercase leading-[0.98] sm:text-[64px]">Ninguém pode te punir pelo seu voto.</h2>
            <p className="text-base leading-relaxed text-[#E6DAC2] sm:text-[19px]">
              Pressionar funcionários a votar em alguém, ameaçar ou demitir por posição política é assédio eleitoral — e é
              ilegal no Brasil. Você pode denunciar e buscar reparação.
            </p>
            <Link
              href="/direitos"
              className="inline-flex h-[60px] items-center justify-center gap-2.5 self-stretch border-3 border-[#F2E8D5] bg-[#E8A317] px-6 text-[17px] font-black uppercase text-[#141210] shadow-[6px_6px_0_0_#C8102E] sm:self-start"
            >
              Ler o guia completo <ArrowRight className="size-5" strokeWidth={3} aria-hidden="true" />
            </Link>
          </div>
          <ul className="flex flex-col gap-4">
            {[
              { Icon: Scale, t: "É contra a lei", d: "A Constituição garante que ninguém perde direitos por convicção política. Coagir o voto de alguém é crime eleitoral." },
              { Icon: Camera, t: "Guarde as provas", d: "Prints, áudios, e-mails, nomes de testemunhas e datas. Tudo ajuda." },
              { Icon: Send, t: "Denuncie nos canais oficiais", d: "Ministério Público do Trabalho, Justiça do Trabalho, Defensoria Pública e o sindicato da sua categoria." },
            ].map(({ Icon, t, d }) => (
              <li key={t} className="flex items-start gap-4 border-3 border-[#F2E8D5] p-5">
                <Icon className="mt-0.5 size-7 shrink-0 text-[#E8344E]" strokeWidth={2.4} aria-hidden="true" />
                <div>
                  <strong className="text-lg font-black uppercase">{t}</strong>
                  <p className="mt-1.5 text-base leading-relaxed text-[#E6DAC2]">{d}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Empresas */}
      <section id="empresas" className="scroll-mt-6 border-y-3 border-foreground bg-accent text-accent-foreground">
        <div className="container grid grid-cols-1 items-center gap-10 py-14 sm:py-24 lg:grid-cols-2 lg:gap-12">
          <div className="flex flex-col gap-5">
            <span className="text-sm font-black uppercase tracking-[0.12em]">Para empresas e contratantes</span>
            <h2 className="font-display text-[44px] uppercase leading-[0.98] sm:text-[64px]">Contrate gente boa. Do lado certo da história.</h2>
            <p className="text-base font-medium leading-relaxed sm:text-[19px]">
              Pequenos negócios, empresas, cooperativas e autônomos: assine o Compromisso de Contratação Justa, passe pela
              verificação e publique vagas de graça.
            </p>
            <Button asChild size="xl" variant="secondary" className="self-stretch sm:self-start">
              <Link href="/entrar?modo=cadastro&tipo=employer">Quero contratar</Link>
            </Button>
          </div>
          <div className="mr-1.5 flex flex-col gap-4 border-3 border-foreground bg-background p-6 text-foreground shadow-hard-lg sm:p-8">
            <h3 className="font-display text-[26px] uppercase leading-tight">Compromisso de Contratação Justa</h3>
            <ul className="flex flex-col gap-3 text-base font-semibold sm:text-[17px]">
              {COMMITMENT_ITEMS.map((c) => (
                <li key={c} className="flex gap-3">
                  <span className="mt-1.5 size-3 shrink-0 bg-primary" aria-hidden="true" />
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
