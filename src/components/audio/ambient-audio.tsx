"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

const KEY = "recomeco-audio";
const SRC = "/audio/marighella.m4a";

function readPref() {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}
function savePref(v: "on" | "off") {
  try {
    window.localStorage.setItem(KEY, v);
  } catch {
    /* sem armazenamento: só não lembra a escolha */
  }
}

/**
 * Trilha de fundo com botão de pausar/tocar.
 * Navegadores bloqueiam som automático sem interação: se o play direto falhar, começa no primeiro toque ou tecla.
 * Quem pausou uma vez não é incomodado de novo (a escolha fica guardada neste aparelho).
 */
export function AmbientAudio() {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const audio = ref.current;
    if (!audio || readPref() === "off") return;
    audio.volume = 0.5;

    const events = ["pointerdown", "keydown", "touchend"] as const;
    const cleanup = () => events.forEach((e) => window.removeEventListener(e, onGesture));
    function onGesture(e: Event) {
      // O clique no botão já cuida de tocar/pausar: se o gesto automático também agisse, o botão pausaria logo em seguida.
      if ((e.target as Element | null)?.closest?.("[data-audio-toggle]")) return;
      cleanup();
      audio?.play().then(() => setPlaying(true)).catch(() => {});
    }

    audio
      .play()
      .then(() => setPlaying(true))
      .catch(() => events.forEach((e) => window.addEventListener(e, onGesture, { passive: true })));
    return cleanup;
  }, []);

  const toggle = () => {
    const audio = ref.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
      savePref("off");
    } else {
      audio.volume = 0.5;
      audio
        .play()
        .then(() => {
          setPlaying(true);
          savePref("on");
        })
        .catch(() => {});
    }
  };

  return (
    <>
      <audio ref={ref} src={SRC} loop preload="none" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />
      <button
        type="button"
        data-audio-toggle
        onClick={toggle}
        aria-pressed={playing}
        aria-label={playing ? "Pausar a música de fundo" : "Tocar a música de fundo"}
        className="fixed bottom-[calc(env(safe-area-inset-bottom)+84px)] left-3 z-30 flex h-11 items-center gap-2 border-3 border-foreground bg-secondary px-3 text-secondary-foreground shadow-hard-sm md:bottom-4"
      >
        {playing ? <Pause className="size-5" strokeWidth={3} aria-hidden="true" /> : <Play className="size-5" strokeWidth={3} aria-hidden="true" />}
        <span className="text-xs font-black uppercase tracking-wider">{playing ? "Pausar" : "Tocar"}</span>
      </button>
    </>
  );
}
