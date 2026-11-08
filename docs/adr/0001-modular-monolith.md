# ADR 0001 — Modular monolith on Next.js

- **Status:** Accepted
- **Date:** 2026-08 (recorded 2026-11-08)

## Context

GZ Group is a small team of developers building an editorial platform that must be able to grow. Microservices would add deployment, networking and data-consistency work with no current benefit.

## Decision

One Next.js 16 application (App Router) with Prisma 7 and PostgreSQL 17.

- Route handlers and server actions are thin: they validate input (zod), check authorization, and call domain functions in `lib/`.
- Domain logic is grouped by module (`lib/content`, later `lib/auth`, `lib/articles`…), so a module could be extracted later.
- Authorization is enforced on the server, never only in the UI.
- Prisma 7 specifics: `prisma.config.ts` holds the datasource URL; the client is generated to `lib/generated/prisma` (git-ignored) and uses the `@prisma/adapter-pg` driver adapter via the singleton in `lib/db.ts`.

## Consequences

- One deployable, one database, one CI pipeline.
- A module becomes its own service only when it has a clear, measured reason (independent scaling, separate team, different runtime). That decision gets its own ADR covering the problem, the added complexity and the migration path.
