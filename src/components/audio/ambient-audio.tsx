"use client";

import { useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

const SRC = "/audio/marighella.m4a";

/** Trilha de fundo: começa em silêncio e só toca quando a pessoa aperta o botão. */
export function AmbientAudio() {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  const toggle = () => {
    const audio = ref.current;
    if (!audio) return;
    if (playing) return audio.pause();
    audio.volume = 0.5;
    audio.play().catch(() => {});
  };

  return (
    <>
      <audio ref={ref} src={SRC} loop preload="none" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />
      <button
        type="button"
        onClick={toggle}
        aria-pressed={playing}
        aria-label={playing ? "Pausar a música de fundo" : "Tocar a música de fundo"}
        className="fixed print:hidden bottom-[calc(env(safe-area-inset-bottom)+84px)] left-3 z-30 flex h-11 items-center gap-2 border-3 border-foreground bg-secondary px-3 text-secondary-foreground shadow-hard-sm md:bottom-4"
      >
        {playing ? <Pause className="size-5" strokeWidth={3} aria-hidden="true" /> : <Play className="size-5" strokeWidth={3} aria-hidden="true" />}
        <span className="text-xs font-black uppercase tracking-wider">{playing ? "Pausar" : "Tocar"}</span>
      </button>
    </>
  );
}
