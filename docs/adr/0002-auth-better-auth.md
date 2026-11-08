# ADR 0002 — Better Auth for authentication

- **Status:** Accepted (implementation in Phase 3)
- **Date:** 2026-11-08

## Context

We need email/username + password sign-up, sessions, password reset, GitHub and LinkedIn OAuth, and linking an external account to an existing password account. Authentication, account linking, identity verification and authorization (RBAC) must stay separate concepts.

## Options considered

| Option | For | Against |
| --- | --- | --- |
| **Better Auth** | Email/password, username, OAuth, account linking, DB sessions, rate limiting and role helpers built in; official Prisma adapter; actively developed | Younger library; follow its release notes |
| Auth.js v5 | Well known | Maintained by the Better Auth team since Sept 2025, which recommends Better Auth for new projects; credentials + database sessions are awkward; password reset is DIY |
| Custom sessions/JWT | Full control | We would own hashing, rotation, CSRF, reset and OAuth flows: the highest security risk for a student team |

## Decision

Use Better Auth with database sessions in PostgreSQL through its Prisma adapter.

- The adapter needs the Prisma generator `output` set, which we already have.
- Better Auth's own tables (sessions, verification tokens) are generated with its CLI in Phase 3. They are **not** added to the schema before then.
- Our `Verification` model (provider-confirmed identity shown on bylines) stays separate from Better Auth's account and token tables.
- Roles stay in our `User.role` enum, and every permission is checked server-side.
- Env vars: `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` (declared in `.env.example`).

## Consequences

- Before Phase 3, re-check the current Better Auth, Prisma 7 and Next.js 16 compatibility and pin versions.
- Next.js 16 uses `proxy.ts` instead of `middleware.ts`. Session checks for protected routes must be composed with the next-intl proxy that already exists.
