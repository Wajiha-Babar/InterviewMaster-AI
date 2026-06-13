import { NextFunction, Request, Response } from "express";
import { repositories } from "../repositories";
import { publicUser } from "../repositories/memory.repository";
import { sendError } from "../utils/apiResponse";
import { hashToken } from "../utils/tokens";

declare module "express-serve-static-core" {
  interface Request {
    user?: ReturnType<typeof publicUser>;
    sessionTokenHash?: string;
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (!token) return sendError(res, "Authentication required.", 401);

    const tokenHash = hashToken(token);
    const session = await repositories.sessions.findByTokenHash(tokenHash);
    if (!session) return sendError(res, "Authentication required.", 401);

    const user = await repositories.users.findById(session.userId);
    if (!user) return sendError(res, "Authentication required.", 401);

    req.user = publicUser(user);
    req.sessionTokenHash = tokenHash;
    next();
  } catch (err) {
    next(err);
  }
}
