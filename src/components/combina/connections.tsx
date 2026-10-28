import Link from "next/link";
import { InitialsBox } from "@/components/brand/initials-box";
import type { Connection } from "@/lib/types";

export function ConnectionsList({ items, waitingLabel }: { items: Connection[]; waitingLabel?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-5">
      <section aria-labelledby="dl-t" className="flex flex-col gap-2">
        <h2 id="dl-t" className="border-b-3 border-foreground pb-1 text-sm font-black uppercase">
          Deu liga · {items.length}
        </h2>
        {items.length === 0 ? (
          <p className="text-sm">Quando der liga, a conversa aparece aqui.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {items.map((c) => (
              <li key={c.contact_id}>
                <Link href={`/mensagens/${c.contact_id}`} className="flex items-center gap-2.5 border-3 border-foreground bg-card p-2.5">
                  <InitialsBox name={c.peer_name} className="size-10 text-base" />
                  <span className="min-w-0 flex-1">
                    <strong className="block truncate text-sm font-black">{c.peer_name}</strong>
                    <span className="block truncate text-xs font-semibold">{c.last_message ? `“${c.last_message}”` : (c.job_title ?? "Diga olá")}</span>
                  </span>
                  {c.unread > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center border-2 border-foreground bg-primary px-1 text-[11px] font-black text-primary-foreground">
                      {c.unread}
                      <span className="sr-only"> não lidas</span>
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      {waitingLabel}
    </div>
  );
}
