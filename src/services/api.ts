import { AnswerPreparation, AuthSession, CVProfile, CodingSessionResult, CvAnalysisResult, FeedbackResult, ImprovedCv, InterviewMode, JobMatchAnalysis, Question, UserProfile } from "../types";

const TOKEN_KEY = "interviewmaster_token";
const USER_KEY = "interviewmaster_user";
const SESSION_EXPIRES_KEY = "interviewmaster_session_expires_at";

export function getStoredSession(): AuthSession | null {
  const token = localStorage.getItem(TOKEN_KEY);
  const userRaw = localStorage.getItem(USER_KEY);
  const expiresAt = localStorage.getItem(SESSION_EXPIRES_KEY) || undefined;
  if (!token || !userRaw) return null;
  if (expiresAt && new Date(expiresAt).getTime() < Date.now()) {
    clearStoredSession();
    return null;
  }
  try {
    return { token, expiresAt, user: JSON.parse(userRaw) };
  } catch {
    clearStoredSession();
    return null;
  }
}

export function storeSession(session: AuthSession) {
  // Temporary local development auth: bearer token lives in localStorage until Supabase/Auth cookies replace it.
  localStorage.setItem(TOKEN_KEY, session.token);
  localStorage.setItem(USER_KEY, JSON.stringify(session.user));
  if (session.expiresAt) localStorage.setItem(SESSION_EXPIRES_KEY, session.expiresAt);
}

export function updateStoredUser(user: UserProfile) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(SESSION_EXPIRES_KEY);
  localStorage.removeItem("interviewmaster_cv_profile");
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY);
  const response = await fetch(path, {
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.success === false) throw new Error(data.error || "Request failed.");
  return (data?.success === true && "data" in data ? data.data : data) as T;
}

export async function downloadRequest(path: string, payload: unknown) {
  const token = localStorage.getItem(TOKEN_KEY);
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Download failed.");
  }
  return response.blob();
}

export const api = {
  signIn: (email: string, password: string) =>
    apiRequest<AuthSession>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  signUp: (name: string, email: string, password: string) =>
    apiRequest<AuthSession>("/api/auth/register", { method: "POST", body: JSON.stringify({ name, email, password }) }),
  me: () => apiRequest<{ user: UserProfile }>("/api/auth/me"),
  logout: () => apiRequest<{ loggedOut: true }>("/api/auth/logout", { method: "POST" }),
  saveProfile: (profile: Partial<UserProfile>) =>
    apiRequest<{ user: UserProfile }>("/api/auth/profile", { method: "PUT", body: JSON.stringify(profile) }),
  parseCV: (payload: { cvContent: string; fileName: string; fileType: string; fileSize?: number }) =>
    apiRequest<CVProfile>("/api/cv/parse", { method: "POST", body: JSON.stringify(payload) }),
  uploadAnalyzeCV: (payload: { file?: File; cvText?: string }) => {
    const form = new FormData();
    if (payload.file) form.append("cv", payload.file);
    if (payload.cvText) form.append("cvText", payload.cvText);
    return apiRequest<{ analysis: CvAnalysisResult; cvProfile: CVProfile; extractedTextLength: number }>("/api/cv/upload-analyze", { method: "POST", body: form });
  },
  generateImprovedCV: (payload: { analysis: CvAnalysisResult; originalCvText?: string }) =>
    apiRequest<{ improvedCv: ImprovedCv }>("/api/cv/generate-improved", { method: "POST", body: JSON.stringify(payload) }),
  jobMatchCV: (payload: { cvText?: string; cvAnalysis?: CvAnalysisResult; jobDescription: string }) =>
    apiRequest<{ jobMatchAnalysis: JobMatchAnalysis }>("/api/cv/job-match", { method: "POST", body: JSON.stringify(payload) }),
  generateJobTailoredCV: (payload: { originalCvText?: string; improvedCv?: ImprovedCv; cvAnalysis?: CvAnalysisResult; jobDescription: string; jobMatchAnalysis: JobMatchAnalysis }) =>
    apiRequest<{ improvedCv: ImprovedCv }>("/api/cv/generate-job-tailored", { method: "POST", body: JSON.stringify(payload) }),
  downloadDocx: (improvedCv: ImprovedCv, variant?: "general" | "job-tailored") => downloadRequest("/api/cv/download/docx", { improvedCv, variant }),
  downloadPdf: (improvedCv: ImprovedCv, variant?: "general" | "job-tailored") => downloadRequest("/api/cv/download/pdf", { improvedCv, variant }),
  generateQuestions: (payload: { targetRole?: string; experienceLevel?: string; dreamCompany?: string; mode: InterviewMode; cvProfile?: CVProfile | null; jobDescription?: string; jobMatchAnalysis?: JobMatchAnalysis | null }) =>
    apiRequest<{ source: "gemini" | "fallback"; questions: Question[] }>("/api/questions/generate", { method: "POST", body: JSON.stringify(payload) }),
  prepareAnswer: (payload: { question: Question; cvProfile?: CVProfile | null; targetRole?: string; experienceLevel?: string; jobDescription?: string }) =>
    apiRequest<AnswerPreparation>("/api/interview/prepare-answer", { method: "POST", body: JSON.stringify(payload) }),
  evaluateAnswer: (payload: { question: string; answer: string; durationSeconds: number; cvProfile?: CVProfile | null; targetRole?: string; experienceLevel?: string }) =>
    apiRequest<FeedbackResult>("/api/interview/evaluate", { method: "POST", body: JSON.stringify(payload) }),
  reviewCode: (payload: { code: string; language: string; questionText: string }) =>
    apiRequest<CodingSessionResult>("/api/code/evaluate", { method: "POST", body: JSON.stringify(payload) }),
};
