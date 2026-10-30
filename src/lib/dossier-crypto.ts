import "server-only";
import { decryptText, encryptText, isEncrypted, parseKey } from "@/lib/crypto-core";

/** A chave mestra mora só no servidor (variável de ambiente), nunca no banco nem no código. */
export class MissingKeyError extends Error {
  constructor() {
    super("DOSSIER_ENCRYPTION_KEY não configurada.");
  }
}

function master() {
  const raw = process.env.DOSSIER_ENCRYPTION_KEY;
  if (!raw) throw new MissingKeyError();
  return parseKey(raw);
}

// Contextos: amarram cada valor ao seu dono (e registro).
export const ctxFact = (candidateId: string, factId: string) => `fact:${candidateId}:${factId}`;
export const ctxNotes = (candidateId: string) => `notes:${candidateId}`;
export const ctxShare = (shareId: string) => `share:${shareId}`;

export const sealJson = (ctx: string, value: unknown) => encryptText(master(), ctx, JSON.stringify(value));
export const openJson = <T>(ctx: string, token: string) => JSON.parse(decryptText(master(), ctx, token)) as T;

export const sealText = (ctx: string, text: string) => encryptText(master(), ctx, text);

/** Relatos gravados antes da criptografia (texto puro) continuam legíveis até serem recriptografados. */
export function openText(ctx: string, stored: string) {
  return isEncrypted(stored) ? decryptText(master(), ctx, stored) : stored;
}
