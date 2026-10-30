import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Política de privacidade" };

export default function PoliticaPage() {
  const h2 = "font-display text-2xl uppercase leading-tight";
  return (
    <article className="mx-auto flex max-w-2xl flex-col gap-5 px-4 py-10 text-[15px] leading-relaxed">
      <h1 className="font-display text-5xl uppercase leading-none">Política de privacidade</h1>
      <h2 className={h2}>O que não coletamos</h2>
      <p>
        Nunca pedimos em quem você votou nem sua posição política. Não existe campo para isso. Opinião política é dado sensível pela
        LGPD (art. 5º, II) e fica fora do Recomeço.
      </p>
      <h2 className={h2}>O que coletamos e por quê</h2>
      <ul className="list-disc pl-5">
        <li>E-mail, para entrar na conta (link mágico ou Google).</li>
        <li>Perfil profissional: nome, cidade, áreas, experiência, disponibilidade e currículo opcional, para conectar você a vagas.</li>
        <li>Dossiê confidencial (fatos datados e texto), se você quiser, guardado só para você, com seu consentimento. Você só o envia a alguém se escolher compartilhar com um advogado voluntário.</li>
        <li>Dados do contratante (CNPJ ou CPF, responsável), para verificar quem contrata.</li>
        <li>
          Relatos anônimos (página Relatos): só o texto, o tipo e, se você quiser, estado e cidade. Não pedimos nome, e-mail nem telefone e não
          guardamos seu IP. Para limitar abuso, usamos um código temporário calculado a partir da sua rede, que não fica ligado ao relato e é apagado
          em até 24 horas. Cada relato é lido pela equipe antes de ser publicado.
        </li>
      </ul>
      <h2 className={h2}>Estatísticas de uso</h2>
      <p>
        Usamos o Vercel Web Analytics para saber quais páginas são mais visitadas e melhorar o site. Ele não usa cookies, não cria perfil de quem
        visita e não nos mostra quem você é: registra apenas a página visitada, o país, o navegador e o tipo de aparelho, de forma agregada. Não
        registramos as visitas às páginas do dossiê, de privacidade e de direitos, nem os parâmetros de endereço (como códigos e identificadores).
        Nenhum conteúdo do que você escreve vai para essas estatísticas.
      </p>
      <h2 className={h2}>Quem vê seus dados</h2>
      <p>
        Contratantes verificados veem só o perfil anônimo (habilidades, experiência, região). Nome, contato e currículo aparecem apenas
        para quem você aceitar. O dossiê confidencial nunca é mostrado a empresas nem à nossa equipe. Se você o compartilhar com um advogado, ele recebe uma cópia, com validade de 30 dias, que você pode revogar a qualquer momento (a cópia é apagada).
      </p>
      <h2 className={h2}>Seus direitos</h2>
      <p>
        Você pode baixar, corrigir e excluir seus dados a qualquer momento em{" "}
        <Link href="/privacidade" className="font-bold underline">
          Privacidade e dados
        </Link>
        , e retirar consentimentos.
      </p>
      <h2 className={h2}>Denúncias</h2>
      <p>Não recebemos nem publicamos denúncias contra pessoas ou empresas. Indicamos apenas os canais oficiais.</p>
    </article>
  );
}
