import { Router } from "express";
import multer from "multer";
import {
  downloadImprovedDocx,
  downloadImprovedPdf,
  generateImprovedCV,
  generateJobTailoredCV,
  jobMatchCV,
  parseCV,
  uploadAnalyzeCV,
} from "../controllers/cv.controller";
import { requireAuth } from "../middleware/auth";

export const cvRoutes = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
});

cvRoutes.post("/parse", requireAuth, parseCV);
cvRoutes.post("/upload-analyze", requireAuth, upload.single("cv"), uploadAnalyzeCV);
cvRoutes.post("/generate-improved", requireAuth, generateImprovedCV);
cvRoutes.post("/job-match", requireAuth, jobMatchCV);
cvRoutes.post("/generate-job-tailored", requireAuth, generateJobTailoredCV);
cvRoutes.post("/download/docx", requireAuth, downloadImprovedDocx);
cvRoutes.post("/download/pdf", requireAuth, downloadImprovedPdf);
