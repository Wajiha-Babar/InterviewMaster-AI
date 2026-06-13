import { NextFunction, Request, Response } from "express";
import { sendSuccess } from "../utils/apiResponse";
import { assertString } from "../utils/validators";

export async function reviewCode(req: Request, res: Response, next: NextFunction) {
  try {
    const code = assertString(req.body.code, "code", 2, 20000);
    const language = assertString(req.body.language, "language", 2, 40);
    const result = await req.app.locals.aiService.reviewCode({
      code,
      language,
      questionText: typeof req.body.questionText === "string" ? req.body.questionText : "",
    });
    sendSuccess(res, {
      ...result,
      executionNotice: "Review only: this app does not execute code or run hidden test cases.",
    });
  } catch (err) {
    next(err);
  }
}
