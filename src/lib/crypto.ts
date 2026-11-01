import "server-only";
import { randomBytes, scrypt as _scrypt, timingSafeEqual, createHash } from "node:crypto";
import { promisify } from "node:util";
import { env } from "./env";

const scrypt = promisify(_scrypt) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

export async function hashSecret(secret: string) {
  const salt = randomBytes(16);
  const key = await scrypt(secret.normalize("NFKC"), salt, 64);
  return `scrypt$${salt.toString("base64")}$${key.toString("base64")}`;
}

export async function verifySecret(secret: string, stored: string) {
  const [alg, s, k] = stored.split("$");
  if (alg !== "scrypt" || !s || !k) return false;
  const key = await scrypt(secret.normalize("NFKC"), Buffer.from(s, "base64"), 64);
  const expected = Buffer.from(k, "base64");
  return key.length === expected.length && timingSafeEqual(key, expected);
}

export const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");
export const token = (bytes = 32) => randomBytes(bytes).toString("base64url");
export const ipHash = (ip: string) => sha256(`${env.ipSalt()}:${ip}`);

// Código legible para anfitriones: 12 caracteres sin letras confusas (~60 bits)
export function hostCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(12);
  const chars = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
  return `${chars.slice(0, 4)}-${chars.slice(4, 8)}-${chars.slice(8)}`;
}
