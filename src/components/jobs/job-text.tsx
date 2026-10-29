import { Fragment } from "react";

/** Negrito (**texto**) dentro de uma linha. Só gera elementos React: nada de HTML cru. */
function inline(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") && part.length > 4 ? <strong key={i}>{part.slice(2, -2)}</strong> : <Fragment key={i}>{part}</Fragment>,
  );
}

/** Texto da vaga: títulos (#), listas (- ou *), negrito e parágrafos. Quem escreve texto puro continua vendo texto puro. */
export function JobText({ text, className }: { text: string; className?: string }) {
  const blocks: React.ReactNode[] = [];
  let list: string[] = [];
  const flush = () => {
    if (list.length) {
      blocks.push(
        <ul key={`l${blocks.length}`} className="ml-5 list-disc space-y-1">
          {list.map((li, i) => (
            <li key={i}>{inline(li)}</li>
          ))}
        </ul>,
      );
      list = [];
    }
  };
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    const bullet = line.match(/^[-*•]\s+(.*)$/);
    const heading = line.match(/^#{1,6}\s+(.*)$/);
    if (bullet) list.push(bullet[1]);
    else {
      flush();
      if (heading) blocks.push(<h3 key={`h${blocks.length}`} className="mt-2 text-lg font-black">{inline(heading[1])}</h3>);
      else if (line) blocks.push(<p key={`p${blocks.length}`}>{inline(line)}</p>);
    }
  }
  flush();
  return <div className={className ?? "flex flex-col gap-3 text-base leading-relaxed"}>{blocks}</div>;
}

/** Versão em uma linha, sem os símbolos, para a prévia do card. */
export function plainPreview(text: string) {
  return text
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/^[-*•]\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}
