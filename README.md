# InterviewMaster AI

AI interview-preparation SaaS prototype with a React + Vite frontend, Express + TypeScript backend, and server-side Gemini integration.

## What It Does

- Local sign up, sign in, logout, and bearer-session persistence.
- CV paste/upload flow for PDF, DOCX, legacy DOC, TXT, MD, and pasted text.
- Server-side text extraction, structured CV parsing, ATS analysis, and improved CV drafting.
- Optional job-description-based ATS matching with matched/missing keywords and tailored CV suggestions.
- Download ATS-friendly improved CV drafts as DOCX or PDF.
- Role-specific interview question generation.
- STAR-style feedback with content, speech estimate, issues, tips, and improved answer.
- AI Code Review Playground that reviews code without claiming execution.
- Supabase-ready repository layer without connecting a real database yet.

## Stack

- React 19 + Vite 8
- Express + TypeScript
- Gemini via `@google/genai`
- In-memory repository adapter for local development
- Tailwind CSS v4
- CV extraction/generation: `multer`, `pdf-parse`, `mammoth`, `docx`, `pdfkit`

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Set `GEMINI_API_KEY` in `.env` to enable Gemini. Without it, local fallbacks keep the app usable.

## Scripts

```bash
npm run dev
npm run lint
npm run build
npm run start
```

## Environment

- `GEMINI_API_KEY`
- `APP_URL`
- `PORT`
- `NODE_ENV`
- `AUTH_SECRET`

## Known Limitations

- Local auth and in-memory storage are temporary and reset on server restart.
- Scanned/image-based PDFs may not extract readable text.
- Legacy `.doc` files are rejected with a clear fallback recommendation to upload DOCX or PDF.
- ATS scores are estimates. General CV analysis uses resume best practices; job match analysis estimates alignment against a pasted job description.
- Code review does not execute code or run tests.
- Local session tokens are stored in localStorage for this development build only.
- Production auth should use Supabase Auth or another proven auth provider.
- `npm audit` currently reports zero vulnerabilities after the Phase 2 Vite/esbuild upgrade.

## Future Database Plan

Supabase is intentionally not connected yet. See:

- `docs/DATABASE_PLAN.md`
- `docs/SUPABASE_FUTURE_MIGRATION.md`
- `docs/SECURITY_NOTES.md`
- `docs/ARCHITECTURE.md`
- `docs/PHASE_2_AUDIT.md`
- `docs/CV_ATS_FEATURE.md`
