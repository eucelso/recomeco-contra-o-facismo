import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, Mail, MessageCircle } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { ctxShare, openJson } from "@/lib/dossier-crypto";
import { contactHref, daysLeft, type OpenedShare, type SharePayload } from "@/lib/dossier-share";
import { requireLawyer } from "@/lib/lawyer";

export const metadata: Metadata = { title: "Dossiê recebido", robots: { index: false } };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const day = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString("pt-BR");

export default async function DossieRecebidoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireLawyer();
  const { data } = UUID.test(id) ? await supabase.rpc("lawyer_open_dossier", { p_id: id }) : { data: null };
  const raw = data as { payload_enc: string | null; created_at: string; expires_at: string } | null;
  let d: OpenedShare | null = null;
  if (raw?.payload_enc) {
    try {
      d = { ...openJson<SharePayload>(ctxShare(id), raw.payload_enc), created_at: raw.created_at, expires_at: raw.expires_at };
    } catch {
      d = null;
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Link href="/advogado" className="-ml-2 flex h-11 items-center gap-1 self-start text-sm font-extrabold uppercase">
        <ChevronLeft className="size-5" strokeWidth={3} /> Painel
      </Link>

      {!d ? (
        <Alert variant="destructive">
          <p>Este dossiê não está disponível: o acesso venceu, foi revogado pelo trabalhador ou o link está errado.</p>
        </Alert>
      ) : (
        <>
          <header className="flex flex-col gap-2 border-b-3 border-foreground pb-4">
            <span className="text-[13px] font-black uppercase tracking-[0.08em] text-primary">Dossiê confidencial</span>
            <h1 className="font-display text-[38px] uppercase leading-none">{d.worker_name}</h1>
            <p className="text-sm font-semibold">
              Cópia de {new Date(d.created_at).toLocaleDateString("pt-BR")} · acesso até {new Date(d.expires_at).toLocaleDateString("pt-BR")} ({daysLeft(d.expires_at)} dias)
            </p>
            {d.contact_kind && d.contact_value ? (
              <a
                href={contactHref(d.contact_kind, d.contact_value)}
                target={d.contact_kind === "whatsapp" ? "_blank" : undefined}
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center justify-center gap-2 self-start border-3 border-foreground bg-primary px-4 py-2 text-sm font-black uppercase text-primary-foreground shadow-hard-sm"
              >
                {d.contact_kind === "whatsapp" ? <MessageCircle className="size-5" aria-hidden="true" /> : <Mail className="size-5" aria-hidden="true" />}
                Falar com {d.worker_name.split(" ")[0]} ({d.contact_kind === "whatsapp" ? "WhatsApp" : "e-mail"})
              </a>
            ) : (
              <p className="text-sm font-semibold">O trabalhador não deixou contato. Ele pode procurar você pelos dados do seu perfil público.</p>
            )}
          </header>

          <section className="flex flex-col gap-3">
            <h2 className="font-display text-3xl uppercase leading-none">Linha do tempo</h2>
            {d.facts.length === 0 ? (
              <p className="text-sm font-semibold">Nenhum fato registrado.</p>
            ) : (
              <ol className="flex flex-col gap-3">
                {d.facts.map((f, i) => (
                  <li key={i} className="flex flex-col gap-2 border-3 border-foreground bg-card p-4 shadow-hard-sm">
                    <strong className="text-sm font-black uppercase text-primary">
                      {i + 1}. {f.happened_on ? day(f.happened_on) : "Data não informada"}
                    </strong>
                    <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">{f.what}</p>
                    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-sm">
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

          {d.notes && (
            <section className="flex flex-col gap-3">
              <h2 className="font-display text-3xl uppercase leading-none">Relato do trabalhador</h2>
              <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">{d.notes}</p>
            </section>
          )}

          <p className="text-xs font-medium">
            Material confidencial escrito pelo próprio trabalhador. O Recomeço não verificou os fatos e não participa da conversa. Não repasse sem autorização dele.
          </p>
        </>
      )}
    </div>
  );
}
