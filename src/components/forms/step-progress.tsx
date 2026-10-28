import { cn } from "@/lib/utils";

export function StepProgress({ step, labels }: { step: number; labels: string[] }) {
  return (
    <div className="flex flex-col gap-2">
      <div
        role="progressbar"
        aria-label="Progresso do cadastro"
        aria-valuemin={1}
        aria-valuemax={labels.length}
        aria-valuenow={step}
        aria-valuetext={`Etapa ${step} de ${labels.length}: ${labels[step - 1]}`}
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${labels.length}, minmax(0, 1fr))` }}
      >
        {labels.map((l, i) => (
          <span key={l} className={cn("h-3 border-2 border-foreground", i < step ? "bg-primary" : "bg-card")} />
        ))}
      </div>
      <div className="grid gap-1.5 text-[11px] font-extrabold uppercase" style={{ gridTemplateColumns: `repeat(${labels.length}, minmax(0, 1fr))` }}>
        {labels.map((l, i) => (
          <span key={l} className={i < step ? "" : "text-muted-foreground"}>
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}
