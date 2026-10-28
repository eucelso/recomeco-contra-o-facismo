import type { Metadata } from "next";
import Link from "next/link";
import { InitialsBox } from "@/components/brand/initials-box";
import { PageTitle } from "@/components/layout/app-shell";
import { requireRole } from "@/lib/auth";
import { timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "Mensagens" };

export default async function MensagensPage() {
  const { supabase, user } = await requireRole();
  const { data: contacts } = await supabase
    .from("contact_requests")
    .select("id,created_at,responded_at")
    .eq("status", "accepted")
    .or(`employer_id.eq.${user.id},candidate_id.eq.${user.id}`)
    .order("responded_at", { ascending: false });

  const rows = await Promise.all(
    (contacts ?? []).map(async (c) => {
      const [{ data: peer }, { data: last }, { count }] = await Promise.all([
        supabase.rpc("conversation_peer", { p_contact: c.id }),
        supabase.from("messages").select("body,created_at,sender_id").eq("contact_id", c.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("messages").select("id", { count: "exact", head: true }).eq("contact_id", c.id).neq("sender_id", user.id).is("read_at", null),
      ]);
      return { id: c.id, peer: peer as { name: string } | null, last, unread: count ?? 0, at: last?.created_at ?? c.responded_at ?? c.created_at };
    }),
  );
  rows.sort((a, b) => (a.at < b.at ? 1 : -1));

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
                <InitialsBox name={r.peer?.name ?? "?"} className="size-11" />
                <span className="min-w-0 flex-1">
                  <strong className="block text-[15px] font-black">{r.peer?.name ?? "Conversa"}</strong>
                  <span className="block truncate text-[13px]">
                    {r.last ? `${r.last.sender_id === user.id ? "Você: " : ""}${r.last.body}` : "Diga olá"}
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
