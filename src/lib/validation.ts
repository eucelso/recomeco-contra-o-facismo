import { z } from "zod";
import { AREAS, AVAILABILITY, BUSINESS_CATEGORIES, CONTRACT_TYPES, EDUCATION, LEGAL_AREAS, MODALITIES, SHIFTS, STATES } from "./constants";

const yearStr = z
  .string()
  .trim()
  .regex(/^$|^(19[5-9]\d|20\d\d)$/, "Ano inválido (ex.: 2019).")
  .optional();
const moneyStr = z.string().trim().regex(/^$|^\d{1,7}$/, "Use só números (ex.: 2400).").optional();

const req = (msg: string) => z.string({ error: msg }).trim().min(1, msg);

export const emailSchema = z.object({
  email: z.email({ error: "Confira o e-mail: parece que falta alguma parte (ex.: nome@gmail.com)." }),
});

const passwordField = z
  .string({ error: "Digite sua senha." })
  .min(8, "A senha precisa ter pelo menos 8 caracteres.")
  .max(72, "A senha pode ter até 72 caracteres.")
  .regex(/[a-z]/, "Falta uma letra minúscula na senha.")
  .regex(/[A-Z]/, "Falta uma letra maiúscula na senha.")
  .regex(/\d/, "Falta um número na senha.")
  .regex(/[^A-Za-z0-9]/, "Falta um símbolo na senha (ex.: ! @ # $ %).");

export const loginSchema = emailSchema.extend({
  password: z.string({ error: "Digite sua senha." }).min(1, "Digite sua senha."),
});

export const signupSchema = emailSchema.extend({ password: passwordField });

export const candidateStep1 = z.object({
  full_name: req("Diga seu nome completo.").min(3, "Nome muito curto.").max(120),
  preferred_name: z.string().trim().max(60).optional(),
  city: req("Diga sua cidade para mostrarmos vagas perto de você.").max(80),
  state: z.enum(STATES, { error: "Escolha o estado." }),
  areas: z.array(z.enum(AREAS)).min(1, "Escolha pelo menos uma área.").max(3, "Escolha no máximo 3 áreas."),
});

export const experienceSchema = z.object({
  role_title: req("Diga a função.").max(80),
  employer_kind: z.string().trim().max(80).optional(),
  employer_name: z.string().trim().max(120).optional(),
  start_year: yearStr,
  end_year: yearStr,
  description: z.string().trim().max(500).optional(),
});

export const candidateStep2 = z.object({
  headline: req("Conte em poucas palavras o que você faz (ex.: Cozinheira).").max(80),
  years_experience: z.string().trim().regex(/^\d{1,2}$/, "Informe os anos de experiência (só números)."),
  skills: z.array(z.string().trim().min(1).max(40)).max(20, "No máximo 20 habilidades."),
  experiences: z.array(experienceSchema).max(10),
  education: z.enum(EDUCATION).optional(),
  courses: z.string().trim().max(300).optional(),
});

export const candidateStep3 = z.object({
  available_from: z.enum(AVAILABILITY, { error: "Diga quando pode começar." }),
  shifts: z.array(z.enum(SHIFTS)).min(1, "Escolha pelo menos um turno."),
  modalities: z.array(z.enum(Object.keys(MODALITIES) as [keyof typeof MODALITIES])).min(1, "Escolha pelo menos uma modalidade."),
  contract_types: z
    .array(z.enum(Object.keys(CONTRACT_TYPES) as [keyof typeof CONTRACT_TYPES]))
    .min(1, "Escolha pelo menos um tipo de contrato."),
});

export const candidateStep4 = z
  .object({
    report: z.string().trim().max(3000, "O relato pode ter até 3.000 caracteres.").optional(),
    report_consent: z.boolean(),
    anonymous: z.boolean(),
  })
  .refine((v) => !v.report || v.report_consent, {
    path: ["report_consent"],
    message: "Para guardar o relato, marque a autorização.",
  });

export function onlyDigits(v: string) {
  return v.replace(/\D/g, "");
}

