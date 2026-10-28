import { cn, initials } from "@/lib/utils";

const PALETTE = ["bg-primary text-primary-foreground", "bg-success text-success-foreground", "bg-accent text-accent-foreground", "bg-secondary text-accent"];

export function InitialsBox({ name, className }: { name: string; className?: string }) {
  const idx = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTE.length;
  return (
    <span
      aria-hidden="true"
      className={cn("flex size-12 shrink-0 items-center justify-center border-3 border-foreground font-display text-xl", PALETTE[idx], className)}
    >
      {initials(name) || "?"}
    </span>
  );
}

export function AnonBox({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cn("size-12 shrink-0 border-3 border-foreground bg-halftone", className)} />;
}
