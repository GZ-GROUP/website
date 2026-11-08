# Roadmap

Each phase ships on its own. Nothing from a later phase is built early unless a real dependency requires it. Tags: **[MVP]** needed for the first public version · **[POST-MVP]** soon after · **[FUTURE]** later · **[OPTIONAL]** only if it earns its place.

## Phase 0 — Architecture and setup ✅

Modular monolith, Next.js 16 + Prisma 7 + PostgreSQL 17, Docker (dev DB + production image), CI, initial schema (`User`, `Profile`, `Account`, `Verification`), ADRs.

## Phase 1 — Foundation ✅ (pending visual sign-off)

Design tokens and semantic layer (per-mode, contrast-checked), Poppins 400/700, layout shell, bilingual routing (es default, en), landing page with honest empty states, real logo.

## Phase 2 — First deploy on Dokploy [MVP]

Moved ahead of auth on purpose: deploying is cheap on Dokploy, surfaces Docker/env problems early, and OAuth callbacks need real URLs.

- Dokploy application from the Dockerfile (or a GHCR image built in CI)
- Dokploy-managed PostgreSQL + scheduled backups to S3-compatible storage
- Domain + TLS (Traefik / Let's Encrypt)
- `/api/health` endpoint and container `HEALTHCHECK`
- `prisma migrate deploy` before the app starts (see ADR 0004)
- Staging and production environments

## Phase 3 — Authentication and RBAC [MVP]

Better Auth (ADR 0002): email/username + password, sessions, password reset, GitHub and LinkedIn OAuth, account linking, verification records, roles (Reader/Writer/Admin + superadmin) enforced server-side, profiles, `/login` and `/register`. Content-Security-Policy once third-party origins are known.

## Phase 4 — Editorial [MVP]

Articles (projects = showcase categories), authors and co-authors, categories, tags, drafts, publishing (`DRAFT` / `PUBLISHED` / `ARCHIVED`), editor, `/blog`, `/projects`, article pages. Replace `lib/content/featured.ts` with Prisma queries.

## Phase 5 — Community [MVP → POST-MVP]

Comments, reactions, public profiles, reader dashboard with real metrics only, `/team`.

## Phase 6 — Hardening and observability [POST-MVP]

Rate limiting, error tracking, uptime/log monitoring, security scanning in CI, image optimization and upload pipeline, performance budgets, preview environments, legal pages.

## Phase 7 — Advanced platform [FUTURE]

Editorial workflow (`IN_REVIEW`/`APPROVED`), versioning, advanced search, analytics, notifications, recommendations, theme toggle, localized URL slugs [OPTIONAL], Storybook when the component count justifies it [OPTIONAL].

## Removed from the plan

Azure, AKS, Azure Container Registry and Terraform-for-Azure: replaced by Dokploy (ADR 0004). Revisit Kubernetes only if traffic or team size outgrows a single Dokploy host.
