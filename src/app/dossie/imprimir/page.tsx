import type { Metadata } from "next";
import { PrintButton } from "@/components/candidate/print-button";
import { requireRole } from "@/lib/auth";
import { sortFacts, type Fact } from "@/lib/dossier";

export const metadata: Metadata = { title: "Dossiê para imprimir", robots: { index: false } };

const day = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString("pt-BR");

export default async function DossieImprimirPage() {
  const { supabase, user } = await requireRole("candidate");
  const [{ data: facts }, { data: report }, { data: me }] = await Promise.all([
    supabase.from("report_facts").select("id,happened_on,place,who,what,evidence,witnesses,created_at").eq("candidate_id", user.id),
    supabase.from("confidential_reports").select("body").eq("candidate_id", user.id).maybeSingle(),
    supabase.from("candidates").select("full_name").eq("id", user.id).maybeSingle(),
  ]);
  const timeline = sortFacts((facts ?? []) as Fact[]);

  return (
    <main id="conteudo" className="mx-auto min-h-dvh max-w-3xl bg-white px-5 py-8 text-[#141210] print:max-w-none print:p-0">
      <div className="mb-6 flex flex-wrap items-center gap-3 print:hidden">
        <PrintButton />
        <a href="/painel/dossie" className="flex h-12 items-center px-2 text-sm font-extrabold underline">
          Voltar ao dossiê
        </a>
      </div>
      <p className="mb-6 border-l-4 border-[#C8102E] bg-[#F2E8D5] p-3 text-sm font-semibold print:hidden">
        Na janela que abrir, escolha <strong>Salvar como PDF</strong> como destino. Confira o documento antes de enviar a alguém: ele contém tudo o que você escreveu.
      </p>

      <header className="mb-6 border-b-2 border-[#141210] pb-4">
        <h1 className="font-display text-4xl uppercase leading-none">Dossiê de fatos</h1>
        <p className="mt-2 text-sm">
          {me?.full_name ? <>Trabalhador(a): <strong>{me.full_name}</strong> · </> : null}
          Gerado em {new Date().toLocaleDateString("pt-BR")}
        </p>
      </header>

      <section>
        <h2 className="mb-3 text-lg font-black uppercase">Linha do tempo</h2>
        {timeline.length === 0 ? (
          <p className="text-sm">Nenhum fato registrado.</p>
        ) : (
          <ol className="flex flex-col gap-4">
            {timeline.map((f, i) => (
              <li key={f.id} className="break-inside-avoid border border-[#141210] p-3">
                <p className="text-sm font-black uppercase">
                  {i + 1}. {f.happened_on ? day(f.happened_on) : "Data não informada"}
                </p>
                <p className="mt-1 whitespace-pre-wrap break-words text-[15px] leading-relaxed">{f.what}</p>
                <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-sm">
                  {(
                    [
                      ["Local", f.place],
                      ["Quem", f.who],
                      ["Provas", f.evidence],
                      ["Testemunhas", f.witnesses],
                    ] as [string, string | null][]
                  )
                    .filter(([, v]) => v)
                    .map(([k, v]) => (
                      <div key={k} className="contents">
                        <dt className="font-black uppercase">{k}</dt>
                        <dd className="break-words">{v}</dd>
                      </div>
                    ))}
                </dl>
              </li>
            ))}
          </ol>
        )}
      </section>

      {report?.body && (
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-black uppercase">Relato do trabalhador</h2>
          <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">{report.body}</p>
        </section>
      )}

      <footer className="mt-10 border-t border-[#141210] pt-3 text-xs">
        Documento confidencial, escrito pelo próprio trabalhador no Recomeço. O Recomeço não verifica os fatos nem presta orientação jurídica; este material serve
        para organizar informações a serem levadas a um(a) advogado(a), à Defensoria, ao sindicato ou ao Ministério Público do Trabalho.
      </footer>
    </main>
  );
}
