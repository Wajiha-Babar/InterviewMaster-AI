import express from "express";
import { authRoutes } from "./routes/auth.routes";
import { codeRoutes } from "./routes/code.routes";
import { cvRoutes } from "./routes/cv.routes";
import { interviewRoutes } from "./routes/interview.routes";
import { questionRoutes } from "./routes/questions.routes";
import { errorHandler } from "./middleware/errorHandler";
import { requestLogger } from "./middleware/requestLogger";
import { rateLimitAi } from "./middleware/rateLimit";
import { repositories } from "./repositories";
import { aiService } from "./ai/gemini.service";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.locals.express = express;
  app.locals.repositories = repositories;
  app.locals.aiService = aiService;

  app.use(express.json({ limit: "8mb" }));
  app.use(express.urlencoded({ extended: true, limit: "8mb" }));
  app.use(requestLogger);

  app.get("/api/health", (_req, res) => {
    const geminiActive = aiService.isConfigured();
    res.json({
      status: "ok",
      geminiActive,
      storage: "local-development-memory",
    });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/cv", rateLimitAi, cvRoutes);
  app.use("/api/questions", rateLimitAi, questionRoutes);
  app.use("/api/interview", rateLimitAi, interviewRoutes);
  app.use("/api/code", rateLimitAi, codeRoutes);
  app.use("/api", (_req, res) => {
    res.status(404).json({ success: false, error: "API endpoint not found." });
  });
  app.use(errorHandler);

  return app;
}
