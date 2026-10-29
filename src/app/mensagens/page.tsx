import type { Metadata } from "next";
import Link from "next/link";
import { InitialsBox } from "@/components/brand/initials-box";
import { PageTitle } from "@/components/layout/app-shell";
import { requireRole } from "@/lib/auth";
import type { Connection } from "@/lib/types";
import { timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "Mensagens" };

export default async function MensagensPage() {
  const { supabase } = await requireRole();
  // Uma consulta só (nome, última mensagem e não lidas), em vez de 3 por conversa.
  const { data } = await supabase.rpc("combina_connections", { p_limit: 100 });
  const rows = ((data ?? []) as Connection[]).map((c) => ({
    id: c.contact_id,
    name: c.peer_name,
    last: c.last_message,
    unread: c.unread,
    at: c.last_at,
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageTitle>Mensagens</PageTitle>
      <p className="text-sm font-semibold">Conversas só existem depois que o candidato aceita o convite.</p>
      {rows.length === 0 ? (
        <p className="border-3 border-dashed border-foreground p-6 text-center font-semibold">Nenhuma conversa ainda.</p>
      ) : (
        <ul className="flex flex-col gap-3 pr-1.5">
          {rows.map((r) => (
            <li key={r.id}>
              <Link href={`/mensagens/${r.id}`} className="flex items-center gap-3 border-3 border-foreground bg-card p-3 shadow-hard-sm">
                <InitialsBox name={r.name || "?"} className="size-11" />
                <span className="min-w-0 flex-1">
                  <strong className="block text-[15px] font-black">{r.name || "Conversa"}</strong>
                  <span className="block truncate text-[13px]">
                    {r.last ?? "Diga olá"}
                  </span>
                </span>
                <span className="flex flex-col items-end gap-1">
                  <span className="text-[11px] font-bold">{timeAgo(r.at)}</span>
                  {r.unread > 0 && (
                    <span className="flex h-6 min-w-6 items-center justify-center border-2 border-foreground bg-primary px-1 text-xs font-black text-primary-foreground">
                      {r.unread}
                      <span className="sr-only"> não lidas</span>
                    </span>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