function validCNPJ(raw: string) {
  const c = onlyDigits(raw);
  if (c.length !== 14 || /^(\d)\1+$/.test(c)) return false;
  const calc = (len: number) => {
    const w = len === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const sum = w.reduce((acc, wi, i) => acc + Number(c[i]) * wi, 0);
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return calc(12) === Number(c[12]) && calc(13) === Number(c[13]);
}

function validCPF(raw: string) {
  const c = onlyDigits(raw);
  if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false;
  const dv = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(c[i]) * (len + 1 - i);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return dv(9) === Number(c[9]) && dv(10) === Number(c[10]);
}

export const employerSchema = z
  .object({
    kind: z.enum(["cnpj", "cpf"]),
    document: req("Informe o documento."),
    display_name: req("Diga o nome que aparece nas vagas.").max(120),
    legal_name: z.string().trim().max(160).optional(),
    sector: req("Escolha o setor.").max(80),
    city: req("Diga a cidade.").max(80),
    state: z.enum(STATES, { error: "Escolha o estado." }),
    responsible_name: req("Diga quem é a pessoa responsável.").min(3).max(120),
    commitment: z.literal(true, { error: "Para publicar vagas, é preciso aceitar o compromisso." }),
  })
  .superRefine((v, ctx) => {
    const ok = v.kind === "cnpj" ? validCNPJ(v.document) : validCPF(v.document);
    if (!ok) ctx.addIssue({ code: "custom", path: ["document"], message: v.kind === "cnpj" ? "CNPJ inválido. Confira os números." : "CPF inválido. Confira os números." });
  });

export const jobSchema = z
  .object({
    title: req("Diga o nome da vaga.").min(3).max(100),
    description: req("Descreva a vaga.").min(20, "Conte um pouco mais (pelo menos 20 caracteres).").max(4000),
    area: z.enum(AREAS, { error: "Escolha a área." }),
    modality: z.enum(Object.keys(MODALITIES) as [keyof typeof MODALITIES]),
    contract_type: z.enum(Object.keys(CONTRACT_TYPES) as [keyof typeof CONTRACT_TYPES]),
    city: z.string().trim().max(80).optional(),
    state: z.enum(STATES).optional(),
    salary_min: moneyStr,
    salary_max: moneyStr,
    benefits: z.string().trim().max(500).optional(),
    publish: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (v.modality !== "remoto" && (!v.city || !v.state)) {
      ctx.addIssue({ code: "custom", path: ["city"], message: "Vagas presenciais ou híbridas precisam de cidade e estado." });
    }
    if (v.salary_min && v.salary_max && Number(v.salary_max) < Number(v.salary_min)) {
      ctx.addIssue({ code: "custom", path: ["salary_max"], message: "O máximo não pode ser menor que o mínimo." });
    }
  });

export const messageSchema = z.object({ body: z.string().trim().min(1).max(4000) });

export const lawyerSchema = z
  .object({
    full_name: req("Diga seu nome completo.").min(3, "Nome muito curto.").max(120),
    oab_state: z.enum(STATES, { error: "Escolha o estado da sua OAB." }),
    oab_number: z
      .string({ error: "Informe o número da OAB." })
      .trim()
      .regex(/^\d{1,7}$/, "Use só os números da OAB (ex.: 123456)."),
    areas: z.array(z.enum(LEGAL_AREAS)).min(1, "Escolha pelo menos uma área.").max(5, "Escolha no máximo 5 áreas."),
    city: req("Diga a cidade.").max(80),
    state: z.enum(STATES, { error: "Escolha o estado." }),
    online: z.boolean(),
    contact_kind: z.enum(["whatsapp", "email"], { error: "Escolha como as pessoas vão falar com você." }),
    contact_value: req("Informe o contato.").max(120),
    bio: z.string().trim().max(500, "A apresentação pode ter até 500 caracteres.").optional(),
    commitment: z.literal(true, { error: "Para aparecer na lista, é preciso aceitar o compromisso." }),
  })
  .superRefine((v, ctx) => {
    if (v.contact_kind === "email") {
      if (!z.email().safeParse(v.contact_value).success)
        ctx.addIssue({ code: "custom", path: ["contact_value"], message: "Confira o e-mail (ex.: nome@dominio.com)." });
    } else {
      const d = onlyDigits(v.contact_value);
      if (d.length < 10 || d.length > 13)
        ctx.addIssue({ code: "custom", path: ["contact_value"], message: "Informe o WhatsApp com DDD (ex.: 11 91234-5678)." });
    }
  });

const optionalText = (max: number) => z.string().trim().max(max).optional();

export const businessSchema = z
  .object({
    kind: z.enum(["cnpj", "cpf"]),
    document: req("Informe o documento."),
    display_name: req("Diga o nome do negócio.").max(120),
    category: z.enum(BUSINESS_CATEGORIES, { error: "Escolha a categoria." }),
    city: req("Diga a cidade.").max(80),
    state: z.enum(STATES, { error: "Escolha o estado." }),
    neighborhood: optionalText(80),
    address: optionalText(160),
    whatsapp: optionalText(20),
    instagram: optionalText(31),
    website: optionalText(200),
    hours: optionalText(160),
    story: req("Conte o que aconteceu.").min(20, "Conte um pouco mais (pelo menos 20 caracteres).").max(500, "O relato pode ter até 500 caracteres."),
    commitment: z.literal(true, { error: "Para aparecer na lista, é preciso aceitar o compromisso." }),
  })
  .superRefine((v, ctx) => {
    const ok = v.kind === "cnpj" ? validCNPJ(v.document) : validCPF(v.document);
    if (!ok) ctx.addIssue({ code: "custom", path: ["document"], message: v.kind === "cnpj" ? "CNPJ inválido. Confira os números." : "CPF inválido. Confira os números." });
    const wa = v.whatsapp ? onlyDigits(v.whatsapp) : "";
    if (v.whatsapp && (wa.length < 10 || wa.length > 13))
      ctx.addIssue({ code: "custom", path: ["whatsapp"], message: "Informe o WhatsApp com DDD (ex.: 11 91234-5678)." });
    const ig = v.instagram?.replace(/^@/, "") ?? "";
    if (ig && !/^[A-Za-z0-9._]{1,30}$/.test(ig))
      ctx.addIssue({ code: "custom", path: ["instagram"], message: "Use só o nome de usuário, sem link (ex.: padariadobairro)." });
    if (v.website && !/^https?:\/\/[^\s]+\.[^\s]+$/.test(v.website))
      ctx.addIssue({ code: "custom", path: ["website"], message: "Comece com https:// (ex.: https://meusite.com.br)." });
    if (!wa && !ig && !v.website)
      ctx.addIssue({ code: "custom", path: ["whatsapp"], message: "Informe pelo menos um contato: WhatsApp, Instagram ou site." });
  });
