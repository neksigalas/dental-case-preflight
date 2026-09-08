# AGENTS.md — Dental Case Preflight

This file contains persistent instructions for AI development agents (Codex, Claude Code, etc.).
Read this file before making any changes to the codebase.

---

## Product

**Dental Case Preflight** — A SaaS web app for dental laboratories.
Dental labs receive structured case submissions from clinics, run deterministic pre-production QA,
manage clarifications, and confirm cases are production-ready.

Full specification: PRODUCT_SPEC.md

---

## Tech Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS
- Supabase (PostgreSQL + Auth + Storage + RLS)
- Deployed on Vercel

---

## Key Directories

```
src/app/(auth)/          — Login, register pages
src/app/(lab)/           — Protected lab routes (dashboard, cases, settings)
src/app/submit/[token]/  — Public clinic submission page (no auth required)
src/app/api/             — API routes (webhooks)
src/lib/supabase/        — Supabase client helpers
src/lib/qa-engine/       — Deterministic QA rules
src/lib/types/           — TypeScript interfaces
supabase/migrations/     — SQL migration files
```

---

## Critical Rules

1. **Never break the case status machine.** Valid transitions only:
   DRAFT → SUBMITTED → QA_REVIEW → NEEDS_CLARIFICATION → QA_REVIEW → PRODUCTION_READY → CLOSED

2. **All status transitions must write to case_events table.** Immutable event log.

3. **The /submit/[token] route must work without authentication.** Clinic submits via token only.

4. **QA engine is deterministic.** No AI in MVP QA. Pure rules in src/lib/qa-engine/rules.ts

5. **RLS is mandatory.** Labs must only see their own cases. Never bypass RLS.

6. **No real patient PII in MVP.** Use patient_ref (code), not full names.

7. **TypeScript strict mode.** Fix type errors, never use `any` unless absolutely necessary.

---

## Environment Variables (required)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   (server-side only, never expose to client)
WHOP_API_KEY=                (for webhook verification)
```

---

## Database Migrations

All schema changes go in supabase/migrations/ as numbered SQL files.
Never modify the database schema directly. Always write a migration.

---

## Before Submitting Work

Run these checks:
```bash
npx tsc --noEmit          # TypeScript — must be 0 errors
npm run build             # Production build — must succeed
npm run lint              # ESLint — must pass
```
