# Security Notes

## Implemented Now

- Passwords are hashed with Node `crypto.scrypt`.
- Plaintext passwords and password hashes are never returned to the frontend.
- Login no longer auto-creates users.
- Protected API routes require bearer sessions.
- Bearer sessions expire after seven days.
- CV and AI endpoints have basic per-IP rate limiting.
- CV upload endpoints require authentication and validate file type/size.
- Uploaded resumes are handled in memory and are not stored permanently.
- Job-description matching endpoints require authentication and process CV/job text server-side.
- Request logs avoid full CV paths/content.
- Gemini API calls happen server-side.
- Code playground copy states that code is reviewed, not executed.
- API responses are normalized to `{ success, data }` and `{ success, error }`.
- Vite/esbuild audit findings were resolved by upgrading to Vite 8 and esbuild 0.28.1.

## Current Limitations

- Local auth is development-only and not production-grade.
- Session tokens are stored in localStorage for local simplicity.
- In-memory storage resets when the server restarts.
- CV text and pasted job descriptions are not permanently stored yet, but production storage would require retention controls and user deletion workflows.
- Basic rate limiting is process-local and should move to Redis or an edge layer for production.
- Local browser inspection was not available in the Codex Browser plugin during Phase 2; verification used TypeScript, build, HTTP, and API smoke tests.

## Production Recommendations

- Replace local auth with Supabase Auth.
- Use secure, HTTP-only cookies or a proven session strategy.
- Add CSRF protection if cookie auth is used.
- Add centralized audit logging without sensitive CV/answer content.
- Add server-side file scanning and stricter PDF parsing controls.
- Add malware scanning before accepting real production resume files.
- Add RLS policies before storing real user data.
