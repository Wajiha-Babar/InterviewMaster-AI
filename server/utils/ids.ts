import crypto from "crypto";

export function createId(prefix: string) {
  return `${prefix}_${crypto.randomBytes(9).toString("hex")}`;
}
