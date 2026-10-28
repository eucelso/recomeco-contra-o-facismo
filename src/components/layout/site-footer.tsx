import Link from "next/link";
import { OFFICIAL_CHANNELS } from "@/lib/channels";

export function SiteFooter() {
  return (
    <footer className="bg-[#141210] text-[#E6DAC2]">
      <div className="container flex flex-col gap-10 py-14">
        <div className="flex flex-wrap gap-10">
          <div className="flex min-w-[260px] flex-1 flex-col gap-3">
            <span className="font-display text-4xl leading-none text-[#F2E8D5]">RECOMEÇO</span>
            <p className="text-[15px] leading-relaxed">
              Trabalho digno, voto livre. Uma ponte entre quem precisa recomeçar e quem contrata com respeito.
            </p>
          </div>
          <div className="flex min-w-[280px] flex-[2] flex-col gap-4">
            <h2 className="text-sm font-black uppercase tracking-[0.1em] text-[#E8A317]">Canais oficiais de denúncia</h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {OFFICIAL_CHANNELS.map((c) => (
                <li key={c.name}>
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block h-full border-2 border-[#4A4038] p-4 text-[#F2E8D5] hover:border-[#E8A317]"
                  >
                    <strong className="block text-[15px] font-extrabold">{c.name}</strong>
                    <span className="text-[13px] text-[#CBBFA8]">{c.short}</span>
                  </a>
                </li>
              ))}
            </ul>
            <p className="text-[13px] leading-relaxed text-[#CBBFA8]">
              O Recomeço não recebe, publica nem mantém listas de denúncias contra pessoas ou empresas. Encaminhamos você
              apenas aos canais oficiais.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap justify-between gap-4 border-t-2 border-[#4A4038] pt-6 text-sm">
          <span>© {new Date().getFullYear()} Recomeço</span>
          <nav aria-label="Rodapé" className="flex flex-wrap gap-5">
            <Link href="/politica-de-privacidade" className="underline">
              Privacidade e LGPD
            </Link>
            <Link href="/direitos" className="underline">
              Seus direitos
            </Link>
            <Link href="/vagas" className="underline">
              Vagas
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
