import { cn } from "@/lib/utils";

/** Punho erguido em linogravura (desenho próprio, sem emblemas de organizações). */
export function Fist({ className, fill = "#F2E8D5", stroke = "#141210", strokeWidth = 7, title }: {
  className?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  title?: string;
}) {
  return (
    <svg viewBox="0 0 120 160" className={cn("shrink-0", className)} role={title ? "img" : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      <g stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" fill={fill}>
        <path d="M38 96 H82 V160 H38Z" />
        <path d="M24 30 H96 Q104 30 104 38 V82 Q104 104 82 104 H38 Q16 104 16 82 V38 Q16 30 24 30Z" />
        <path d="M16 64 H70 Q80 64 80 74 Q80 84 70 84 H16" />
      </g>
      <path d="M42 32 V62 M60 32 V62 M78 32 V62" stroke={stroke} strokeWidth={strokeWidth} />
    </svg>
  );
}

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="flex size-10 items-center justify-center border-3 border-foreground bg-primary">
        <Fist className="h-6 w-5" strokeWidth={9} />
      </span>
      {!compact && <span className="font-display text-[26px] leading-none tracking-wide">RECOMEÇO</span>}
    </span>
  );
}
