# Database Plan

No real database is connected yet. The current app uses an in-memory local adapter behind repository interfaces so Supabase/Postgres can be added later without rewriting controllers.

## Future Tables

- `users`
- `profiles`
- `cv_profiles`
- `interview_sessions`
- `interview_questions`
- `interview_answers`
- `feedback_reports`
- `coding_submissions`
- `usage_logs`
- `subscriptions`

## Repository Interfaces

- `UserRepository`
- `ProfileRepository`
- `CVRepository`
- `SessionRepository`
- `FeedbackRepository`

Future Supabase adapters should implement these interfaces and become the only persistence layer used by controllers/services.

## Current Development Adapter

The current `memory.repository.ts` adapter stores users, sessions, CV profiles, and feedback in process memory only. This is useful for local development but resets whenever the server restarts.

## Supabase Notes

- Use Supabase Auth for real authentication.
- Use Postgres for durable persistence.
- Enable Row Level Security for user-owned rows.
- Consider a private Storage bucket for CV uploads if raw files are retained.
- Never expose the service role key in frontend code.
- Keep sensitive operations server-side.
- Store only the minimum CV data needed for the product.
- Apply retention policies for raw CV files and parsed CV profiles.
