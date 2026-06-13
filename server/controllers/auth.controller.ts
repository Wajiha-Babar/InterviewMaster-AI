import { NextFunction, Request, Response } from "express";
import { signIn, signUp, updateProfile } from "../services/auth.service";
import { sendSuccess } from "../utils/apiResponse";

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await signUp(req.body), 201);
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await signIn(req.body));
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response) {
  sendSuccess(res, { user: req.user });
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.sessionTokenHash) {
      await req.app.locals.repositories.sessions.deleteByTokenHash(req.sessionTokenHash);
    }
    sendSuccess(res, { loggedOut: true });
  } catch (err) {
    next(err);
  }
}

export async function saveProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await updateProfile(req.user!.id, req.body);
    sendSuccess(res, { user });
  } catch (err) {
    next(err);
  }
}
