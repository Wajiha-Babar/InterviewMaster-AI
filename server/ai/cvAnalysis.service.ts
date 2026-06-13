import { GoogleGenAI, Type } from "@google/genai";
import { env } from "../config/env";
import { CvAnalysisResult, ImprovedCv, JobMatchAnalysis } from "../types/domain";
import { fallbackCVParser } from "./fallbacks";

class CvAnalysisService {
  private client: GoogleGenAI | null = env.geminiApiKey ? new GoogleGenAI({ apiKey: env.geminiApiKey }) : null;

  isConfigured() {
    return Boolean(this.client);
  }

  async analyzeCv(input: { cvText: string; sourceType: string; warnings?: string[] }): Promise<CvAnalysisResult> {
    if (!this.client) {
      return fallbackCvAnalysis(input.cvText, input.sourceType, input.warnings || [], true);
    }

    try {
      const response = await this.client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Analyze this CV against general ATS best practices. Do not claim guaranteed ATS success. CV text:\n${input.cvText.slice(0, 45_000)}`,
        config: {
          systemInstruction: "Return strict JSON for ATS-friendly resume analysis. Preserve truthfulness. Do not invent degrees, jobs, employers, certifications, or metrics.",
          responseMimeType: "application/json",
          responseSchema: cvAnalysisSchema,
        },
      });
      return normalizeAnalysis(JSON.parse(response.text || "{}"), input.sourceType, input.warnings || []);
    } catch (err) {
      console.warn("CV ATS analysis unavailable; using local fallback.", err instanceof Error ? err.message : err);
      return fallbackCvAnalysis(input.cvText, input.sourceType, input.warnings || [], true);
    }
  }

  async generateImprovedCv(input: { originalCvText?: string; analysis: CvAnalysisResult }): Promise<ImprovedCv> {
    if (!this.client) return input.analysis.improvedCv;
    try {
      const response = await this.client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: JSON.stringify({
          originalCvText: input.originalCvText?.slice(0, 45_000) || "",
          analysis: input.analysis,
        }),
        config: {
          systemInstruction: "Generate an ATS-friendly CV structure. Use only truthful information from the original CV/analysis. Use placeholders only for missing information.",
          responseMimeType: "application/json",
          responseSchema: improvedCvSchema,
        },
      });
      return normalizeImprovedCv(JSON.parse(response.text || "{}"));
    } catch (err) {
      console.warn("Improved CV generation unavailable; using analysis draft.", err instanceof Error ? err.message : err);
      return input.analysis.improvedCv;
    }
  }

  async analyzeJobMatch(input: { cvText?: string; cvAnalysis?: CvAnalysisResult; jobDescription: string }): Promise<JobMatchAnalysis> {
    const cvContext = buildCvContext(input.cvText, input.cvAnalysis);
    if (!this.client) {
      return fallbackJobMatch(cvContext, input.jobDescription);
    }

    try {
      const response = await this.client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: JSON.stringify({
          cvText: input.cvText?.slice(0, 45_000) || "",
          cvAnalysis: input.cvAnalysis || null,
          jobDescription: input.jobDescription.slice(0, 30_000),
        }),
        config: {
          systemInstruction:
            "Return strict JSON only. Estimate job-specific ATS match honestly; do not promise hiring success. Separate hard requirements from preferred requirements. Do not fabricate experience, employers, education, certifications, years, metrics, or skills. If evidence is missing from the CV, mark it as a gap and recommend adding it only if truthful. Provide practical section-specific CV updates.",
          responseMimeType: "application/json",
          responseSchema: jobMatchSchema,
        },
      });
      return normalizeJobMatch(JSON.parse(response.text || "{}"));
    } catch (err) {
      console.warn("Job-specific ATS matching unavailable; using local fallback.", err instanceof Error ? err.message : err);
      return fallbackJobMatch(cvContext, input.jobDescription);
    }
  }

  async generateJobTailoredCv(input: {
    originalCvText?: string;
    improvedCv?: ImprovedCv;
    cvAnalysis?: CvAnalysisResult;
    jobDescription: string;
    jobMatchAnalysis: JobMatchAnalysis;
  }): Promise<ImprovedCv> {
    const baseCv = input.improvedCv || input.cvAnalysis?.improvedCv;
    if (!this.client) {
      return buildJobTailoredFallbackCv(baseCv, input.jobDescription, input.jobMatchAnalysis);
    }

    try {
      const response = await this.client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: JSON.stringify({
          originalCvText: input.originalCvText?.slice(0, 45_000) || "",
          currentImprovedCv: baseCv || null,
          jobDescription: input.jobDescription.slice(0, 30_000),
          jobMatchAnalysis: input.jobMatchAnalysis,
        }),
        config: {
          systemInstruction:
            "Generate a job-tailored ATS-friendly CV structure as strict JSON. Use only truthful information from the CV and existing analysis. Do not invent jobs, employers, degrees, certifications, dates, metrics, or skills. Missing requirements may be included only as recommendation-style placeholders that tell the user to add them if true. Keep formatting simple: no tables, icons, images, columns, or graphics.",
          responseMimeType: "application/json",
          responseSchema: improvedCvSchema,
        },
      });
      return normalizeImprovedCv(JSON.parse(response.text || "{}"));
    } catch (err) {
      console.warn("Job-tailored CV generation unavailable; using local fallback.", err instanceof Error ? err.message : err);
      return buildJobTailoredFallbackCv(baseCv, input.jobDescription, input.jobMatchAnalysis);
    }
  }
}

function fallbackCvAnalysis(cvText: string, sourceType: string, warnings: string[], aiUnavailable = false): CvAnalysisResult {
  const profile = fallbackCVParser(cvText);
  const hasMetrics = /\d+%|\$\d+|\d+\s*(users|requests|revenue|latency|patients|teams)/i.test(cvText);
  const hasEducation = /(university|college|bachelor|master|degree|certification|certified)/i.test(cvText);
  const hasSkills = profile.technicalSkills.length >= 4;
  const atsScore = Math.max(35, Math.min(84, 48 + (hasMetrics ? 12 : 0) + (hasEducation ? 8 : 0) + (hasSkills ? 12 : 0) + profile.projects.length * 2));
  const improvedCv = buildImprovedCv(cvText, profile.detectedRole, profile.technicalSkills, profile.projects, profile.education, profile.achievements);

  return {
    detectedDomain: profile.detectedDomain,
    detectedRole: profile.detectedRole,
    domainConfidenceScore: profile.confidenceScore,
    atsScore: aiUnavailable ? null : atsScore,
    atsGrade: gradeFromScore(atsScore),
    summary: aiUnavailable
      ? "AI ATS analysis is temporarily unavailable. Resume text was extracted and a conservative local draft was prepared."
      : `Estimated ${profile.detectedDomain} resume with ${profile.yearsOfExperience || "unclear"} years of experience.`,
    experienceLevel: mapExperienceLevel(profile.yearsOfExperience),
    yearsOfExperience: profile.yearsOfExperience || null,
    technicalSkills: profile.technicalSkills,
    softSkills: profile.softSkills,
    toolsAndTechnologies: profile.tools,
    education: profile.education,
    certifications: extractLines(cvText, /(certification|certified|certificate)/i, 4),
    projects: profile.projects,
    achievements: profile.achievements,
    workExperienceHighlights: extractLines(cvText, /(engineer|manager|analyst|developer|lead|worked|built|managed|designed)/i, 5),
    weaknessesOrGaps: profile.weaknessesOrGaps,
    missingKeywords: ["role-specific keywords from target job description", "measurable impact metrics", "tools and platforms"],
    atsIssues: [
      {
        issue: hasMetrics ? "Some quantified impact detected" : "Limited quantified achievements",
        severity: hasMetrics ? "low" : "high",
        section: "Experience",
        recommendation: hasMetrics ? "Keep metrics close to action verbs." : "Add metrics such as %, $, time saved, users served, or latency reduced.",
      },
      {
        issue: hasSkills ? "Skills section has useful keywords" : "Skills section may be too thin",
        severity: hasSkills ? "low" : "medium",
        section: "Skills",
        recommendation: "Group technical skills by category and mirror truthful keywords from target roles.",
      },
    ],
    sectionScores: {
      formatting: 72,
      keywords: hasSkills ? 76 : 52,
      experience: profile.projects.length ? 70 : 50,
      skills: hasSkills ? 78 : 55,
      achievements: hasMetrics ? 76 : 45,
      education: hasEducation ? 75 : 50,
      readability: 72,
    },
    suggestedTargetRoles: [profile.detectedRole, ...roleSuggestions(profile.detectedDomain)],
    suggestedInterviewTracks: profile.suggestedInterviewTracks,
    customInterviewQuestions: profile.customQuestions,
    improvedCv,
    sourceType,
    extractionWarnings: warnings,
    aiUnavailable,
  };
}

function buildImprovedCv(cvText: string, role: string, skills: string[], projects: string[], education: string[], achievements: string[]): ImprovedCv {
  return {
    candidateName: extractCandidateName(cvText),
    headline: `${role} | ${skills.slice(0, 3).join(" | ") || "Interview-ready professional"}`,
    professionalSummary: `Results-focused ${role} with experience across ${skills.slice(0, 5).join(", ") || "core professional skills"}. Strong resume improvements should emphasize measurable achievements, clear ownership, and role-specific keywords.`,
    skills: skills.length ? skills : ["Add role-specific skills from your target job description"],
    experienceBullets: achievements.length ? achievements.map((item) => bulletize(item)) : ["Add 3-5 achievement bullets with action verb, scope, and measurable result."],
    projectBullets: projects.length ? projects.map((item) => bulletize(item)) : ["Add project bullets that explain problem, technical approach, and outcome."],
    education: education.length ? education : ["Add education details if relevant."],
    certifications: extractLines(cvText, /(certification|certified|certificate)/i, 4),
    atsKeywords: [...new Set([...skills, role, "collaboration", "communication", "problem solving"])].slice(0, 18),
  };
}

function buildCvContext(cvText?: string, cvAnalysis?: CvAnalysisResult) {
  const analysisText = cvAnalysis
    ? [
        cvAnalysis.detectedRole,
        cvAnalysis.detectedDomain,
        ...cvAnalysis.technicalSkills,
        ...cvAnalysis.toolsAndTechnologies,
        ...cvAnalysis.projects,
        ...cvAnalysis.achievements,
        ...cvAnalysis.education,
        ...cvAnalysis.certifications,
        cvAnalysis.summary,
      ].join("\n")
    : "";
  return [cvText || "", analysisText].join("\n").trim();
}

function fallbackJobMatch(cvContext: string, jobDescription: string): JobMatchAnalysis {
  const cvKeywords = extractKeywords(cvContext);
  const jobKeywords = extractKeywords(jobDescription);
  const matchedKeywords = jobKeywords.filter((keyword) => cvKeywords.includes(keyword)).slice(0, 24);
  const missingKeywords = jobKeywords.filter((keyword) => !cvKeywords.includes(keyword)).slice(0, 24);
  const requiredSkills = extractRequirementKeywords(jobDescription, /(required|must have|minimum|responsibilities|qualifications|you will)/i).slice(0, 14);
  const optionalSkills = extractRequirementKeywords(jobDescription, /(preferred|nice to have|bonus|plus|desirable)/i).slice(0, 12);
  const overlapRatio = jobKeywords.length ? matchedKeywords.length / jobKeywords.length : 0;
  const score = clampScore(Math.round(35 + overlapRatio * 45));
  const role = detectRoleFromText(jobDescription);
  const seniority = detectSeniorityFromText(jobDescription);

  return {
    matchScore: score,
    matchGrade: matchGradeFromScore(score),
    targetRoleDetected: role,
    jobSeniorityDetected: seniority,
    matchedKeywords,
    missingKeywords,
    importantRequiredSkills: requiredSkills.length ? requiredSkills : jobKeywords.slice(0, 10),
    optionalSkills,
    roleAlignmentSummary:
      "AI job matching is temporarily unavailable. This is basic local analysis based on keyword overlap only, so treat the score as a rough directional signal.",
    experienceAlignment: {
      score,
      summary: "Basic local analysis cannot verify depth of experience. Review the job seniority and make sure your truthful experience is visible.",
    },
    skillsAlignment: {
      score: clampScore(40 + matchedKeywords.length * 4),
      summary: matchedKeywords.length ? `Detected overlap with ${matchedKeywords.slice(0, 6).join(", ")}.` : "No strong skill overlap was detected locally.",
    },
    keywordAlignment: {
      score,
      summary: "Score is based on visible keyword overlap between the CV context and job description.",
    },
    educationAlignment: {
      score: /degree|bachelor|master|university|college|certification/i.test(`${cvContext}\n${jobDescription}`) ? 60 : 45,
      summary: "Education fit was not deeply evaluated by local fallback.",
    },
    gaps: missingKeywords.slice(0, 6).map((keyword) => ({
      gap: `Missing visible keyword: ${keyword}`,
      severity: "medium" as const,
      recommendation: `Add ${keyword} only if it reflects your real experience, project work, or training.`,
    })),
    recommendedCvUpdates: [
      {
        section: "Skills",
        currentIssue: "Some job-description keywords are not visible in the CV context.",
        suggestedUpdate: "Mirror truthful required tools, frameworks, and skills from the job description in a grouped skills section.",
      },
      {
        section: "Experience",
        currentIssue: "Local fallback cannot verify role-specific impact depth.",
        suggestedUpdate: "Rewrite relevant bullets with action, scope, technology, and measurable outcome for this target role.",
      },
    ],
    tailoredCvStrategy:
      "AI job matching is temporarily unavailable. Use this basic local keyword overlap as a checklist, then only add missing requirements that are accurate and defensible.",
    aiUnavailable: true,
    localAnalysisOnly: true,
  };
}

function buildJobTailoredFallbackCv(baseCv: ImprovedCv | undefined, jobDescription: string, match: JobMatchAnalysis): ImprovedCv {
  const role = match.targetRoleDetected || detectRoleFromText(jobDescription);
  const importantKeywords = [...match.matchedKeywords, ...match.importantRequiredSkills].filter(Boolean);
  return normalizeImprovedCv({
    ...(baseCv || {}),
    headline: baseCv?.headline ? `${role} | ${baseCv.headline}`.slice(0, 160) : `${role} | ATS-friendly candidate profile`,
    professionalSummary: [
      baseCv?.professionalSummary || `Results-focused candidate aligned to ${role}.`,
      "Tailor this summary to the target job using only truthful achievements, tools, and domain experience.",
    ].join(" "),
    skills: uniqueList([...(baseCv?.skills || []), ...importantKeywords]).slice(0, 24),
    experienceBullets: [
      ...(baseCv?.experienceBullets || []),
      ...match.recommendedCvUpdates.slice(0, 3).map((update) => `If accurate, update ${update.section}: ${update.suggestedUpdate}`),
    ].slice(0, 12),
    projectBullets: baseCv?.projectBullets || [],
    education: baseCv?.education || [],
    certifications: baseCv?.certifications || [],
    atsKeywords: uniqueList([...(baseCv?.atsKeywords || []), ...importantKeywords, ...match.optionalSkills]).slice(0, 30),
  });
}

function normalizeAnalysis(value: Partial<CvAnalysisResult>, sourceType: string, warnings: string[]): CvAnalysisResult {
  const atsScore = value.atsScore == null ? null : clampScore(value.atsScore);
  return {
    detectedDomain: value.detectedDomain || "General / Unknown",
    detectedRole: value.detectedRole || "General Candidate",
    domainConfidenceScore: clampConfidence(value.domainConfidenceScore ?? 0.5),
    atsScore,
    atsGrade: value.atsGrade || gradeFromScore(atsScore ?? 0),
    summary: value.summary || "CV analyzed against general ATS best practices.",
    experienceLevel: value.experienceLevel || "Mid Level",
    yearsOfExperience: typeof value.yearsOfExperience === "number" ? value.yearsOfExperience : null,
    technicalSkills: value.technicalSkills || [],
    softSkills: value.softSkills || [],
    toolsAndTechnologies: value.toolsAndTechnologies || [],
    education: value.education || [],
    certifications: value.certifications || [],
    projects: value.projects || [],
    achievements: value.achievements || [],
    workExperienceHighlights: value.workExperienceHighlights || [],
    weaknessesOrGaps: value.weaknessesOrGaps || [],
    missingKeywords: value.missingKeywords || [],
    atsIssues: value.atsIssues || [],
    sectionScores: {
      formatting: clampScore(value.sectionScores?.formatting ?? 60),
      keywords: clampScore(value.sectionScores?.keywords ?? 60),
      experience: clampScore(value.sectionScores?.experience ?? 60),
      skills: clampScore(value.sectionScores?.skills ?? 60),
      achievements: clampScore(value.sectionScores?.achievements ?? 60),
      education: clampScore(value.sectionScores?.education ?? 60),
      readability: clampScore(value.sectionScores?.readability ?? 60),
    },
    suggestedTargetRoles: value.suggestedTargetRoles || [],
    suggestedInterviewTracks: value.suggestedInterviewTracks || ["behavioral", "technical"],
    customInterviewQuestions: value.customInterviewQuestions || [],
    improvedCv: normalizeImprovedCv(value.improvedCv || {}),
    sourceType,
    extractionWarnings: warnings,
  };
}

function normalizeImprovedCv(value: Partial<ImprovedCv>): ImprovedCv {
  return {
    candidateName: value.candidateName,
    headline: value.headline || "Target Role | Key Skills",
    professionalSummary: value.professionalSummary || "Add a concise 3-4 line professional summary aligned to the target role.",
    skills: value.skills || [],
    experienceBullets: value.experienceBullets || [],
    projectBullets: value.projectBullets || [],
    education: value.education || [],
    certifications: value.certifications || [],
    atsKeywords: value.atsKeywords || [],
  };
}

function normalizeJobMatch(value: Partial<JobMatchAnalysis>): JobMatchAnalysis {
  const score = clampScore(value.matchScore ?? 0);
  return {
    matchScore: score,
    matchGrade: value.matchGrade || matchGradeFromScore(score),
    targetRoleDetected: value.targetRoleDetected || "Target role unclear",
    jobSeniorityDetected: value.jobSeniorityDetected || "Seniority unclear",
    matchedKeywords: uniqueList(value.matchedKeywords || []).slice(0, 30),
    missingKeywords: uniqueList(value.missingKeywords || []).slice(0, 30),
    importantRequiredSkills: uniqueList(value.importantRequiredSkills || []).slice(0, 24),
    optionalSkills: uniqueList(value.optionalSkills || []).slice(0, 24),
    roleAlignmentSummary: value.roleAlignmentSummary || "Role alignment was estimated from the CV and job description.",
    experienceAlignment: normalizeAlignment(value.experienceAlignment),
    skillsAlignment: normalizeAlignment(value.skillsAlignment),
    keywordAlignment: normalizeAlignment(value.keywordAlignment),
    educationAlignment: normalizeAlignment(value.educationAlignment),
    gaps: (value.gaps || []).slice(0, 10).map((gap) => ({
      gap: gap.gap || "Unclear gap",
      severity: gap.severity === "high" || gap.severity === "low" ? gap.severity : "medium",
      recommendation: gap.recommendation || "Add this only if it is truthful and relevant.",
    })),
    recommendedCvUpdates: (value.recommendedCvUpdates || []).slice(0, 10).map((update) => ({
      section: update.section || "CV",
      currentIssue: update.currentIssue || "The current section may not fully reflect the target job.",
      suggestedUpdate: update.suggestedUpdate || "Add truthful, job-relevant detail with clear impact.",
    })),
    tailoredCvStrategy: value.tailoredCvStrategy || "Tailor the CV toward the job description using only truthful evidence.",
    aiUnavailable: value.aiUnavailable,
    localAnalysisOnly: value.localAnalysisOnly,
  };
}

function normalizeAlignment(value: JobMatchAnalysis["experienceAlignment"] | undefined) {
  return {
    score: clampScore(value?.score ?? 0),
    summary: value?.summary || "Alignment was estimated from available CV and job description evidence.",
  };
}

const improvedCvSchema = {
  type: Type.OBJECT,
  properties: {
    candidateName: { type: Type.STRING },
    headline: { type: Type.STRING },
    professionalSummary: { type: Type.STRING },
    skills: { type: Type.ARRAY, items: { type: Type.STRING } },
    experienceBullets: { type: Type.ARRAY, items: { type: Type.STRING } },
    projectBullets: { type: Type.ARRAY, items: { type: Type.STRING } },
    education: { type: Type.ARRAY, items: { type: Type.STRING } },
    certifications: { type: Type.ARRAY, items: { type: Type.STRING } },
    atsKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ["headline", "professionalSummary", "skills", "experienceBullets", "projectBullets", "education", "certifications", "atsKeywords"],
};

const alignmentSchema = {
  type: Type.OBJECT,
  properties: {
    score: { type: Type.INTEGER },
    summary: { type: Type.STRING },
  },
  required: ["score", "summary"],
};

const jobMatchSchema = {
  type: Type.OBJECT,
  properties: {
    matchScore: { type: Type.INTEGER },
    matchGrade: { type: Type.STRING },
    targetRoleDetected: { type: Type.STRING },
    jobSeniorityDetected: { type: Type.STRING },
    matchedKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
    missingKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
    importantRequiredSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
    optionalSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
    roleAlignmentSummary: { type: Type.STRING },
    experienceAlignment: alignmentSchema,
    skillsAlignment: alignmentSchema,
    keywordAlignment: alignmentSchema,
    educationAlignment: alignmentSchema,
    gaps: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          gap: { type: Type.STRING },
          severity: { type: Type.STRING },
          recommendation: { type: Type.STRING },
        },
        required: ["gap", "severity", "recommendation"],
      },
    },
    recommendedCvUpdates: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          section: { type: Type.STRING },
          currentIssue: { type: Type.STRING },
          suggestedUpdate: { type: Type.STRING },
        },
        required: ["section", "currentIssue", "suggestedUpdate"],
      },
    },
    tailoredCvStrategy: { type: Type.STRING },
  },
  required: [
    "matchScore",
    "matchGrade",
    "targetRoleDetected",
    "jobSeniorityDetected",
    "matchedKeywords",
    "missingKeywords",
    "importantRequiredSkills",
    "optionalSkills",
    "roleAlignmentSummary",
    "experienceAlignment",
    "skillsAlignment",
    "keywordAlignment",
    "educationAlignment",
    "gaps",
    "recommendedCvUpdates",
    "tailoredCvStrategy",
  ],
};

const cvAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    detectedDomain: { type: Type.STRING },
    detectedRole: { type: Type.STRING },
    domainConfidenceScore: { type: Type.NUMBER },
    atsScore: { type: Type.INTEGER },
    atsGrade: { type: Type.STRING },
    summary: { type: Type.STRING },
    experienceLevel: { type: Type.STRING },
    yearsOfExperience: { type: Type.INTEGER },
    technicalSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
    softSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
    toolsAndTechnologies: { type: Type.ARRAY, items: { type: Type.STRING } },
    education: { type: Type.ARRAY, items: { type: Type.STRING } },
    certifications: { type: Type.ARRAY, items: { type: Type.STRING } },
    projects: { type: Type.ARRAY, items: { type: Type.STRING } },
    achievements: { type: Type.ARRAY, items: { type: Type.STRING } },
    workExperienceHighlights: { type: Type.ARRAY, items: { type: Type.STRING } },
    weaknessesOrGaps: { type: Type.ARRAY, items: { type: Type.STRING } },
    missingKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
    atsIssues: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          issue: { type: Type.STRING },
          severity: { type: Type.STRING },
          section: { type: Type.STRING },
          recommendation: { type: Type.STRING },
        },
        required: ["issue", "severity", "section", "recommendation"],
      },
    },
    sectionScores: {
      type: Type.OBJECT,
      properties: {
        formatting: { type: Type.INTEGER },
        keywords: { type: Type.INTEGER },
        experience: { type: Type.INTEGER },
        skills: { type: Type.INTEGER },
        achievements: { type: Type.INTEGER },
        education: { type: Type.INTEGER },
        readability: { type: Type.INTEGER },
      },
      required: ["formatting", "keywords", "experience", "skills", "achievements", "education", "readability"],
    },
    suggestedTargetRoles: { type: Type.ARRAY, items: { type: Type.STRING } },
    suggestedInterviewTracks: { type: Type.ARRAY, items: { type: Type.STRING } },
    customInterviewQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
    improvedCv: improvedCvSchema,
  },
  required: ["detectedDomain", "detectedRole", "domainConfidenceScore", "atsScore", "atsGrade", "summary", "experienceLevel", "technicalSkills", "softSkills", "toolsAndTechnologies", "education", "certifications", "projects", "achievements", "workExperienceHighlights", "weaknessesOrGaps", "missingKeywords", "atsIssues", "sectionScores", "suggestedTargetRoles", "suggestedInterviewTracks", "customInterviewQuestions", "improvedCv"],
};

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
}

function clampConfidence(value: number) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

function gradeFromScore(score: number) {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Needs Improvement";
  return "Weak";
}

function matchGradeFromScore(score: number): JobMatchAnalysis["matchGrade"] {
  if (score >= 85) return "Excellent Match";
  if (score >= 70) return "Strong Match";
  if (score >= 50) return "Moderate Match";
  return "Weak Match";
}

function mapExperienceLevel(years: number): CvAnalysisResult["experienceLevel"] {
  if (years >= 15) return "Executive";
  if (years >= 9) return "Lead";
  if (years >= 6) return "Senior";
  if (years >= 3) return "Mid Level";
  if (years >= 1) return "Junior";
  return "Entry Level";
}

function extractLines(text: string, pattern: RegExp, limit: number) {
  return text.split(/[.\n]/).map((line) => line.trim()).filter((line) => line.length > 8 && pattern.test(line)).slice(0, limit);
}

function extractCandidateName(text: string) {
  const firstLine = text.split(/\n/).map((line) => line.trim()).find((line) => /^[A-Za-z][A-Za-z .'-]{2,60}$/.test(line));
  return firstLine;
}

function bulletize(value: string) {
  return value.replace(/^[-*•]\s*/, "").trim();
}

function roleSuggestions(domain: string) {
  if (domain.includes("Backend")) return ["Full Stack Developer", "Platform Engineer"];
  if (domain.includes("Frontend")) return ["React Developer", "UI Engineer"];
  if (domain.includes("Data")) return ["Analytics Engineer", "Machine Learning Engineer"];
  if (domain.includes("Product")) return ["Technical Product Manager", "Product Owner"];
  return ["Specialist", "Associate"];
}

function extractKeywords(text: string) {
  const stopWords = new Set([
    "and",
    "the",
    "with",
    "for",
    "from",
    "that",
    "this",
    "your",
    "you",
    "our",
    "are",
    "will",
    "have",
    "has",
    "into",
    "using",
    "within",
    "across",
    "work",
    "team",
    "role",
    "candidate",
    "experience",
    "skills",
    "ability",
    "responsibilities",
    "requirements",
  ]);
  const phrases = text.match(/\b[A-Z][A-Za-z0-9+#.]+(?:\s+[A-Z][A-Za-z0-9+#.]+){0,2}\b/g) || [];
  const words = text.toLowerCase().match(/\b[a-z][a-z0-9+#.]{2,}\b/g) || [];
  return uniqueList([
    ...phrases.map((phrase) => phrase.trim()).filter((phrase) => phrase.length > 2),
    ...words.filter((word) => !stopWords.has(word) && !/^\d+$/.test(word)),
  ]).slice(0, 80);
}

function extractRequirementKeywords(text: string, marker: RegExp) {
  const lines = text
    .split(/\n|[.;]/)
    .map((line) => line.trim())
    .filter((line) => line.length > 8 && marker.test(line));
  return uniqueList(lines.flatMap((line) => extractKeywords(line))).slice(0, 30);
}

function detectRoleFromText(text: string) {
  const roleMatch = text.match(/\b(frontend|backend|full stack|software|data|machine learning|ai|devops|cloud|product|project|qa|security|cybersecurity|mobile|react|node)\s+(engineer|developer|scientist|analyst|manager|specialist|architect|lead)\b/i);
  if (roleMatch) return titleCase(roleMatch[0]);
  const titleLine = text
    .split(/\n/)
    .map((line) => line.trim())
    .find((line) => /(engineer|developer|scientist|analyst|manager|specialist|architect|lead)/i.test(line) && line.length < 90);
  return titleLine || "Target role unclear";
}

function detectSeniorityFromText(text: string) {
  if (/\b(principal|staff|head of|director)\b/i.test(text)) return "Lead / Principal";
  if (/\b(senior|sr\.?|lead)\b/i.test(text)) return "Senior";
  if (/\b(junior|entry|associate|graduate)\b/i.test(text)) return "Entry / Junior";
  if (/\b(mid|intermediate|3\+|4\+|5\+)\b/i.test(text)) return "Mid Level";
  return "Seniority unclear";
}

function uniqueList(items: string[]) {
  const seen = new Set<string>();
  return items
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item) => {
      const key = item.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function titleCase(value: string) {
  return value.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}

export const cvAnalysisService = new CvAnalysisService();
