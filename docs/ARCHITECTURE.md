# Architecture

InterviewMaster AI is organized as a local SaaS-ready React and Express application.

## Frontend

- `src/App.tsx` owns top-level navigation and session restoration.
- `src/features/auth` handles sign in and sign up.
- `src/features/onboarding` collects target role data, multipart CV upload/pasted CV input, ATS analysis results, optional job-description matching, improved CV edits, and manual role/domain overrides.
- `src/features/dashboard` shows progress, modules, and CV signal.
- `src/features/interview` generates questions and requests structured feedback.
- `src/features/code-playground` provides AI code review only. It does not execute code.
- `src/components/ui` contains reusable UI primitives.
- `src/services/api.ts` centralizes API requests, unwraps `{ success, data }` responses, and stores temporary bearer-token session data.

## Backend

- `server/index.ts` starts Express and Vite middleware.
- `server/app.ts` configures middleware and route mounting.
- `server/routes` maps HTTP routes to controllers.
- `server/controllers` validates request shape at the edge and delegates work.
- `server/services/auth.service.ts` handles local auth and profile updates.
- `server/services/cvExtraction.service.ts` extracts readable text from PDF, DOCX, TXT/MD, and pasted text.
- `server/services/cvDocument.service.ts` generates ATS-friendly DOCX/PDF downloads.
- `server/ai/gemini.service.ts` isolates Gemini calls and local fallbacks.
- `server/ai/cvAnalysis.service.ts` performs ATS-oriented CV analysis, job-description-based match analysis, improved CV generation, and job-tailored CV generation.
- `server/repositories` defines repository interfaces and an in-memory development adapter.
- `server/middleware` contains auth, request logging, AI rate limiting, API 404 handling, and centralized error handling.

## API Response Shape

API routes return:

```json
{ "success": true, "data": {} }
```

Errors return:

```json
{ "success": false, "error": "Message" }
```

## AI Flow

Gemini calls happen server-side only. If `GEMINI_API_KEY` is missing or Gemini fails, the app returns local fallback responses with `isFallback: true` where applicable.

## Auth Flow

Local auth uses hashed passwords, bearer session tokens, and seven-day token expiry. It is intended for development only and is shaped so Supabase Auth can replace it later.

## CV / ATS Flow

The frontend sends `multipart/form-data` to `POST /api/cv/upload-analyze` with either a file or pasted text. The backend validates type/size, extracts readable text server-side, analyzes the CV through Gemini when configured, returns ATS score/recommendations/improved CV structure, stores a temporary CV profile through the repository layer, and uses detected role/domain/custom questions for interview generation.

## Job Description Based ATS Matching

`POST /api/cv/job-match` accepts the pasted job description plus either CV text or prior structured CV analysis. Gemini returns strict structured JSON with an estimated job-specific match score, required/preferred skills, matched and missing keywords, alignment scores, gaps, and section-specific CV recommendations. If Gemini is unavailable, the endpoint returns a clearly marked local keyword-overlap fallback instead of a confident AI score.

`POST /api/cv/generate-job-tailored` accepts the job description, prior match analysis, and CV context to produce a job-tailored improved CV structure. The prompt forbids fabricated jobs, degrees, companies, years, certifications, metrics, and unsupported skills.

Download endpoints generate files on demand:

- `POST /api/cv/download/docx`
- `POST /api/cv/download/pdf`

The same download endpoints support general and job-tailored filenames:

- `ats-friendly-cv.docx`
- `ats-friendly-cv.pdf`
- `job-tailored-ats-cv.docx`
- `job-tailored-ats-cv.pdf`
