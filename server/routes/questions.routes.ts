import { Router } from "express";
import { generateQuestions } from "../controllers/questions.controller";
import { requireAuth } from "../middleware/auth";

export const questionRoutes = Router();

questionRoutes.post("/generate", requireAuth, generateQuestions);
