# Phase 2 Audit

## What Was Inspected

- `npm audit` and `npm outdated`
- Auth service, password hashing, public user serialization, session token flow, and protected route middleware
- API controllers, validation, response shapes, request logging, rate limiting, and error handling
- CV parsing and question-generation flow
- Frontend auth, onboarding, dashboard, interview, and code review feature folders
- Documentation and environment placeholders

## What Was Fixed

- Upgraded the vulnerable Vite/esbuild toolchain to Vite 8.0.16, esbuild 0.28.1, and `@vitejs/plugin-react` 6.0.2.
- Removed unused `motion` dependency.
- Standardized API responses to `{ success: true, data }` and `{ success: false, error }`.
- Updated the frontend API client to unwrap the standardized response while tolerating raw legacy shapes.
- Added visible session expiry metadata to auth responses and local session restoration.
- Kept server-side seven-day token expiry and documented localStorage as temporary development auth storage.
- Made auth errors more consistent for unauthenticated/expired/missing-user cases.
- Added `x-powered-by` disabling, API 404 responses, and clearer JSON/body-size errors.
- Added manual detected-domain and detected-role override in onboarding.
- Added a clearer confidence indicator path for CV domain detection.
- Removed remaining overconfident compiler/sandbox wording in favor of AI code review language.
- Updated docs for the Phase 2 state.

## Dependency Audit Result

Initial audit found two high-severity findings:

- `esbuild >=0.17.0 <0.28.1`
- `vite`, because it depended on the vulnerable esbuild range

Safe patch/minor upgrades did not resolve the advisory because the installed wanted range still resolved to Vite 6.x and esbuild 0.25.x. A major dev-tooling upgrade was applied and verified.

Final result:

```text
npm audit
found 0 vulnerabilities
```

## Remaining Security Limitations

- Local auth is not production-grade.
- Bearer tokens are stored in localStorage for local development only.
- In-memory sessions are process-local and reset on restart.
- Rate limiting is process-local and should move to Redis, Supabase, or an edge provider before production.
- CV file scanning and hardened PDF parsing are not implemented.
- Browser-based visual inspection was unavailable through the Codex Browser plugin in this session.

## Remaining Temporary Systems

- In-memory repositories
- Local development auth
- Local AI fallbacks when Gemini is unavailable
- Local progress/readiness estimates
- AI code review without execution or test-case validation

## Recommended Phase 3 Roadmap

1. Add automated API integration tests around auth, CV parsing, question generation, feedback, and code review.
2. Add component or Playwright tests for auth, onboarding, dashboard, interview, and code review flows.
3. Add a Supabase repository adapter behind the existing interfaces without changing controller contracts.
4. Replace local auth with Supabase Auth and RLS-backed user data.
5. Add durable session, interview, feedback, and coding-submission persistence.
6. Add production observability with redacted structured logs.
7. Add file scanning and stricter document parsing controls before accepting real CV uploads.
