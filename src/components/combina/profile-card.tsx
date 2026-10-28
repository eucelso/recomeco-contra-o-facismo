import { Check, Lock } from "lucide-react";
import { CONTRACT_TYPES, MODALITIES } from "@/lib/constants";
import type { CombinaProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CombinaProfileCard({ p }: { p: CombinaProfile }) {
  const ok = p.checks.filter((c) => c.ok).length;
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-[128px] shrink-0 items-center gap-4 border-b-3 border-foreground bg-halftone px-4 sm:h-[140px] sm:px-5">
        <span role="img" aria-label="Foto oculta até dar liga" className="flex size-20 items-center justify-center border-3 border-foreground bg-background">
          <Lock className="size-8" strokeWidth={2.6} aria-hidden="true" />
        </span>
        <div className="flex flex-col gap-1.5">
          <span className="self-start border-3 border-foreground bg-background px-2 font-display text-[40px] leading-none">#{p.public_code}</span>
          <span className="self-start bg-[#141210] px-2 py-0.5 text-[11px] font-black uppercase text-[#F2E8D5]">Nome oculto até dar liga</span>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <div>
          <h2 className="font-display text-3xl uppercase leading-none">{p.headline ?? "Profissional"}</h2>
          <span className="mt-1 block text-sm font-bold">
            {p.years_experience ?? 0} anos de experiência · {p.region}
          </span>
        </div>
        <div className="flex flex-col gap-1.5 border-2 border-dashed border-foreground p-2.5">
          <span className="text-[11px] font-black uppercase tracking-wider text-primary">
            Combina com a vaga · {ok} de {p.checks.length}
          </span>
          {p.checks.map((c) => (
            <span key={c.label} className="flex items-center gap-2 text-[13px] font-bold">
              <span
                className={cn(
                  "flex size-[18px] shrink-0 items-center justify-center border-2 border-foreground",
                  c.ok ? "bg-success text-success-foreground" : "border-dashed",
                )}
              >
                {c.ok && <Check className="size-3" strokeWidth={4} aria-hidden="true" />}
              </span>
              <span className={c.ok ? "" : "text-muted-foreground"}>{c.label}</span>
              <span className="sr-only">{c.ok ? "atende" : "não informado"}</span>
            </span>
          ))}
        </div>
        {p.skills.length > 0 && (
          <ul className="flex flex-wrap gap-1.5" aria-label="Habilidades">
            {p.skills.slice(0, 6).map((s) => (
              <li key={s} className="border-2 border-foreground bg-accent px-2 py-0.5 text-xs font-extrabold text-accent-foreground">
                {s}
              </li>
            ))}
          </ul>
        )}
        <span className="mt-auto text-xs font-extrabold uppercase">
          {[p.available_from, p.shifts.slice(0, 2).join(" e ")].filter(Boolean).join(" · ")}
        </span>
      </div>
    </div>
  );
}

export function CombinaProfileDetails({ p }: { p: CombinaProfile }) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="border-b-3 border-foreground pb-1 text-sm font-black uppercase">Experiência</h3>
      {p.experiences.length ? (
        <ol>
          {p.experiences.map((x, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex flex-col items-center">
                <span className={cn("size-3.5 border-3 border-foreground", i === 0 ? "bg-primary" : "bg-background")} />
                {i < p.experiences.length - 1 && <span className="w-[3px] flex-1 bg-foreground" />}
              </span>
              <div className="pb-3.5">
                <strong className="block text-[15px] font-black">{x.role_title}</strong>
                <span className="block text-[13px] font-semibold">
                  {[x.employer, x.start_year && `${x.start_year}–${x.end_year ?? "atual"}`].filter(Boolean).join(" · ")}
                </span>
                {x.description && <p className="mt-1 text-[13px] leading-relaxed">{x.description}</p>}
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm">Sem experiências detalhadas.</p>
      )}
      <dl className="grid grid-cols-2 gap-2.5">
        {[
          ["Turnos", p.shifts.join(", ") || "—"],
          ["Modalidade", p.modalities.map((m) => MODALITIES[m]).join(", ") || "—"],
          ["Contrato", p.contract_types.map((c) => CONTRACT_TYPES[c]).join(", ") || "—"],
          ["Escolaridade", p.education ?? "—"],
          ["Cursos", p.courses ?? "—"],
          ["Currículo", p.has_resume ? "Após dar liga" : "Não enviado"],
        ].map(([k, v]) => (
          <div key={k} className="border-3 border-foreground bg-background p-2.5">
            <dt className="text-[11px] font-black uppercase">{k}</dt>
            <dd className="text-sm font-bold">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="bg-[#141210] p-3 text-[13px] leading-relaxed text-[#F2E8D5]">
        Nomes de empregadores, contato e currículo aparecem <strong className="text-[#E8A317]">só se der liga</strong>. A pessoa nunca sabe de um
        “agora não”.
      </p>
    </div>
  );
}
