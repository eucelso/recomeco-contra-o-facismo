export const SHARE_DAYS = 30;

/** Linha que o trabalhador vê em "Compartilhado com advogados". */
export type MyShare = {
  id: string;
  lawyer_name: string;
  has_contact: boolean;
  created_at: string;
  expires_at: string;
  first_viewed_at: string | null;
  renewal_requested_at: string | null;
};

/** Linha da lista do advogado (sem o conteúdo). */
export type ReceivedShare = {
  id: string;
  created_at: string;
  expires_at: string;
  active: boolean;
  worker_name: string | null;
  contact_kind: "whatsapp" | "email" | null;
  contact_value: string | null;
  first_viewed_at: string | null;
  renewal_requested_at: string | null;
};

/** Conteúdo cifrado de um compartilhamento (só existe decifrado na memória do servidor). */
export type SharePayload = {
  worker_name: string;
  contact_kind: "whatsapp" | "email" | null;
  contact_value: string | null;
  facts: { happened_on: string | null; place: string | null; who: string | null; what: string; evidence: string | null; witnesses: string | null }[];
  notes: string | null;
};

export type OpenedShare = SharePayload & { created_at: string; expires_at: string };

export function daysLeft(expiresAt: string) {
  return Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86_400_000);
}

export function contactHref(kind: "whatsapp" | "email", value: string) {
  if (kind === "email") return `mailto:${value}`;
  const digits = value.replace(/\D/g, "");
  return `https://wa.me/${digits.startsWith("55") ? digits : `55${digits}`}`;
}
