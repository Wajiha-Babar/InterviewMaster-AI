import { Router } from "express";
import { evaluateAnswer, prepareAnswer } from "../controllers/interview.controller";
import { requireAuth } from "../middleware/auth";

export const interviewRoutes = Router();

interviewRoutes.post("/prepare-answer", requireAuth, prepareAnswer);
interviewRoutes.post("/evaluate", requireAuth, evaluateAnswer);
