"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Lock, Send } from "lucide-react";
import { toast } from "sonner";
import { InitialsBox } from "@/components/brand/initials-box";
import { createClient } from "@/lib/supabase/client";
import type { Message } from "@/lib/types";
import { cn } from "@/lib/utils";

const QUICK_CANDIDATE = ["Posso amanhã às 10h", "Qual o endereço?", "Obrigada(o) pelo retorno!"];
const QUICK_EMPLOYER = ["Podemos marcar uma conversa?", "Qual horário fica bom para você?"];

export function ChatRoom({
  contactId,
  userId,
  peer,
  jobLabel,
  acceptedAt,
  isCandidate,
  initial,
}: {
  contactId: string;
  userId: string;
  peer: { name: string; verified?: boolean; kind: string };
  jobLabel: string | null;
  acceptedAt: string | null;
  isCandidate: boolean;
  initial: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(initial);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const supabase = useRef(createClient()).current;

  useEffect(() => {
    const channel = supabase
      .channel(`chat:${contactId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `contact_id=eq.${contactId}` },
        (payload) => {
          const m = payload.new as Message;
          setMessages((prev) => (prev.some((p) => p.id === m.id) ? prev : [...prev, m]));
          if (m.sender_id !== userId) void supabase.rpc("mark_conversation_read", { p_contact: contactId });
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [contactId, supabase, userId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  async function send(text: string) {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    const { data, error } = await supabase.from("messages").insert({ contact_id: contactId, sender_id: userId, body }).select("*").single();
    setSending(false);
    if (error) return void toast.error("Mensagem não enviada. Verifique a conexão.");
    setDraft("");
    setMessages((prev) => (prev.some((p) => p.id === data.id) ? prev : [...prev, data as Message]));
  }

  const fmt = (iso: string) => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="-mx-4 -mt-5 flex h-[calc(100dvh-68px-56px)] flex-col md:mx-0 md:mt-0 md:h-[calc(100dvh-140px)] md:border-3 md:border-foreground">
      <header className="flex items-center gap-2.5 border-b-3 border-foreground bg-card p-2">
        <Link href="/mensagens" aria-label="Voltar para mensagens" className="flex size-11 shrink-0 items-center justify-center">
          <ChevronLeft className="size-7" strokeWidth={3} />
        </Link>
        <InitialsBox name={peer.name} className="size-11" />
        <div className="min-w-0 flex-1">
          <strong className="block truncate text-[15px] font-black">{peer.name}</strong>
          {peer.verified && <span className="text-xs font-bold">Empresa Comprometida</span>}
        </div>
      </header>
      {jobLabel && (
        <div className="flex items-center gap-2 bg-secondary px-4 py-2.5 text-[13px] font-bold text-secondary-foreground">
          <Lock className="size-4 text-accent" strokeWidth={2.6} aria-hidden="true" /> Vaga: {jobLabel}
        </div>
      )}

      <div aria-live="polite" aria-label="Mensagens" className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
        <p className="self-center max-w-[300px] border-2 border-dashed border-foreground px-3 py-2 text-center text-xs font-bold leading-relaxed">
          {isCandidate
            ? `Você aceitou o convite${acceptedAt ? ` em ${new Date(acceptedAt).toLocaleDateString("pt-BR")}` : ""}. A conversa foi liberada e seu nome agora aparece para esta empresa.`
            : "A pessoa aceitou seu convite. Lembre: nunca pergunte sobre voto ou posição política."}
        </p>
        {messages.map((m) => {
          const mine = m.sender_id === userId;
          return (
            <div key={m.id} className={cn("flex max-w-[82%] flex-col gap-1", mine ? "items-end self-end" : "items-start self-start")}>
              <div
                className={cn(
                  "whitespace-pre-wrap break-words border-3 border-foreground px-3 py-2.5 text-[15px] font-medium leading-snug shadow-hard-sm",
                  mine ? "bg-primary text-primary-foreground" : "bg-white text-[#141210]",
                )}
              >
                {m.body}
              </div>
              <span className="text-[11px] font-bold">
                {fmt(m.created_at)}
                {mine && m.read_at ? " · Lida" : ""}
              </span>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(draft);
        }}
        className="flex flex-col gap-2 border-t-3 border-foreground bg-card px-3 pb-3.5 pt-2.5"
      >
        <div className="flex gap-2 overflow-x-auto">
          {(isCandidate ? QUICK_CANDIDATE : QUICK_EMPLOYER).map((q) => (
            <button key={q} type="button" onClick={() => void send(q)} className="h-9 shrink-0 border-2 border-foreground bg-background px-2.5 text-[13px] font-extrabold">
              {q}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <label htmlFor="msg" className="sr-only">
            Mensagem
          </label>
          <input
            id="msg"
            value={draft}
            maxLength={4000}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Escreva uma mensagem"
            className="h-[50px] min-w-0 flex-1 border-3 border-foreground bg-white px-3 text-base text-[#141210]"
          />
          <button type="submit" aria-label="Enviar mensagem" disabled={sending || !draft.trim()} className="flex size-[50px] shrink-0 items-center justify-center border-3 border-foreground bg-primary text-primary-foreground disabled:opacity-60">
            <Send className="size-[22px]" strokeWidth={2.6} />
          </button>
        </div>
      </form>
    </div>
  );
}
