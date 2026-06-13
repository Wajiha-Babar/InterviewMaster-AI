import crypto from "crypto";
import { env } from "../config/env";

export function createSessionToken() {
  return crypto.randomBytes(32).toString("base64url");
}

export function hashToken(token: string) {
  return crypto.createHmac("sha256", env.AUTH_SECRET).update(token).digest("hex");
}
