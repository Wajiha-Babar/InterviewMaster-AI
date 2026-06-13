import { NextFunction, Request, Response } from "express";
import { sendSuccess } from "../utils/apiResponse";
import { assertString } from "../utils/validators";

export async function generateQuestions(req: Request, res: Response, next: NextFunction) {
  try {
    const mode = assertString(req.body.mode || "daily", "mode", 2, 40);
    const cvProfile = req.body.cvProfile || (await req.app.locals.repositories.cvs.findLatestByUserId(req.user!.id));
    const result = await req.app.locals.aiService.generateQuestions({
      targetRole: typeof req.body.targetRole === "string" ? req.body.targetRole.slice(0, 100) : req.user!.targetRole,
      experienceLevel: typeof req.body.experienceLevel === "string" ? req.body.experienceLevel.slice(0, 80) : req.user!.experienceLevel,
      dreamCompany: typeof req.body.dreamCompany === "string" ? req.body.dreamCompany.slice(0, 100) : req.user!.dreamCompany,
      jobDescription: typeof req.body.jobDescription === "string" ? req.body.jobDescription.slice(0, 30_000) : undefined,
      jobMatchAnalysis: req.body.jobMatchAnalysis,
      mode,
      cvProfile,
    });
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}
