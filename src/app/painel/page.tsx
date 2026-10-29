import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Check, GalleryHorizontalEnd, Lock } from "lucide-react";
import { InviteCard } from "@/components/candidate/invite-card";
import { SectionTitle } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { APPLICATION_STATUS } from "@/lib/constants";
import { requireRole } from "@/lib/auth";

export const metadata: Metadata = { title: "Meu painel" };

export default async function PainelPage() {
  const { supabase, user } = await requireRole("candidate");
  const [{ data: me }, { data: contacts }, { data: apps }, { data: report }] = await Promise.all([
    supabase.from("candidates").select("full_name,preferred_name,completed_at,anonymous").eq("id", user.id).maybeSingle(),
    supabase.from("contact_requests").select("id,employer_id,job_id,message,status,created_at").eq("candidate_id", user.id).order("created_at", { ascending: false }),
    supabase.from("applications").select("id,status,created_at,job_id").eq("candidate_id", user.id).order("created_at", { ascending: false }),
    supabase.from("confidential_reports").select("candidate_id").eq("candidate_id", user.id).maybeSingle(),
  ]);
  if (!me?.completed_at) redirect("/cadastro/candidato");

  const employerIds = [...new Set((contacts ?? []).map((c) => c.employer_id))];
  const jobIds = [...new Set([...(contacts ?? []).map((c) => c.job_id), ...(apps ?? []).map((a) => a.job_id)].filter(Boolean) as string[])];
  const [{ data: emps }, { data: jobs }] = await Promise.all([
    employerIds.length ? supabase.from("employer_public").select("id,display_name,city,state").in("id", employerIds) : Promise.resolve({ data: [] }),
    jobIds.length ? supabase.from("job_listings").select("id,title,employer_name").in("id", jobIds) : Promise.resolve({ data: [] }),
  ]);
  const empMap = new Map((emps ?? []).map((e) => [e.id, e]));
  const jobMap = new Map((jobs ?? []).map((j) => [j.id, j]));

  const invites = (contacts ?? []).filter((c) => c.status === "pending" || c.status === "accepted");
  const pending = invites.filter((c) => c.status === "pending").length;
  const shared = (contacts ?? []).filter((c) => c.status === "accepted").length;
  const name = me.preferred_name || me.full_name.split(" ")[0];

  return (
    <div className="flex flex-col gap-7">
      <section className="-mx-4 -mt-5 flex flex-col gap-2.5 border-b-3 border-foreground bg-rays-red px-4 pb-5 pt-5 text-white md:mx-0 md:mt-0 md:border-3">
        <h1 className="text-shadow-hard font-display text-[46px] uppercase leading-[0.95]">Olá, {name}.</h1>
        <p className="self-start bg-[#141210] px-2.5 py-1.5 text-sm font-bold">
          {pending ? `Você tem ${pending} convite${pending > 1 ? "s" : ""} esperando resposta.` : "Nenhum convite novo por enquanto."}
        </p>
      </section>

      <Link
        href="/combina"
        className="mr-1.5 flex items-center gap-4 border-3 border-foreground bg-accent p-4 text-accent-foreground shadow-hard"
      >
        <GalleryHorizontalEnd className="size-10 shrink-0" strokeWidth={2.4} aria-hidden="true" />
        <span className="flex-1">
          <strong className="block font-display text-[28px] uppercase leading-none">Abrir o Combina</strong>
          <span className="text-sm font-semibold">Vagas escolhidas para o seu perfil. Se a empresa também quiser, dá liga.</span>
        </span>
        <ArrowRight className="size-6 shrink-0" strokeWidth={3} aria-hidden="true" />
      </Link>

      <section aria-labelledby="inv-t" className="flex flex-col gap-3">
        <SectionTitle>
          <span id="inv-t">Convites de contato</span>
        </SectionTitle>
        <p className="text-[13px] font-semibold">Ao aceitar, a empresa passa a ver seu nome e currículo, e o chat é liberado.</p>
        {invites.length === 0 && (
          <p className="border-3 border-dashed border-foreground p-5 text-center font-semibold">
            Quando uma empresa verificada se interessar pelo seu perfil, o convite aparece aqui.
          </p>
        )}
        <ul className="flex flex-col gap-3 pr-1.5">
          {invites.map((c) => {
            const e = empMap.get(c.employer_id);
            const j = c.job_id ? jobMap.get(c.job_id) : null;
            return (
              <li key={c.id}>
                <InviteCard id={c.id} status={c.status} company={e?.display_name ?? "Empresa verificada"} job={j?.title ?? null} message={c.message} />
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="app-t" className="flex flex-col gap-3">
        <SectionTitle
          action={
            <Link href="/vagas" className="text-[13px] font-extrabold underline">
              Buscar vagas
            </Link>
          }
        >
          <span id="app-t">Minhas candidaturas</span>
        </SectionTitle>
        {(apps ?? []).length === 0 ? (
          <div className="flex flex-col gap-3 border-3 border-dashed border-foreground p-5 text-center">
            <p className="font-semibold">Você ainda não demonstrou interesse em nenhuma vaga.</p>
            <Button asChild variant="secondary" className="shadow-none">
              <Link href="/vagas">Ver vagas</Link>
            </Button>
          </div>
        ) : (
          <ul className="border-3 border-foreground bg-card">
            {(apps ?? []).map((a, i, arr) => {
              const j = jobMap.get(a.job_id);
              const s = APPLICATION_STATUS[a.status as keyof typeof APPLICATION_STATUS];
              return (
                <li key={a.id} className={`flex items-center gap-2.5 px-3.5 py-3 ${i < arr.length - 1 ? "border-b-2 border-foreground" : ""}`}>
                  <div className="min-w-0 flex-1">
                    <strong className="block truncate text-[15px] font-black">{j?.title ?? "Vaga encerrada"}</strong>
                    <span className="text-[13px] font-semibold">{j?.employer_name ?? "—"}</span>
                  </div>
                  <Badge variant={s.variant}>{s.label}</Badge>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="pr-t" className="mr-1.5 flex flex-col gap-3 border-3 border-foreground bg-[#141210] p-4 text-[#F2E8D5] shadow-hard-accent">
        <h2 id="pr-t" className="font-display text-2xl uppercase">
          Sua privacidade
        </h2>
        <ul className="flex flex-col gap-2 text-sm font-semibold">
          <li className="flex items-center gap-2">
            {me.anonymous ? <Check className="size-4 text-[#E8A317]" strokeWidth={3} /> : <Lock className="size-4 text-[#E8A317]" />}
            {me.anonymous ? "Perfil anônimo ligado" : "Perfil anônimo desligado"}
          </li>
          <li className="flex items-center gap-2">
            <Check className="size-4 text-[#E8A317]" strokeWidth={3} aria-hidden="true" />
            {shared === 0 ? "Nenhuma empresa vê seu nome" : `${shared} empresa${shared > 1 ? "s veem" : " vê"} seu nome`}
          </li>
          <li className="flex items-center gap-2">
            <Check className="size-4 text-[#E8A317]" strokeWidth={3} aria-hidden="true" />
            {report ? "Relato confidencial guardado só para você" : "Nenhum relato guardado"}
          </li>
        </ul>
        <Link href="/privacidade" className="flex h-12 items-center justify-center border-3 border-[#F2E8D5] text-sm font-black uppercase">
          Configurar privacidade
        </Link>
      </section>
    </div>
  );
}
