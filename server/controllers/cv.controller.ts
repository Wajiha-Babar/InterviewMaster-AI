import { NextFunction, Request, Response } from "express";
import { CVProfile, CvAnalysisResult, ImprovedCv, JobMatchAnalysis } from "../types/domain";
import { cvAnalysisService } from "../ai/cvAnalysis.service";
import { generateImprovedCvDocx, generateImprovedCvPdf } from "../services/cvDocument.service";
import { extractCvText } from "../services/cvExtraction.service";
import { sendSuccess } from "../utils/apiResponse";
import { HttpError } from "../utils/httpError";
import { assertString } from "../utils/validators";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["application/pdf", "text/plain", "text/markdown", "text/x-markdown"];

export async function parseCV(req: Request, res: Response, next: NextFunction) {
  try {
    const cvContent = assertString(req.body.cvContent, "cvContent", 20, 7_000_000);
    const fileType = typeof req.body.fileType === "string" ? req.body.fileType : "text/plain";
    const fileName = typeof req.body.fileName === "string" ? req.body.fileName.slice(0, 180) : "pasted_cv";
    const fileSize = Number(req.body.fileSize || 0);

    const extensionAllowed = /\.(pdf|txt|md)$/i.test(fileName);
    if (!ALLOWED_TYPES.includes(fileType) && !extensionAllowed) {
      throw new HttpError(400, "Unsupported file type. Upload PDF, TXT, or MD, or paste resume text.");
    }
    if (fileSize && fileSize > MAX_FILE_SIZE_BYTES) {
      throw new HttpError(400, "Resume file is too large. Please keep uploads under 5 MB.");
    }

    const profile: CVProfile = await req.app.locals.aiService.parseCV({ cvContent, fileType, fileName });
    const saved = await req.app.locals.repositories.cvs.save({ ...profile, userId: req.user!.id });
    sendSuccess(res, saved);
  } catch (err) {
    next(err);
  }
}

export async function uploadAnalyzeCV(req: Request, res: Response, next: NextFunction) {
  try {
    const pastedText = typeof req.body.cvText === "string" ? req.body.cvText : typeof req.body.pastedText === "string" ? req.body.pastedText : "";
    const extracted = await extractCvText({ file: req.file, pastedText });
    const analysis = await cvAnalysisService.analyzeCv({
      cvText: extracted.text,
      sourceType: extracted.sourceType,
      warnings: extracted.warnings,
    });

    const profile = analysisToCvProfile(analysis);
    const saved = await req.app.locals.repositories.cvs.save({ ...profile, userId: req.user!.id });
    sendSuccess(res, { analysis, cvProfile: saved, extractedTextLength: extracted.text.length });
  } catch (err) {
    next(err);
  }
}

export async function generateImprovedCV(req: Request, res: Response, next: NextFunction) {
  try {
    const analysis = req.body.analysis as CvAnalysisResult | undefined;
    if (!analysis?.improvedCv) throw new HttpError(400, "CV analysis is required to generate an improved CV.");
    const originalCvText = typeof req.body.originalCvText === "string" ? req.body.originalCvText : "";
    const improvedCv = await cvAnalysisService.generateImprovedCv({ originalCvText, analysis });
    sendSuccess(res, { improvedCv });
  } catch (err) {
    next(err);
  }
}

export async function jobMatchCV(req: Request, res: Response, next: NextFunction) {
  try {
    const jobDescription = assertString(req.body.jobDescription, "jobDescription", 40, 50_000);
    const cvText = typeof req.body.cvText === "string" ? req.body.cvText : "";
    const cvAnalysis = req.body.cvAnalysis as CvAnalysisResult | undefined;
    if (!cvText.trim() && !cvAnalysis?.improvedCv) {
      throw new HttpError(400, "CV text or prior CV analysis is required for job matching.");
    }
    const jobMatchAnalysis = await cvAnalysisService.analyzeJobMatch({ cvText, cvAnalysis, jobDescription });
    sendSuccess(res, { jobMatchAnalysis });
  } catch (err) {
    next(err);
  }
}

export async function generateJobTailoredCV(req: Request, res: Response, next: NextFunction) {
  try {
    const jobDescription = assertString(req.body.jobDescription, "jobDescription", 40, 50_000);
    const jobMatchAnalysis = req.body.jobMatchAnalysis as JobMatchAnalysis | undefined;
    if (!jobMatchAnalysis) throw new HttpError(400, "Job match analysis is required to generate a job-tailored CV.");
    const originalCvText = typeof req.body.originalCvText === "string" ? req.body.originalCvText : "";
    const improvedCv = req.body.improvedCv as ImprovedCv | undefined;
    const cvAnalysis = req.body.cvAnalysis as CvAnalysisResult | undefined;
    if (!originalCvText.trim() && !improvedCv && !cvAnalysis?.improvedCv) {
      throw new HttpError(400, "Original CV text, improved CV data, or CV analysis is required.");
    }

    const tailoredCv = await cvAnalysisService.generateJobTailoredCv({
      originalCvText,
      improvedCv,
      cvAnalysis,
      jobDescription,
      jobMatchAnalysis,
    });
    sendSuccess(res, { improvedCv: tailoredCv });
  } catch (err) {
    next(err);
  }
}

export async function downloadImprovedDocx(req: Request, res: Response, next: NextFunction) {
  try {
    const improvedCv = req.body.improvedCv as ImprovedCv | undefined;
    if (!improvedCv) throw new HttpError(400, "Improved CV data is required.");
    const filename = cvDownloadFilename(req.body.variant, "docx");
    const buffer = await generateImprovedCvDocx(improvedCv);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
}

export async function downloadImprovedPdf(req: Request, res: Response, next: NextFunction) {
  try {
    const improvedCv = req.body.improvedCv as ImprovedCv | undefined;
    if (!improvedCv) throw new HttpError(400, "Improved CV data is required.");
    const filename = cvDownloadFilename(req.body.variant, "pdf");
    const buffer = await generateImprovedCvPdf(improvedCv);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
}

function cvDownloadFilename(variant: unknown, extension: "docx" | "pdf") {
  return variant === "job-tailored" ? `job-tailored-ats-cv.${extension}` : `ats-friendly-cv.${extension}`;
}

function analysisToCvProfile(analysis: CvAnalysisResult): CVProfile {
  return {
    detectedDomain: analysis.detectedDomain,
    detectedRole: analysis.detectedRole,
    confidenceScore: analysis.domainConfidenceScore,
    experienceLevel: analysis.experienceLevel,
    yearsOfExperience: analysis.yearsOfExperience || 0,
    technicalSkills: analysis.technicalSkills,
    softSkills: analysis.softSkills,
    tools: analysis.toolsAndTechnologies,
    projects: analysis.projects,
    achievements: analysis.achievements,
    education: analysis.education,
    weaknessesOrGaps: analysis.weaknessesOrGaps,
    suggestedInterviewTracks: analysis.suggestedInterviewTracks as CVProfile["suggestedInterviewTracks"],
    customQuestions: analysis.customInterviewQuestions,
    summary: analysis.summary,
    isFallback: analysis.aiUnavailable,
    atsScore: analysis.atsScore,
    atsGrade: analysis.atsGrade,
    missingKeywords: analysis.missingKeywords,
    atsIssues: analysis.atsIssues,
  };
}
