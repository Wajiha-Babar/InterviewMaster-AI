import { GoogleGenAI, Type } from "@google/genai";
import { env } from "../config/env";
import { AnswerPreparation, CVProfile, InterviewFeedback, InterviewQuestion } from "../types/domain";
import { fallbackAnswerPreparation, fallbackCVParser, fallbackCodeReview, fallbackFeedback, fallbackQuestions } from "./fallbacks";

class GeminiService {
  private client: GoogleGenAI | null = env.geminiApiKey ? new GoogleGenAI({ apiKey: env.geminiApiKey }) : null;

  isConfigured() {
    return Boolean(this.client);
  }

  async parseCV(input: { cvContent: string; fileType?: string; fileName?: string }): Promise<CVProfile> {
    if (!this.client) return fallbackCVParser(input.cvContent);
    try {
      const contents = input.fileType?.includes("pdf")
        ? {
            parts: [
              { inlineData: { data: input.cvContent.split(",")[1] || input.cvContent, mimeType: "application/pdf" } },
              { text: "Extract the CV into the requested JSON schema." },
            ],
          }
        : `CV text:\n${input.cvContent.slice(0, 40_000)}`;

      const response = await this.client.models.generateContent({
        model: "gemini-3.5-flash",
        contents,
        config: {
          systemInstruction: "Return strict JSON for an interview-prep CV profile. Do not include markdown.",
          responseMimeType: "application/json",
          responseSchema: cvSchema,
        },
      });
      return normalizeCV(JSON.parse(response.text || "{}"));
    } catch (err) {
      console.warn("CV parser unavailable; using local fallback.", err instanceof Error ? err.message : err);
      return fallbackCVParser(input.cvContent);
    }
  }

