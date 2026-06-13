export type InterviewMode = "daily" | "mock" | "coding" | "behavioral";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  targetRole?: string;
  experienceLevel?: string;
  dreamCompany?: string;
  interviewDate?: string;
  preferredMode?: InterviewMode;
  streak: number;
  completedSessionsCount: number;
  createdAt?: string;
}

export interface CVProfile {
  id?: string;
  detectedDomain: string;
  detectedRole: string;
  confidenceScore: number;
  experienceLevel: string;
  yearsOfExperience: number;
  technicalSkills: string[];
  softSkills: string[];
  tools: string[];
  projects: string[];
  achievements: string[];
  education: string[];
  weaknessesOrGaps: string[];
  suggestedInterviewTracks: Question["category"][];
  customQuestions: string[];
  summary: string;
  isFallback?: boolean;
  atsScore?: number | null;
  atsGrade?: CvAnalysisResult["atsGrade"];
  missingKeywords?: string[];
  atsIssues?: CvAnalysisResult["atsIssues"];
}

export interface ImprovedCv {
  candidateName?: string;
  headline: string;
  professionalSummary: string;
  skills: string[];
  experienceBullets: string[];
  projectBullets: string[];
  education: string[];
  certifications: string[];
  atsKeywords: string[];
}

export interface JobMatchAnalysis {
  matchScore: number;
  matchGrade: "Excellent Match" | "Strong Match" | "Moderate Match" | "Weak Match";
  targetRoleDetected: string;
  jobSeniorityDetected: string;
  matchedKeywords: string[];
  missingKeywords: string[];
  importantRequiredSkills: string[];
  optionalSkills: string[];
  roleAlignmentSummary: string;
  experienceAlignment: {
    score: number;
    summary: string;
  };
  skillsAlignment: {
    score: number;
    summary: string;
  };
  keywordAlignment: {
    score: number;
    summary: string;
  };
  educationAlignment: {
    score: number;
    summary: string;
  };
  gaps: Array<{
    gap: string;
    severity: "low" | "medium" | "high";
    recommendation: string;
  }>;
  recommendedCvUpdates: Array<{
    section: string;
    currentIssue: string;
    suggestedUpdate: string;
  }>;
  tailoredCvStrategy: string;
  aiUnavailable?: boolean;
  localAnalysisOnly?: boolean;
}

export interface CvAnalysisResult {
  detectedDomain: string;
  detectedRole: string;
  domainConfidenceScore: number;
  atsScore: number | null;
  atsGrade: "Excellent" | "Good" | "Needs Improvement" | "Weak";
  summary: string;
  experienceLevel: "Entry Level" | "Junior" | "Mid Level" | "Senior" | "Lead" | "Executive";
  yearsOfExperience: number | null;
  technicalSkills: string[];
  softSkills: string[];
  toolsAndTechnologies: string[];
  education: string[];
  certifications: string[];
  projects: string[];
  achievements: string[];
  workExperienceHighlights: string[];
  weaknessesOrGaps: string[];
  missingKeywords: string[];
  atsIssues: Array<{
    issue: string;
    severity: "low" | "medium" | "high";
    section: string;
    recommendation: string;
  }>;
  sectionScores: {
    formatting: number;
    keywords: number;
    experience: number;
    skills: number;
    achievements: number;
    education: number;
    readability: number;
  };
  suggestedTargetRoles: string[];
  suggestedInterviewTracks: string[];
  customInterviewQuestions: string[];
  improvedCv: ImprovedCv;
  sourceType?: string;
  extractionWarnings?: string[];
  aiUnavailable?: boolean;
}

export interface Question {
  id: string;
  text: string;
  category: "behavioral" | "technical" | "system_design" | "role_specific" | "cv_deep_dive" | "job_description" | "coding" | "case_study";
  difficulty: "easy" | "medium" | "hard";
  whyAsked: string;
  whatInterviewerWants: string[];
  keyPointsToCover: string[];
  commonMistakes: string[];
  idealAnswerStructure: string[];
  sampleStrongAnswer: string;
  personalizedHints: string[];
  expectedSignals: string[];
  hint: string;
  prepTime: number;
  answerTime: number;
  followUpQuestions: string[];
  scoringRubric: {
    clarity: string;
    relevance: string;
    depth: string;
    examples: string;
  };
}

export interface FeedbackResult {
  source: "gemini" | "fallback";
  overallScore: number;
  answerQualityGrade: "Excellent" | "Good" | "Average" | "Weak";
  speechScore: number;
  contentScore: number;
  relevanceScore: number;
  structureScore: number;
  technicalDepthScore: number;
  confidenceScore: number;
  starBreakdown: {
    situation: number;
    task: number;
    action: number;
    result: number;
    comments: string;
  };
  strengths: string[];
  weakAreas: string[];
  missingPoints: string[];
  improvementTips: string[];
  betterAnswer: string;
  bestAnswerExample: string;
  followUpQuestions: string[];
  nextPracticeRecommendation: string;
}

export interface AnswerPreparation {
  source: "gemini" | "fallback";
  question: string;
  answerStrategy: string;
  starFramework?: {
    situation: string;
    task: string;
    action: string;
    result: string;
  };
  technicalFramework?: {
    conceptExplanation: string;
    implementationApproach: string;
    tradeoffs: string[];
    edgeCases: string[];
    performanceConsiderations: string[];
  };
  keyPointsToMention: string[];
  phrasesToUse: string[];
  phrasesToAvoid: string[];
  sampleStrongAnswer: string;
  shorterVersion: string;
  seniorLevelVersion?: string;
  followUpPrep: string[];
  confidenceTips: string[];
}

export interface CodingSessionResult {
  correctnessScore: number;
  performanceScore: number;
  complexity: {
    time: string;
    space: string;
  };
  feedback: string;
  suggestions: string[];
  optimizedSolution: string;
  executionNotice?: string;
  isFallback?: boolean;
}

export interface AuthSession {
  token: string;
  expiresAt?: string;
  user: UserProfile;
}
