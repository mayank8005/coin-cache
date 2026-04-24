import argon2 from "argon2";
import bcrypt from "bcryptjs";
import { gcm } from "@noble/ciphers/aes";
import { hkdf } from "@noble/hashes/hkdf";
import { sha256 } from "@noble/hashes/sha2";
import { randomBytes } from "node:crypto";
import { env } from "./env";

export const hashPassword = (pw: string): Promise<string> =>
  argon2.hash(pw, {
    type: argon2.argon2id,
    memoryCost: 2 ** 16,
    timeCost: 3,
    parallelism: 1,
  });

export const verifyPassword = async (hash: string, pw: string): Promise<boolean> => {
  try {
    return await argon2.verify(hash, pw);
  } catch {
    return false;
  }
};

export const hashAdminPassword = (pw: string): Promise<string> => bcrypt.hash(pw, 12);
export const verifyAdminPassword = (hash: string, pw: string): Promise<boolean> =>
  bcrypt.compare(pw, hash);

const userKey = (userId: string): Uint8Array => {
  const master = new TextEncoder().encode(env().ENCRYPTION_KEY);
  return hkdf(sha256, master, new TextEncoder().encode("coin-cache-v1"), `user:${userId}`, 32);
};

const toB64 = (bytes: Uint8Array): string => Buffer.from(bytes).toString("base64");
const fromB64 = (b64: string): Uint8Array => new Uint8Array(Buffer.from(b64, "base64"));

export const encryptForUser = (userId: string, plaintext: string): string => {
  if (!plaintext) return "";
  const key = userKey(userId);
  const nonce = new Uint8Array(randomBytes(12));
  const ct = gcm(key, nonce).encrypt(new TextEncoder().encode(plaintext));
  const out = new Uint8Array(nonce.length + ct.length);
  out.set(nonce, 0);
  out.set(ct, nonce.length);
  return toB64(out);
};

export const decryptForUser = (userId: string, ciphertext: string | null | undefined): string => {
  if (!ciphertext) return "";
  try {
    const buf = fromB64(ciphertext);
    const nonce = buf.slice(0, 12);
    const ct = buf.slice(12);
    const key = userKey(userId);
    const pt = gcm(key, nonce).decrypt(ct);
    return new TextDecoder().decode(pt);
  } catch {
    return "";
  }
};
