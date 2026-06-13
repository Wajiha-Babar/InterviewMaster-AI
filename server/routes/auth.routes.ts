import { Router } from "express";
import { login, logout, me, register, saveProfile } from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth";

export const authRoutes = Router();

authRoutes.post("/register", register);
authRoutes.post("/login", login);
authRoutes.get("/me", requireAuth, me);
authRoutes.post("/logout", requireAuth, logout);
authRoutes.put("/profile", requireAuth, saveProfile);
