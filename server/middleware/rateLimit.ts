import { NextFunction, Request, Response } from "express";
import { sendError } from "../utils/apiResponse";

const buckets = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const LIMIT = 30;

export function rateLimitAi(req: Request, res: Response, next: NextFunction) {
  const key = req.ip || "local";
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return next();
  }
  if (bucket.count >= LIMIT) {
    return sendError(res, "Too many AI requests. Please wait a minute and try again.", 429);
  }
  bucket.count += 1;
  next();
}
