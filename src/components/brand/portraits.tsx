import { cn } from "@/lib/utils";

const face = (y: number) => (
  <path d={`M88 ${y} h8 M104 ${y} h8 M92 ${y + 13} h16`} stroke="#141210" strokeWidth="4" strokeLinecap="round" />
);

export function PortraitCampo() {
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
      <g stroke="#141210" strokeWidth="4" strokeLinejoin="round">
        <path d="M50 202 C50 154 72 136 100 136 C128 136 150 154 150 202Z" fill="#141210" />
        <path d="M84 138 L100 160 L116 138Z" fill="#F2E8D5" />
        <rect x="90" y="110" width="20" height="30" fill="#7A4A2E" />
        <circle cx="100" cy="94" r="26" fill="#7A4A2E" />
        <path d="M52 80 Q100 66 148 80 Q100 92 52 80Z" fill="#F2E8D5" />
        <path d="M76 78 C78 50 122 50 124 78Z" fill="#F2E8D5" />
        <path d="M77 70 H123 V77 H77Z" fill="#C8102E" />
      </g>
      {face(97)}
      <path d="M80 100 q3 9 11 12" stroke="#F2E8D5" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M68 182 l14 -20 M132 182 l-14 -20 M100 172 v22" stroke="#F2E8D5" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function PortraitComercio() {
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
      <g stroke="#141210" strokeWidth="4" strokeLinejoin="round">
        <path d="M50 202 C50 154 72 136 100 136 C128 136 150 154 150 202Z" fill="#E8A317" />
        <path d="M78 150 H122 V202 H78Z" fill="#F2E8D5" />
        <rect x="90" y="110" width="20" height="30" fill="#E2B48C" />
        <circle cx="100" cy="66" r="13" fill="#141210" />
        <circle cx="100" cy="96" r="26" fill="#E2B48C" />
        <path d="M74 96 C72 66 128 66 126 96 C118 80 82 80 74 96Z" fill="#141210" />
      </g>
      <path d="M88 99 h8 M104 99 h8 M92 112 q8 5 16 0" stroke="#141210" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M84 76 q10 -6 22 -4" stroke="#F2E8D5" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M90 168 h20" stroke="#141210" strokeWidth="3" />
    </svg>
  );
}

export function PortraitEscritorio() {
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
      <g stroke="#141210" strokeWidth="4" strokeLinejoin="round">
        <path d="M50 202 C50 154 72 136 100 136 C128 136 150 154 150 202Z" fill="#F2E8D5" />
        <path d="M86 138 L100 156 L114 138Z" fill="#141210" />
        <rect x="90" y="110" width="20" height="30" fill="#A86B45" />
        <circle cx="100" cy="96" r="26" fill="#A86B45" />
      </g>
      <g fill="#141210">
        <circle cx="78" cy="84" r="11" />
        <circle cx="90" cy="74" r="12" />
        <circle cx="110" cy="74" r="12" />
        <circle cx="122" cy="84" r="11" />
        <circle cx="100" cy="70" r="12" />
      </g>
      {face(99)}
      <g stroke="#141210" strokeWidth="4" strokeLinejoin="round" fill="#141210">
        <rect x="54" y="150" width="92" height="40" />
        <path d="M38 188 H162 L170 202 H30Z" />
      </g>
      <path d="M92 172 l8 -8 l8 8" stroke="#E8A317" strokeWidth="3" fill="none" />
    </svg>
  );
}

export function PortraitServicos() {
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
      <g stroke="#141210" strokeWidth="4" strokeLinejoin="round">
        <path d="M50 202 C50 154 72 136 100 136 C128 136 150 154 150 202Z" fill="#C8102E" />
        <rect x="90" y="110" width="20" height="30" fill="#4A2C1C" />
        <circle cx="100" cy="96" r="26" fill="#4A2C1C" />
        <path d="M75 92 C74 66 126 66 125 92 C116 80 84 80 75 92Z" fill="#141210" />
        <rect x="110" y="160" width="20" height="12" fill="#F2E8D5" />
      </g>
      {face(99)}
      <path d="M80 102 q3 8 10 10" stroke="#C98E63" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M68 182 l14 -20" stroke="#F2E8D5" strokeWidth="3" strokeLinecap="round" />
      <g stroke="#141210" strokeLinecap="round" fill="none">
        <path d="M178 198 L158 160" strokeWidth="10" />
        <circle cx="154" cy="150" r="11" strokeWidth="7" />
      </g>
    </svg>
  );
}

export function PortraitIndustria() {
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
      <g stroke="#141210" strokeWidth="4" strokeLinejoin="round">
        <path d="M50 202 C50 154 72 136 100 136 C128 136 150 154 150 202Z" fill="#141210" />
        <path d="M68 154 L88 142 V202 H68Z" fill="#E8A317" />
        <path d="M132 154 L112 142 V202 H132Z" fill="#E8A317" />
        <rect x="90" y="110" width="20" height="30" fill="#C98E63" />
        <circle cx="100" cy="98" r="26" fill="#C98E63" />
        <path d="M70 88 C70 56 130 56 130 88Z" fill="#C8102E" />
        <rect x="62" y="84" width="76" height="9" fill="#C8102E" />
      </g>
      {face(102)}
      <path d="M84 66 q14 -8 30 0" stroke="#F2E8D5" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}

const TILES = [
  { key: "campo", label: "Campo", bg: "bg-rays-mustard", C: PortraitCampo, span: "col-span-3 h-[230px] sm:h-[250px]" },
  { key: "comercio", label: "Comércio", bg: "bg-rays-red", C: PortraitComercio, span: "col-span-3 h-[230px] sm:h-[250px]" },
  { key: "escritorio", label: "Escritório", bg: "bg-rays-olive", C: PortraitEscritorio, span: "col-span-2 h-[170px] sm:h-[200px]" },
  { key: "servicos", label: "Serviços", bg: "bg-halftone", C: PortraitServicos, span: "col-span-2 h-[170px] sm:h-[200px]" },
  { key: "industria", label: "Indústria", bg: "bg-rays-mustard", C: PortraitIndustria, span: "col-span-2 h-[170px] sm:h-[200px]" },
];

export function PortraitMosaic({ className }: { className?: string }) {
  return (
    <div
      role="img"
      aria-label="Retratos em estilo de cartaz de trabalhadoras e trabalhadores do campo, do comércio, de escritório, de serviços e da indústria"
      className={cn("grid grid-cols-6 gap-3 pr-1.5 sm:gap-4", className)}
    >
      {TILES.map(({ key, label, bg, C, span }) => (
        <div key={key} className={cn("relative overflow-hidden border-3 border-foreground shadow-hard", bg, span)}>
          <C />
          <span className="absolute bottom-0 left-0 bg-[#141210] px-2.5 py-1 font-display text-sm tracking-wider text-[#F2E8D5] sm:text-base">
            {label.toUpperCase()}
          </span>
        </div>
      ))}
    </div>
  );
}
