export type SuspendKind = "lawyer" | "business" | "employer" | "candidate";

export type AccountRow = {
  id: string;
  kind: SuspendKind;
  /** Conta oculta da plataforma pelo admin. */
  suspended: boolean;
  suspensionReason: string | null;
  suspendedAt: string | null;
  name: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  /** Chave para o filtro (ex.: verified, pending, rejected, complete, incomplete). */
  status: string;
  statusLabel: string;
  details: [string, string][];
};

export const ACCOUNT_TABS = [
  { key: "advogados", label: "Advogados" },
  { key: "candidatos", label: "Procuram trabalho" },
  { key: "empresas", label: "Empresas" },
  { key: "negocios", label: "Negócios prejudicados" },
] as const;
export type AccountTab = (typeof ACCOUNT_TABS)[number]["key"];

export const VERIFICATION_LABEL: Record<string, string> = { verified: "Verificado", pending: "Pendente", rejected: "Reprovado" };
