"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";

export function TagInput({
  id,
  value,
  onChange,
  placeholder,
  max = 20,
}: {
  id: string;
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  max?: number;
}) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const t = draft.trim().slice(0, 40);
    if (!t || value.includes(t) || value.length >= max) return setDraft("");
    onChange([...value, t]);
    setDraft("");
  };
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex gap-2">
        <Input
          id={id}
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add();
            }
          }}
        />
        <button
          type="button"
          onClick={add}
          aria-label="Adicionar habilidade"
          className="flex size-[54px] shrink-0 items-center justify-center border-3 border-foreground bg-secondary text-secondary-foreground"
        >
          <Plus className="size-6" strokeWidth={3} />
        </button>
      </div>
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Habilidades adicionadas">
          {value.map((t) => (
            <li key={t} className="flex h-10 items-center gap-1 border-2 border-foreground bg-accent pl-3 text-sm font-bold text-accent-foreground">
              {t}
              <button
                type="button"
                onClick={() => onChange(value.filter((v) => v !== t))}
                aria-label={`Remover ${t}`}
                className="flex size-9 items-center justify-center"
              >
                <X className="size-4" strokeWidth={3} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
