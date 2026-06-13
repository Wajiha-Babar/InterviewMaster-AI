import dotenv from "dotenv";
import path from "path";

const envPath = path.resolve(process.cwd(), ".env");
const dotenvResult = dotenv.config({ path: envPath });
const geminiApiKey = process.env.GEMINI_API_KEY || "";

if (dotenvResult.error) {
  console.warn(`No .env file loaded from ${envPath}. Server will continue with safe development defaults.`);
}

if (!geminiApiKey) {
  console.warn("GEMINI_API_KEY is not set. Gemini features will use local fallbacks and /api/health will report geminiActive: false.");
}

export const env = {
  geminiApiKey,
  GEMINI_API_KEY: geminiApiKey,
  AUTH_SECRET: process.env.AUTH_SECRET || "local-dev-secret-change-me",
  authSecret: process.env.AUTH_SECRET || "local-dev-secret-change-me",
  APP_URL: process.env.APP_URL || "http://localhost:3000",
  appUrl: process.env.APP_URL || "http://localhost:3000",
  PORT: Number(process.env.PORT || 3000),
  port: Number(process.env.PORT || 3000),
  NODE_ENV: process.env.NODE_ENV || "development",
  nodeEnv: process.env.NODE_ENV || "development",
};
