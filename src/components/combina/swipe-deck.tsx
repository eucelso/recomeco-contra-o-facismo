"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Info, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";
import { MatchDialog } from "@/components/combina/match-dialog";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import type { SwipeChoice, SwipeResult } from "@/lib/types";
import { cn } from "@/lib/utils";

type Match = { contactId?: string; peerName?: string };

const THRESHOLD = 110; // px de arrasto para decidir
const LEAVE_MS = 320;

/**
 * Pilha de cartas genérica do Combina.
 * Gesto (arrastar), botões e teclado (← → Z Enter) fazem a mesma coisa.
 */
export function SwipeDeck<T>({
  items,
  getKey,
  renderCard,
  renderDetails,
  detailsTitle,
  onDecide,
  onUndo,
  likeLabel,
  passLabel = "Agora não",
  likeStamp,
  meName,
  emptyState,
  aside,
  matchNote,
  mobileHeader,
}: {
  items: T[];
  getKey: (item: T) => string;
  renderCard: (item: T) => React.ReactNode;
  renderDetails: (item: T) => React.ReactNode;
  detailsTitle: string;
  onDecide: (item: T, choice: SwipeChoice) => Promise<SwipeResult>;
  onUndo: (item: T) => Promise<{ ok: boolean; error?: string }>;
  likeLabel: string;
  passLabel?: string;
  likeStamp: string;
  meName: string;
  emptyState: React.ReactNode;
  aside?: React.ReactNode;
  matchNote: string;
  mobileHeader?: React.ReactNode;
}) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [history, setHistory] = useState<{ item: T; choice: SwipeChoice }[]>([]);
  const [leaving, setLeaving] = useState<SwipeChoice | null>(null);
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [match, setMatch] = useState<Match | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const startX = useRef<number | null>(null);
  const busy = useRef(false);

  const current = items[index];
  const done = index >= items.length;

  const decide = useCallback(
    (choice: SwipeChoice) => {
      if (!current || busy.current) return;
      busy.current = true;
      setLeaving(choice);
      setDetailsOpen(false);
      const item = current;
      const request = onDecide(item, choice);
      window.setTimeout(async () => {
        setIndex((i) => i + 1);
        setLeaving(null);
        setDx(0);
        busy.current = false;
        const r = await request;
        if (!r.ok) {
          toast.error(r.error);
          setIndex((i) => Math.max(0, i - 1));
          return;
        }
        setHistory((h) => [...h, { item, choice }]);
        if (r.matched) setMatch({ contactId: r.contactId, peerName: r.peerName });
      }, LEAVE_MS);
    },
    [current, onDecide],
  );

  const undo = useCallback(async () => {
    const last = history[history.length - 1];
    if (!last || busy.current) return;
    const r = await onUndo(last.item);
    if (!r.ok) return void toast.error(r.error ?? "Não deu para desfazer.");
    setHistory((h) => h.slice(0, -1));
    setIndex((i) => Math.max(0, i - 1));
  }, [history, onUndo]);

  // Atalhos de teclado (ignora quando o foco está num campo ou num diálogo)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName))) return;
      if (match || document.querySelector("[role=dialog]")) return;
      if (e.key === "ArrowRight") (e.preventDefault(), decide("like"));
      else if (e.key === "ArrowLeft") (e.preventDefault(), decide("pass"));
      else if (e.key.toLowerCase() === "z" && !e.metaKey && !e.ctrlKey) void undo();
      else if (e.key === "Enter" && current && el?.tagName !== "BUTTON" && el?.tagName !== "A") setDetailsOpen(true);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [decide, undo, match, current]);

  // Gesto de arrastar
  const onPointerDown = (e: React.PointerEvent) => {
    if (busy.current || (e.target as HTMLElement).closest("a,button")) return;
    startX.current = e.clientX;
    setDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (startX.current == null) return;
    setDx(e.clientX - startX.current);
  };
  const onPointerUp = () => {
    if (startX.current == null) return;
    startX.current = null;
    setDragging(false);
    if (dx > THRESHOLD) decide("like");
    else if (dx < -THRESHOLD) decide("pass");
    else setDx(0);
  };

  const transform =
    leaving === "like"
      ? "translateX(130%) rotate(16deg)"
      : leaving === "pass"
        ? "translateX(-130%) rotate(-16deg)"
        : `translateX(${dx}px) rotate(${dx / 18}deg)`;
  const likeOpacity = leaving === "like" ? 1 : Math.min(1, Math.max(0, dx / THRESHOLD));
  const passOpacity = leaving === "pass" ? 1 : Math.min(1, Math.max(0, -dx / THRESHOLD));

  return (
    <div className="grid gap-7 lg:grid-cols-[minmax(0,300px)_minmax(0,460px)_minmax(0,1fr)] lg:items-start">
      {aside && <aside className="order-2 lg:order-1">{aside}</aside>}

      {/* Pilha */}
      <section aria-label="Carta atual" className="order-1 flex flex-col gap-4 lg:order-2">
        {mobileHeader && <div className="lg:hidden">{mobileHeader}</div>}
        <div className="flex justify-between text-[13px] font-extrabold">
          <span>{done ? "Fim das cartas" : "Arraste ou use os botões"}</span>
          <span aria-live="polite">{done ? "" : `${index + 1} de ${items.length}`}</span>
        </div>

        <div className="relative mr-1.5 h-[540px] sm:h-[560px]">
          {done ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 border-3 border-dashed border-foreground p-6 text-center">
              {emptyState}
              <button type="button" onClick={() => router.refresh()} className="h-11 text-sm font-black uppercase underline">
                Buscar cartas novas
              </button>
            </div>
          ) : (
            <>
              {index + 2 < items.length + 1 && (
                <div aria-hidden="true" className="absolute inset-x-[10px] bottom-[-6px] top-[18px] rotate-[3deg] border-3 border-foreground bg-muted" />
              )}
              {index + 1 < items.length && (
                <div aria-hidden="true" className="absolute inset-x-[4px] bottom-0 top-[10px] -rotate-2 border-3 border-foreground bg-card" />
              )}
              <article
                key={getKey(current)}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                className={cn(
                  "absolute inset-0 touch-pan-y select-none overflow-hidden border-3 border-foreground bg-card shadow-hard",
                  dragging ? "cursor-grabbing" : "cursor-grab transition-[transform,opacity] duration-300 ease-out",
                  leaving && "opacity-0",
                )}
                style={{ transform }}
              >
                {renderCard(current)}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute left-4 top-[72px] -rotate-12 border-[4px] border-success bg-background/90 px-3 py-1 font-display text-3xl text-success"
                  style={{ opacity: likeOpacity }}
                >
                  {likeStamp}
                </span>
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute right-4 top-[72px] rotate-12 border-[4px] border-foreground bg-background/90 px-3 py-1 font-display text-3xl text-foreground"
                  style={{ opacity: passOpacity }}
                >
                  AGORA NÃO
                </span>
              </article>
            </>
          )}
        </div>

        <div className="flex items-center justify-center gap-3 pt-1 sm:gap-4">
          <button
            type="button"
            onClick={() => void undo()}
            disabled={!history.length}
            aria-label="Desfazer a última escolha (Z)"
            className="flex size-12 items-center justify-center rounded-full border-3 border-foreground bg-card disabled:opacity-40"
          >
            <RotateCcw className="size-5" strokeWidth={2.8} />
          </button>
          <button
            type="button"
            onClick={() => decide("pass")}
            disabled={done}
            aria-label={`${passLabel} (seta para a esquerda)`}
            className="flex h-16 items-center gap-2 whitespace-nowrap rounded-full border-3 border-foreground bg-background px-5 font-black uppercase shadow-hard-sm disabled:opacity-40 lg:rounded-none lg:px-4 lg:text-sm"
          >
            <X className="size-6" strokeWidth={3.4} aria-hidden="true" />
            <span className="hidden lg:inline">{passLabel}</span>
          </button>
          <button
            type="button"
            onClick={() => decide("like")}
            disabled={done}
            aria-label={`${likeLabel} (seta para a direita)`}
            className="flex h-[72px] items-center gap-2 whitespace-nowrap rounded-full border-3 border-foreground bg-primary px-6 font-black uppercase text-primary-foreground shadow-hard-sm disabled:opacity-40 lg:h-16 lg:rounded-none lg:px-4 lg:text-sm"
          >
            <Check className="size-7" strokeWidth={3.6} aria-hidden="true" />
            <span className="hidden lg:inline">{likeLabel}</span>
          </button>
          <button
            type="button"
            onClick={() => setDetailsOpen(true)}
            disabled={done}
            aria-label="Ver detalhes"
            className="flex size-12 items-center justify-center rounded-full border-3 border-foreground bg-card disabled:opacity-40 lg:hidden"
          >
            <Info className="size-5" strokeWidth={2.8} />
          </button>
        </div>
        <p className="hidden text-center text-xs font-bold lg:block">
          Atalhos: <kbd className="border-2 border-foreground px-1.5">←</kbd> {passLabel.toLowerCase()} ·{" "}
          <kbd className="border-2 border-foreground px-1.5">→</kbd> {likeLabel.toLowerCase()} · <kbd className="border-2 border-foreground px-1.5">Z</kbd>{" "}
          desfazer
        </p>
      </section>

      {/* Detalhes: coluna no desktop, painel no celular */}
      <section aria-label={detailsTitle} className="order-3 hidden border-3 border-foreground bg-card p-5 lg:block">
        {current ? renderDetails(current) : <p className="font-semibold">Sem carta aberta no momento.</p>}
      </section>
      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
        <SheetContent side="bottom" className="mx-auto max-w-xl lg:hidden">
          <SheetTitle className="pr-10 text-2xl">{detailsTitle}</SheetTitle>
          <SheetDescription className="sr-only">Detalhes da carta atual</SheetDescription>
          {current && renderDetails(current)}
          <div className="flex gap-3 pr-1.5 pt-2">
            <button type="button" onClick={() => decide("pass")} className="h-14 flex-1 border-3 border-foreground bg-background font-black uppercase shadow-hard-sm">
              {passLabel}
            </button>
            <button type="button" onClick={() => decide("like")} className="h-14 flex-[1.4] border-3 border-foreground bg-primary font-black uppercase text-primary-foreground shadow-hard-sm">
              {likeLabel}
            </button>
          </div>
        </SheetContent>
      </Sheet>

      <MatchDialog
        open={Boolean(match)}
        onOpenChange={(o) => !o && setMatch(null)}
        meName={meName}
        peerName={match?.peerName ?? ""}
        contactId={match?.contactId}
        note={matchNote}
      />
    </div>
  );
}
