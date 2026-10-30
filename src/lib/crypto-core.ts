// Criptografia do dossiê: AES-256-GCM, com uma chave por contexto derivada da chave mestra (HKDF-SHA256).
// Puro e sem acesso a variáveis de ambiente, para poder ser testado. Quem lê a chave é dossier-crypto.ts.
// Formato guardado no banco: "v1." + base64url(iv[12] | selo[16] | texto cifrado).
import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";

const VERSION = "v1";

export function parseKey(b64: string): Buffer {
  const key = Buffer.from(b64.trim(), "base64");
  if (key.length !== 32) throw new Error("A chave de criptografia precisa ter 32 bytes (base64).");
  return key;
}

function derive(master: Buffer, ctx: string): Buffer {
  return Buffer.from(hkdfSync("sha256", master, Buffer.alloc(0), `recomeco:${VERSION}:${ctx}`, 32));
}

export const isEncrypted = (s: string) => s.startsWith(`${VERSION}.`);

/** `ctx` amarra o texto ao seu dono/registro: trocar um valor de lugar no banco faz a leitura falhar. */
export function encryptText(master: Buffer, ctx: string, plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", derive(master, ctx), iv);
  cipher.setAAD(Buffer.from(ctx));
  const body = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return `${VERSION}.${Buffer.concat([iv, cipher.getAuthTag(), body]).toString("base64url")}`;
}

export function decryptText(master: Buffer, ctx: string, token: string): string {
  const [version, payload] = token.split(".");
  if (version !== VERSION || !payload) throw new Error("Formato de dado cifrado desconhecido.");
  const raw = Buffer.from(payload, "base64url");
  if (raw.length < 28) throw new Error("Dado cifrado truncado.");
  const decipher = createDecipheriv("aes-256-gcm", derive(master, ctx), raw.subarray(0, 12));
  decipher.setAAD(Buffer.from(ctx));
  decipher.setAuthTag(raw.subarray(12, 28));
  return Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString("utf8");
}
