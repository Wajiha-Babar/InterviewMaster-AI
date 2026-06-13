# Supabase Future Migration

## Target Migration Steps

1. Create a Supabase project and configure Auth.
2. Create Postgres tables from `docs/DATABASE_PLAN.md`.
3. Enable Row Level Security on user-owned tables.
4. Replace `server/repositories/memory.repository.ts` with a Supabase repository adapter.
5. Replace local auth service internals with Supabase Auth calls.
6. Keep Gemini calls server-side and pass authenticated user context into repository calls.
7. Add migrations and seed data for development.
8. Replace localStorage bearer-token handling with Supabase session handling or secure server-managed cookies.

## RLS Guidance

- Profiles, CV profiles, sessions, answers, feedback, and submissions should be readable/writable only by their owner.
- Billing/subscription updates should be written only by trusted server-side webhook handlers.
- Usage logs should be insert-only from the server where possible.

## Secrets

- Frontend can use the public Supabase anon key only.
- Service role key must stay server-side only.
- `GEMINI_API_KEY` must stay server-side only.
