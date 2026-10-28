import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Política de privacidade" };

// Rascunho para revisão jurídica. Preencha os campos entre colchetes antes de publicar.
export default function PoliticaPage() {
  const h2 = "font-display text-2xl uppercase leading-tight";
  return (
    <article className="mx-auto flex max-w-2xl flex-col gap-5 px-4 py-10 text-[15px] leading-relaxed">
      <h1 className="font-display text-5xl uppercase leading-none">Política de privacidade</h1>
      <p className="border-3 border-foreground bg-accent p-3 font-bold text-accent-foreground">
        Rascunho para revisão jurídica. Controlador: [RAZÃO SOCIAL], CNPJ [NÚMERO]. Encarregado(a) de dados: [NOME] — [E-MAIL].
      </p>
      <h2 className={h2}>O que não coletamos</h2>
      <p>
        Nunca pedimos em quem você votou nem sua posição política. Não existe campo para isso. Opinião política é dado sensível pela
        LGPD (art. 5º, II) e fica fora do Recomeço.
      </p>
      <h2 className={h2}>O que coletamos e por quê</h2>
      <ul className="list-disc pl-5">
        <li>E-mail, para entrar na conta (link mágico ou Google).</li>
        <li>Perfil profissional: nome, cidade, áreas, experiência, disponibilidade e currículo opcional, para conectar você a vagas.</li>
        <li>Relato confidencial, se você quiser, guardado só para você, com seu consentimento.</li>
        <li>Dados do contratante (CNPJ ou CPF, responsável), para verificar quem contrata.</li>
      </ul>
      <h2 className={h2}>Quem vê seus dados</h2>
      <p>
        Contratantes verificados veem só o perfil anônimo (habilidades, experiência, região). Nome, contato e currículo aparecem apenas
        para quem você aceitar. O relato confidencial nunca é mostrado a ninguém.
      </p>
      <h2 className={h2}>Seus direitos</h2>
      <p>
        Você pode baixar, corrigir e excluir seus dados a qualquer momento em{" "}
        <Link href="/privacidade" className="font-bold underline">
          Privacidade e dados
        </Link>
        , e retirar consentimentos. Dúvidas: [E-MAIL DO ENCARREGADO].
      </p>
      <h2 className={h2}>Denúncias</h2>
      <p>Não recebemos nem publicamos denúncias contra pessoas ou empresas. Indicamos apenas os canais oficiais.</p>
    </article>
  );
}