  async generateQuestions(input: { targetRole?: string; experienceLevel?: string; dreamCompany?: string; mode?: string; cvProfile?: CVProfile | null; jobDescription?: string; jobMatchAnalysis?: unknown }) {
    if (!this.client) return { source: "fallback" as const, questions: fallbackQuestions(input) };
    try {
      const response = await this.client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: JSON.stringify(redactInterviewInput(input)),
        config: {
          systemInstruction:
            "Return strict JSON only. Generate 5 high-quality interview coaching questions personalized to detectedDomain, detectedRole, targetRole, experienceLevel, CV skills, projects, achievements, weaknesses/gaps, job description, job match missing keywords, and practice mode. Do not fabricate experience. Avoid generic questions. Use CV projects for cv_deep_dive. Use job description for job_description questions. For technical roles include technical depth, tradeoffs, edge cases, and impact. For product/management include scenarios and cases. For healthcare use safe professional questions. Calibrate difficulty to seniority. Include strong model answers and practical rubrics.",
          responseMimeType: "application/json",
          responseSchema: questionsSchema,
        },
      });
      return { source: "gemini" as const, questions: normalizeQuestions(JSON.parse(response.text || "[]")) };
    } catch (err) {
      console.warn("Question generator unavailable; using local fallback.", err instanceof Error ? err.message : err);
      return { source: "fallback" as const, questions: fallbackQuestions(input) };
    }
  }

  async prepareAnswer(input: { question: InterviewQuestion | string; cvProfile?: CVProfile | null; targetRole?: string; experienceLevel?: string; jobDescription?: string }): Promise<AnswerPreparation> {
    const questionText = typeof input.question === "string" ? input.question : input.question.text;
    if (!this.client) return fallbackAnswerPreparation({ ...input, question: questionText });
    try {
      const response = await this.client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: JSON.stringify(redactInterviewInput({ ...input, question: input.question })),
        config: {
          systemInstruction:
            "Return strict JSON only. Act as a practical interview coach. Prepare a truthful, personalized answer strategy for the question using CV/domain/role/job context. Do not invent experience. For behavioral questions include STAR. For technical questions include concept, implementation, tradeoffs, edge cases, and performance. Provide concise professional sample answers and phrases to use/avoid.",
          responseMimeType: "application/json",
          responseSchema: answerPreparationSchema,
        },
      });
      return normalizePreparation({ ...JSON.parse(response.text || "{}"), source: "gemini", question: questionText });
    } catch (err) {
      console.warn("Answer preparation unavailable; using local fallback.", err instanceof Error ? err.message : err);
      return fallbackAnswerPreparation({ ...input, question: questionText });
    }
  }

  async evaluateAnswer(input: { question: string; answer: string; durationSeconds?: number; cvProfile?: CVProfile | null; targetRole?: string; experienceLevel?: string }): Promise<InterviewFeedback> {
    if (!this.client) return fallbackFeedback(input.question, input.answer, input.durationSeconds);
    try {
      const response = await this.client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: JSON.stringify({
          question: input.question,
          answer: input.answer.slice(0, 10_000),
          durationSeconds: input.durationSeconds,
          cvProfile: input.cvProfile ? redactCvProfile(input.cvProfile) : null,
          targetRole: input.targetRole,
          experienceLevel: input.experienceLevel,
        }),
        config: {
          systemInstruction:
            "Return strict JSON only. Evaluate the interview answer as a detailed coach. Be specific about missing points. For technical answers evaluate accuracy, depth, tradeoffs, edge cases, and examples. For behavioral answers evaluate STAR structure, specificity, ownership, and measurable result. Do not invent user experience. If answer is empty or too short, coach constructively. Include betterAnswer and bestAnswerExample.",
          responseMimeType: "application/json",
          responseSchema: feedbackSchema,
        },
      });
      return normalizeFeedback({ ...JSON.parse(response.text || "{}"), source: "gemini" });
    } catch (err) {
      console.warn("Feedback evaluator unavailable; using local fallback.", err instanceof Error ? err.message : err);
      return fallbackFeedback(input.question, input.answer, input.durationSeconds);
    }
  }

  async reviewCode(input: { code: string; language: string; questionText?: string }) {
    if (!this.client) return fallbackCodeReview(input.code, input.language);
    try {
      const response = await this.client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Review this code. Do not claim execution.\nQuestion: ${input.questionText || ""}\nLanguage: ${input.language}\n${input.code}`,
        config: {
          systemInstruction: "You are an AI code reviewer. Review logic, complexity, edge cases, and style. Do not claim the code was executed.",
          responseMimeType: "application/json",
        },
      });
      return JSON.parse(response.text || "{}");
    } catch (err) {
      console.warn("Code reviewer unavailable; using local fallback.", err instanceof Error ? err.message : err);
      return fallbackCodeReview(input.code, input.language);
    }
  }
}

const cvSchema = {
  type: Type.OBJECT,
  properties: {
    detectedDomain: { type: Type.STRING },
    detectedRole: { type: Type.STRING },
    confidenceScore: { type: Type.NUMBER },
    experienceLevel: { type: Type.STRING },
    yearsOfExperience: { type: Type.INTEGER },
    technicalSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
    softSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
    tools: { type: Type.ARRAY, items: { type: Type.STRING } },
    projects: { type: Type.ARRAY, items: { type: Type.STRING } },
    achievements: { type: Type.ARRAY, items: { type: Type.STRING } },
    education: { type: Type.ARRAY, items: { type: Type.STRING } },
    weaknessesOrGaps: { type: Type.ARRAY, items: { type: Type.STRING } },
    suggestedInterviewTracks: { type: Type.ARRAY, items: { type: Type.STRING } },
    customQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
    summary: { type: Type.STRING },
  },
  required: ["detectedDomain", "detectedRole", "confidenceScore", "experienceLevel", "yearsOfExperience", "technicalSkills", "softSkills", "tools", "projects", "achievements", "education", "weaknessesOrGaps", "suggestedInterviewTracks", "customQuestions", "summary"],
};

const questionsSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING },
      text: { type: Type.STRING },
      category: { type: Type.STRING },
      difficulty: { type: Type.STRING },
      whyAsked: { type: Type.STRING },
      whatInterviewerWants: { type: Type.ARRAY, items: { type: Type.STRING } },
      keyPointsToCover: { type: Type.ARRAY, items: { type: Type.STRING } },
      commonMistakes: { type: Type.ARRAY, items: { type: Type.STRING } },
      idealAnswerStructure: { type: Type.ARRAY, items: { type: Type.STRING } },
      sampleStrongAnswer: { type: Type.STRING },
      personalizedHints: { type: Type.ARRAY, items: { type: Type.STRING } },
      expectedSignals: { type: Type.ARRAY, items: { type: Type.STRING } },
      hint: { type: Type.STRING },
      prepTime: { type: Type.INTEGER },
      answerTime: { type: Type.INTEGER },
      followUpQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
      scoringRubric: {
        type: Type.OBJECT,
        properties: {
          clarity: { type: Type.STRING },
          relevance: { type: Type.STRING },
          depth: { type: Type.STRING },
          examples: { type: Type.STRING },
        },
        required: ["clarity", "relevance", "depth", "examples"],
      },
    },
    required: ["id", "text", "category", "difficulty", "whyAsked", "whatInterviewerWants", "keyPointsToCover", "commonMistakes", "idealAnswerStructure", "sampleStrongAnswer", "personalizedHints", "expectedSignals", "hint", "prepTime", "answerTime", "followUpQuestions", "scoringRubric"],
  },
};

const answerPreparationSchema = {
  type: Type.OBJECT,
  properties: {
    question: { type: Type.STRING },
    answerStrategy: { type: Type.STRING },
    starFramework: {
      type: Type.OBJECT,
      properties: {
        situation: { type: Type.STRING },
        task: { type: Type.STRING },
        action: { type: Type.STRING },
        result: { type: Type.STRING },
      },
    },
    technicalFramework: {
      type: Type.OBJECT,
      properties: {
        conceptExplanation: { type: Type.STRING },
        implementationApproach: { type: Type.STRING },
        tradeoffs: { type: Type.ARRAY, items: { type: Type.STRING } },
        edgeCases: { type: Type.ARRAY, items: { type: Type.STRING } },
        performanceConsiderations: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
    },
    keyPointsToMention: { type: Type.ARRAY, items: { type: Type.STRING } },
    phrasesToUse: { type: Type.ARRAY, items: { type: Type.STRING } },
    phrasesToAvoid: { type: Type.ARRAY, items: { type: Type.STRING } },
    sampleStrongAnswer: { type: Type.STRING },
    shorterVersion: { type: Type.STRING },
    seniorLevelVersion: { type: Type.STRING },
    followUpPrep: { type: Type.ARRAY, items: { type: Type.STRING } },
    confidenceTips: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ["question", "answerStrategy", "keyPointsToMention", "phrasesToUse", "phrasesToAvoid", "sampleStrongAnswer", "shorterVersion", "followUpPrep", "confidenceTips"],
};

const feedbackSchema = {
  type: Type.OBJECT,
  properties: {
    overallScore: { type: Type.INTEGER },
    answerQualityGrade: { type: Type.STRING },
    speechScore: { type: Type.INTEGER },
    contentScore: { type: Type.INTEGER },
    relevanceScore: { type: Type.INTEGER },
    structureScore: { type: Type.INTEGER },
    technicalDepthScore: { type: Type.INTEGER },
    confidenceScore: { type: Type.INTEGER },
    starBreakdown: {
      type: Type.OBJECT,
      properties: {
        situation: { type: Type.INTEGER },
        task: { type: Type.INTEGER },
        action: { type: Type.INTEGER },
        result: { type: Type.INTEGER },
        comments: { type: Type.STRING },
      },
      required: ["situation", "task", "action", "result", "comments"],
    },
    strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
    weakAreas: { type: Type.ARRAY, items: { type: Type.STRING } },
    missingPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
    improvementTips: { type: Type.ARRAY, items: { type: Type.STRING } },
    betterAnswer: { type: Type.STRING },
    bestAnswerExample: { type: Type.STRING },
    followUpQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
    nextPracticeRecommendation: { type: Type.STRING },
  },
  required: ["overallScore", "answerQualityGrade", "speechScore", "contentScore", "relevanceScore", "structureScore", "technicalDepthScore", "confidenceScore", "starBreakdown", "strengths", "weakAreas", "missingPoints", "improvementTips", "betterAnswer", "bestAnswerExample", "followUpQuestions", "nextPracticeRecommendation"],
};

function normalizeCV(profile: CVProfile): CVProfile {
  return {
    detectedDomain: profile.detectedDomain || "General / Unknown",
    detectedRole: profile.detectedRole || "General Candidate",
    confidenceScore: Number(profile.confidenceScore || 0.5),
    experienceLevel: profile.experienceLevel || "Unknown",
    yearsOfExperience: Number(profile.yearsOfExperience || 0),
    technicalSkills: profile.technicalSkills || [],
    softSkills: profile.softSkills || [],
    tools: profile.tools || [],
    projects: profile.projects || [],
    achievements: profile.achievements || [],
    education: profile.education || [],
    weaknessesOrGaps: profile.weaknessesOrGaps || [],
    suggestedInterviewTracks: profile.suggestedInterviewTracks || ["behavioral", "technical"],
    customQuestions: profile.customQuestions || [],
    summary: profile.summary || "CV parsed.",
  };
}

function normalizeQuestions(value: Partial<InterviewQuestion>[]): InterviewQuestion[] {
  const items = Array.isArray(value) ? value : [];
  return items.slice(0, 7).map((question, index) => ({
    id: question.id || `q_gemini_${index + 1}`,
    text: question.text || "Walk me through a relevant example from your CV.",
    category: normalizeCategory(question.category),
    difficulty: question.difficulty === "easy" || question.difficulty === "hard" ? question.difficulty : "medium",
    whyAsked: question.whyAsked || "This question tests role readiness and depth.",
    whatInterviewerWants: list(question.whatInterviewerWants, ["Specific evidence", "Clear ownership", "Practical judgment"]),
    keyPointsToCover: list(question.keyPointsToCover, ["Context", "Action", "Result"]),
    commonMistakes: list(question.commonMistakes, ["Being too generic", "Skipping measurable impact"]),
    idealAnswerStructure: list(question.idealAnswerStructure, ["Context", "Decision", "Action", "Result"]),
    sampleStrongAnswer: question.sampleStrongAnswer || "A strong answer uses one truthful project example, explains your ownership, covers tradeoffs, and ends with impact.",
    personalizedHints: list(question.personalizedHints, ["Use truthful evidence from your CV."]),
    expectedSignals: list(question.expectedSignals, ["depth", "specificity", "impact"]),
    hint: question.hint || "Answer with a concrete example and measurable outcome.",
    prepTime: Number(question.prepTime || 45),
    answerTime: Number(question.answerTime || 150),
    followUpQuestions: list(question.followUpQuestions, ["What would you improve next time?"]),
    scoringRubric: {
      clarity: question.scoringRubric?.clarity || "Clear and concise.",
      relevance: question.scoringRubric?.relevance || "Relevant to the target role.",
      depth: question.scoringRubric?.depth || "Shows practical understanding.",
      examples: question.scoringRubric?.examples || "Uses concrete examples.",
    },
  }));
}

function normalizePreparation(value: Partial<AnswerPreparation>): AnswerPreparation {
  return {
    source: value.source === "gemini" ? "gemini" : "fallback",
    question: value.question || "",
    answerStrategy: value.answerStrategy || "Use one truthful example, structure it clearly, and connect it to the role.",
    starFramework: value.starFramework,
    technicalFramework: value.technicalFramework,
    keyPointsToMention: list(value.keyPointsToMention, ["Context", "Ownership", "Action", "Result"]),
    phrasesToUse: list(value.phrasesToUse, ["I owned...", "The result was..."]),
    phrasesToAvoid: list(value.phrasesToAvoid, ["We just...", "It was perfect"]),
    sampleStrongAnswer: value.sampleStrongAnswer || "Use a concise, truthful answer with context, action, result, and learning.",
    shorterVersion: value.shorterVersion || "Context, action, result, learning.",
    seniorLevelVersion: value.seniorLevelVersion,
    followUpPrep: list(value.followUpPrep, ["What tradeoff did you make?"]),
    confidenceTips: list(value.confidenceTips, ["Pause briefly before answering."]),
  };
}

function normalizeFeedback(value: Partial<InterviewFeedback>): InterviewFeedback {
  const overallScore = score(value.overallScore);
  return {
    source: value.source === "gemini" ? "gemini" : "fallback",
    overallScore,
    answerQualityGrade: value.answerQualityGrade || (overallScore >= 85 ? "Excellent" : overallScore >= 70 ? "Good" : overallScore >= 50 ? "Average" : "Weak"),
    speechScore: score(value.speechScore),
    contentScore: score(value.contentScore),
    relevanceScore: score(value.relevanceScore),
    structureScore: score(value.structureScore),
    technicalDepthScore: score(value.technicalDepthScore),
    confidenceScore: score(value.confidenceScore),
    starBreakdown: {
      situation: score(value.starBreakdown?.situation),
      task: score(value.starBreakdown?.task),
      action: score(value.starBreakdown?.action),
      result: score(value.starBreakdown?.result),
      comments: value.starBreakdown?.comments || "Review STAR completeness and specificity.",
    },
    strengths: list(value.strengths, ["Relevant answer material"]),
    weakAreas: list(value.weakAreas, ["Needs more specificity"]),
    missingPoints: list(value.missingPoints, ["Measurable impact"]),
    improvementTips: list(value.improvementTips, ["Use STAR and add concrete evidence."]),
    betterAnswer: value.betterAnswer || "Add context, your action, and the measurable result.",
    bestAnswerExample: value.bestAnswerExample || "A best answer uses a truthful example, explains tradeoffs, and ends with impact.",
    followUpQuestions: list(value.followUpQuestions, ["What would you improve next time?"]),
    nextPracticeRecommendation: value.nextPracticeRecommendation || "Practice one deeper CV example next.",
  };
}

function normalizeCategory(value: unknown): InterviewQuestion["category"] {
  const allowed = new Set(["behavioral", "technical", "system_design", "role_specific", "cv_deep_dive", "job_description", "coding", "case_study"]);
  return typeof value === "string" && allowed.has(value) ? (value as InterviewQuestion["category"]) : "role_specific";
}

function list(value: unknown, fallback: string[]) {
  return Array.isArray(value) && value.length ? value.map(String).filter(Boolean).slice(0, 8) : fallback;
}

function score(value: unknown) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
}

function redactInterviewInput<T extends { cvProfile?: CVProfile | null }>(input: T) {
  return { ...input, cvProfile: input.cvProfile ? redactCvProfile(input.cvProfile) : null };
}

function redactCvProfile(profile: CVProfile) {
  return {
    detectedDomain: profile.detectedDomain,
    detectedRole: profile.detectedRole,
    experienceLevel: profile.experienceLevel,
    yearsOfExperience: profile.yearsOfExperience,
    technicalSkills: profile.technicalSkills?.slice(0, 20),
    softSkills: profile.softSkills?.slice(0, 12),
    tools: profile.tools?.slice(0, 20),
    projects: profile.projects?.slice(0, 8),
    achievements: profile.achievements?.slice(0, 8),
    weaknessesOrGaps: profile.weaknessesOrGaps?.slice(0, 8),
    missingKeywords: profile.missingKeywords?.slice(0, 12),
    summary: profile.summary,
  };
}

export const aiService = new GeminiService();
