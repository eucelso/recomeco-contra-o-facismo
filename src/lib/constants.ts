export const AREAS = [
  "Campo e agro",
  "Comércio",
  "Administrativo",
  "Indústria",
  "Saúde e cuidado",
  "Educação",
  "Construção",
  "Alimentação",
  "Limpeza e conservação",
  "Transporte e logística",
  "Tecnologia",
  "Beleza",
  "Comunicação e cultura",
] as const;

export const STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA",
  "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;

export const MODALITIES = {
  presencial: "Presencial",
  remoto: "Remoto",
  hibrido: "Híbrido",
} as const;
export type Modality = keyof typeof MODALITIES;

export const CONTRACT_TYPES = {
  clt: "CLT",
  pj: "PJ",
  temporario: "Temporário",
  estagio: "Estágio",
  autonomo: "Autônomo",
} as const;
export type ContractType = keyof typeof CONTRACT_TYPES;

export const SHIFTS = ["Manhã", "Tarde", "Noite", "Fins de semana", "Escala 12x36"] as const;

export const AVAILABILITY = ["Imediata", "Em 15 dias", "Em 30 dias", "Só procurando por enquanto"] as const;

export const EDUCATION = [
  "Fundamental incompleto",
  "Fundamental completo",
  "Médio incompleto",
  "Médio completo",
  "Técnico",
  "Superior incompleto",
  "Superior completo",
  "Pós-graduação",
] as const;

export const APPLICATION_STATUS = {
  sent: { label: "Enviada", variant: "outline" },
  viewed: { label: "Visualizada", variant: "accent" },
  in_conversation: { label: "Em conversa", variant: "default" },
  hired: { label: "Contratado(a)", variant: "success" },
  closed: { label: "Encerrada", variant: "dashed" },
} as const;

export const COMMITMENT_VERSION = "2026-10-v1";

export const COMMITMENT_ITEMS = [
  "Não discriminar por posição política, religião, gênero, raça, cor, idade, orientação sexual, deficiência ou origem.",
  "Nunca perguntar em quem a pessoa votou nem pressionar o voto de ninguém.",
  "Oferecer condições de trabalho dentro da lei.",
  "Usar os dados dos candidatos só para o processo seletivo, conforme a LGPD.",
] as const;

export const LEGAL_AREAS = [
  "Trabalhista",
  "Direitos humanos",
  "Criminal",
  "Civil e consumidor",
  "Família",
  "Previdenciário",
  "Eleitoral",
  "Discriminação e racismo",
  "Violência contra a mulher",
  "Direito digital e LGPD",
] as const;

export const LAWYER_COMMITMENT_VERSION = "2026-10-v1";

export const LAWYER_COMMITMENT_ITEMS = [
  "Atender de graça, ou por valor social combinado de forma transparente, as pessoas que me procurarem por aqui.",
  "Manter o sigilo profissional e usar os dados de quem me procura só para o atendimento.",
  "Não pedir nem insinuar vantagem em troca de atendimento, nem discriminar por posição política, religião, gênero, raça ou origem.",
  "Manter minha inscrição na OAB regular e avisar a equipe se algo mudar.",
] as const;

export const BUSINESS_CATEGORIES = [
  "Restaurante e bar",
  "Padaria e confeitaria",
  "Mercado e hortifruti",
  "Loja de roupas e acessórios",
  "Beleza e estética",
  "Saúde e bem-estar",
  "Livraria e cultura",
  "Oficina e serviços",
  "Educação e cursos",
  "Hospedagem e turismo",
  "Artesanato e produção local",
  "Outro",
] as const;

export const BUSINESS_COMMITMENT_VERSION = "2026-10-v1";

export const BUSINESS_COMMITMENT_ITEMS = [
  "As informações que publico são verdadeiras e eu sou a pessoa responsável pelo negócio.",
  "No meu relato, não cito o nome de pessoas nem acuso terceiros: conto só o que aconteceu com o meu negócio.",
  "Entendo que a equipe revisa o texto antes de publicar e que mudar o nome ou o relato exige nova revisão.",
] as const;

export const REPORT_TOPICS = [
  "Assédio eleitoral no trabalho",
  "Demissão discriminatória",
  "Ameaça ou intimidação",
  "Boicote a negócio",
  "Outro",
] as const;
