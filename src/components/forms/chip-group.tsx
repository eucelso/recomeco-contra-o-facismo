"use client";

import { cn } from "@/lib/utils";

/** Grupo de botões de alternância (multi ou única escolha) acessível. */
export function ChipGroup<T extends string>({
  options,
  value,
  onChange,
  max,
  single = false,
  labelFor = (v) => v,
  invalid,
  ariaLabelledBy,
}: {
  options: readonly T[];
  value: T[];
  onChange: (v: T[]) => void;
  max?: number;
  single?: boolean;
  labelFor?: (v: T) => string;
  invalid?: boolean;
  ariaLabelledBy?: string;
}) {
  const toggle = (opt: T) => {
    if (single) return onChange([opt]);
    if (value.includes(opt)) return onChange(value.filter((v) => v !== opt));
    if (max && value.length >= max) return onChange([...value.slice(1), opt]);
    onChange([...value, opt]);
  };
  return (
    <div role="group" aria-labelledby={ariaLabelledBy} aria-invalid={invalid || undefined} className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const on = value.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            aria-pressed={on}
            onClick={() => toggle(opt)}
            className={cn(
              "h-11 border-3 px-3.5 text-sm font-extrabold",
              on ? "border-foreground bg-primary text-primary-foreground" : "bg-card text-foreground",
              invalid && !on ? "border-destructive" : "border-foreground",
            )}
          >
            {labelFor(opt)}
          </button>
        );
      })}
    </div>
  );
}
