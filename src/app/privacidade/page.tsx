import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Download, EyeOff, Lock } from "lucide-react";
import { InitialsBox } from "@/components/brand/initials-box";
import { PageTitle, SectionTitle } from "@/components/layout/app-shell";
import { DeleteAccountDialog } from "@/components/privacy/delete-account-dialog";
import { PrivacySwitch } from "@/components/privacy/privacy-switch";
import { ReportActions } from "@/components/privacy/report-actions";
import { RevokeButton } from "@/components/privacy/revoke-button";
import { requireRole } from "@/lib/auth";

export const metadata: Metadata = { title: "Privacidade e dados" };

export default async function PrivacidadePage() {
  const { supabase, user, role } = await requireRole();
  const isCandidate = role === "candidate";

  const [{ data: c }, { data: report }, { data: shared }, { data: consents }] = await Promise.all([
    isCandidate ? supabase.from("candidates").select("anonymous,show_region_only,invites_paused").eq("id", user.id).maybeSingle() : Promise.resolve({ data: null }),
    isCandidate ? supabase.from("confidential_reports").select("created_at,updated_at").eq("candidate_id", user.id).maybeSingle() : Promise.resolve({ data: null }),
    isCandidate ? supabase.from("contact_requests").select("id,employer_id,responded_at").eq("candidate_id", user.id).eq("status", "accepted") : Promise.resolve({ data: [] }),
    supabase.from("consent_events").select("kind,granted,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
  ]);
  const empIds = (shared ?? []).map((s) => s.employer_id);
  const { data: emps } = empIds.length ? await supabase.from("employer_public").select("id,display_name").in("id", empIds) : { data: [] };
  const empName = new Map((emps ?? []).map((e) => [e.id, e.display_name]));

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-2">
        <PageTitle>
          Privacidade e <span className="text-primary">seus dados</span>
        </PageTitle>
        <p className="text-base font-medium">Você decide quem vê o quê. Pela LGPD, os dados são seus.</p>
      </div>

      {isCandidate && c && (
        <section className="flex flex-col gap-3">
          <SectionTitle>Quem vê seu perfil</SectionTitle>
          <div className="border-3 border-foreground bg-card">
            <PrivacySwitch field="anonymous" initial={c.anonymous} title="Perfil anônimo até eu aceitar" hint="Nome, foto e contato ficam ocultos." />
            <PrivacySwitch field="show_region_only" initial={c.show_region_only} title="Mostrar só a região" hint="Em vez da cidade exata." />
            <PrivacySwitch field="invites_paused" initial={c.invites_paused} title="Pausar convites" hint="Seu perfil some das buscas por um tempo." />
            <div className="flex gap-3 p-4">
              <EyeOff className="mt-0.5 size-5 shrink-0 text-primary" strokeWidth={2.8} aria-hidden="true" />
              <span className="text-sm font-semibold">Voto e opinião política: nunca coletados, nunca exibidos.</span>
            </div>
          </div>
        </section>
      )}

      {isCandidate && (
        <section className="flex flex-col gap-3">
          <SectionTitle>Empresas com acesso ao seu nome</SectionTitle>
          {(shared ?? []).length === 0 ? (
            <p className="text-sm font-semibold">Nenhuma. Seu perfil está totalmente anônimo.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {(shared ?? []).map((s) => (
                <li key={s.id} className="flex items-center gap-3 border-3 border-foreground bg-card p-3">
                  <InitialsBox name={empName.get(s.employer_id) ?? "?"} className="size-10 text-base" />
                  <div className="min-w-0 flex-1">
                    <strong className="block text-sm font-black">{empName.get(s.employer_id) ?? "Empresa"}</strong>
                    <span className="text-xs font-semibold">
                      Desde {s.responded_at ? new Date(s.responded_at).toLocaleDateString("pt-BR") : "—"} · nome, currículo e chat
                    </span>
                  </div>
                  <RevokeButton id={s.id} />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {isCandidate && (
        <section className="mr-1.5 flex flex-col gap-3 border-3 border-foreground bg-[#141210] p-4 text-[#F2E8D5] shadow-hard-primary">
          <h2 className="flex items-center gap-2.5 text-[15px] font-black uppercase">
            <Lock className="size-5 text-[#E8A317]" strokeWidth={2.6} aria-hidden="true" /> Relato confidencial
          </h2>
          <p className="text-sm text-[#E6DAC2]">
            {report
              ? `Guardado em ${new Date(report.updated_at ?? report.created_at).toLocaleDateString("pt-BR")} · nunca compartilhado.`
              : "Você não guardou nenhum relato."}
          </p>
          <ReportActions hasReport={Boolean(report)} />
        </section>
      )}

      <section className="flex flex-col gap-3">
        <SectionTitle>Seus dados (LGPD)</SectionTitle>
        <a
          href="/privacidade/exportar"
          className="mr-1.5 flex min-h-[60px] items-center gap-3 border-3 border-foreground bg-card px-3.5 py-2.5 shadow-hard-sm"
        >
          <span className="flex size-10 shrink-0 items-center justify-center border-2 border-foreground bg-accent text-accent-foreground">
            <Download className="size-5" strokeWidth={2.8} aria-hidden="true" />
          </span>
          <span className="flex-1">
            <strong className="block text-[15px] font-black">Baixar meus dados</strong>
            <span className="text-[13px] font-medium">Arquivo com tudo o que guardamos sobre você.</span>
          </span>
        </a>
        <details className="mr-1.5 border-3 border-foreground bg-card">
          <summary className="flex min-h-[52px] cursor-pointer items-center justify-between px-3.5 text-[15px] font-extrabold">
            Histórico de consentimentos <ChevronRight className="size-5" strokeWidth={3} aria-hidden="true" />
          </summary>
          <ul className="border-t-2 border-foreground px-3.5 py-2 text-sm">
            {(consents ?? []).length === 0 && <li className="py-1.5">Nenhum registro.</li>}
            {(consents ?? []).map((e, i) => (
              <li key={i} className="flex justify-between gap-3 py-1.5">
                <span className="font-semibold">
                  {e.kind.replaceAll("_", " ")} · {e.granted ? "autorizado" : "retirado"}
                </span>
                <span>{new Date(e.created_at).toLocaleDateString("pt-BR")}</span>
              </li>
            ))}
          </ul>
        </details>
        <DeleteAccountDialog />
      </section>

      <form action="/auth/sair" method="post" className="pr-1.5">
        <button className="h-12 w-full border-3 border-foreground bg-background text-sm font-black uppercase">Sair da conta</button>
      </form>
      <p className="text-center text-xs">
        <Link href="/politica-de-privacidade" className="underline">
          Política de privacidade
        </Link>
      </p>
    </div>
  );
}
