import crypto from "crypto";

const KEY_LENGTH = 64;

export async function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const key = await scrypt(password, salt);
  return `scrypt:${salt}:${key}`;
}

export async function verifyPassword(password: string, passwordHash: string) {
  const [, salt, storedKey] = passwordHash.split(":");
  if (!salt || !storedKey) return false;
  const candidate = await scrypt(password, salt);
  return crypto.timingSafeEqual(Buffer.from(candidate, "hex"), Buffer.from(storedKey, "hex"));
}

function scrypt(password: string, salt: string) {
  return new Promise<string>((resolve, reject) => {
    crypto.scrypt(password, salt, KEY_LENGTH, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey.toString("hex"));
    });
  });
}
