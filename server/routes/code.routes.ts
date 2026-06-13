import { Router } from "express";
import { reviewCode } from "../controllers/code.controller";
import { requireAuth } from "../middleware/auth";

export const codeRoutes = Router();

codeRoutes.post("/evaluate", requireAuth, reviewCode);
