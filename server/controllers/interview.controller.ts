import { NextFunction, Request, Response } from "express";
import { sendSuccess } from "../utils/apiResponse";
import { assertString } from "../utils/validators";

export async function prepareAnswer(req: Request, res: Response, next: NextFunction) {
  try {
    const questionText =
      typeof req.body.question === "string"
        ? assertString(req.body.question, "question", 5, 3000)
        : assertString(req.body.question?.text, "question.text", 5, 3000);
    const cvProfile = req.body.cvProfile || (await req.app.locals.repositories.cvs.findLatestByUserId(req.user!.id));
    const preparation = await req.app.locals.aiService.prepareAnswer({
      question: typeof req.body.question === "object" ? req.body.question : questionText,
      cvProfile,
      targetRole: typeof req.body.targetRole === "string" ? req.body.targetRole.slice(0, 100) : req.user!.targetRole,
      experienceLevel: typeof req.body.experienceLevel === "string" ? req.body.experienceLevel.slice(0, 80) : req.user!.experienceLevel,
      jobDescription: typeof req.body.jobDescription === "string" ? req.body.jobDescription.slice(0, 30_000) : undefined,
    });
    sendSuccess(res, preparation);
  } catch (err) {
    next(err);
  }
}

export async function evaluateAnswer(req: Request, res: Response, next: NextFunction) {
  try {
    const question = assertString(req.body.question, "question", 5, 3000);
    const answer = assertString(req.body.answer, "answer", 2, 10000);
    const cvProfile = req.body.cvProfile || (await req.app.locals.repositories.cvs.findLatestByUserId(req.user!.id));
    const report = await req.app.locals.aiService.evaluateAnswer({
      question,
      answer,
      durationSeconds: Number(req.body.durationSeconds || 60),
      cvProfile,
      targetRole: typeof req.body.targetRole === "string" ? req.body.targetRole.slice(0, 100) : req.user!.targetRole,
      experienceLevel: typeof req.body.experienceLevel === "string" ? req.body.experienceLevel.slice(0, 80) : req.user!.experienceLevel,
    });
    await req.app.locals.repositories.feedback.save({
      userId: req.user!.id,
      createdAt: new Date().toISOString(),
      question,
      report,
    });
    sendSuccess(res, report);
  } catch (err) {
    next(err);
  }
}
