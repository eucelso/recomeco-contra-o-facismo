// Rodar: node --experimental-strip-types tests/crypto-core.test.mjs
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { decryptText, encryptText, isEncrypted, parseKey } from "../src/lib/crypto-core.ts";

const key = randomBytes(32);
const msg = "O gerente disse que quem votasse no X seria demitido. ✊ ação";

const a = encryptText(key, "fact:u1:f1", msg);
assert.ok(isEncrypted(a) && !a.includes("gerente"), "não pode vazar texto legível");
assert.equal(decryptText(key, "fact:u1:f1", a), msg, "ida e volta");
assert.notEqual(a, encryptText(key, "fact:u1:f1", msg), "IV aleatório: cifras diferentes para o mesmo texto");

assert.throws(() => decryptText(key, "fact:u2:f1", a), "contexto errado (outro dono) deve falhar");
assert.throws(() => decryptText(randomBytes(32), "fact:u1:f1", a), "chave errada deve falhar");

const tampered = a.slice(0, -2) + (a.endsWith("AA") ? "BB" : "AA");
assert.throws(() => decryptText(key, "fact:u1:f1", tampered), "adulterado deve falhar");
assert.throws(() => decryptText(key, "fact:u1:f1", "v9.abc"), "versão desconhecida");
assert.throws(() => decryptText(key, "fact:u1:f1", "texto puro"), "texto puro não é cifrado");

assert.equal(decryptText(key, "x", encryptText(key, "x", "")), "", "texto vazio");
assert.throws(() => parseKey("curta"), "chave curta recusada");
assert.equal(parseKey(key.toString("base64")).length, 32);
console.log("✓ crypto-core: todos os testes passaram");
