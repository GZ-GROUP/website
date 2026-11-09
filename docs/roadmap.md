# Roadmap

Each phase ships on its own. Nothing from a later phase is built early unless a real dependency requires it. Tags: **[MVP]** needed for the first public version · **[POST-MVP]** soon after · **[FUTURE]** later · **[OPTIONAL]** only if it earns its place.

## Phase 0 — Architecture and setup ✅

Modular monolith, Next.js 16 + Prisma 7 + PostgreSQL 17, Docker (dev DB + production image), CI, initial schema (`User`, `Profile`, `Account`, `Verification`), ADRs.

## Phase 1 — Foundation ✅ (pending visual sign-off)

Design tokens and semantic layer (per-mode, contrast-checked), Poppins 400/700, layout shell, bilingual routing (es default, en), landing page with honest empty states, real logo.

## Phase 2 — First deploy on Dokploy [MVP] (postponed)

Postponed by decision on 2026-11-08: no deployment until every feature phase is done. Reasons it stays important: deploying is cheap on Dokploy, surfaces Docker/env problems early, and OAuth callbacks need real URLs.

- Dokploy application from the Dockerfile (or a GHCR image built in CI)
- Dokploy-managed PostgreSQL + scheduled backups to S3-compatible storage
- Domain + TLS (Traefik / Let's Encrypt)
- `/api/health` endpoint and container `HEALTHCHECK`
- `prisma migrate deploy` before the app starts (see ADR 0004)
- Staging and production environments

## Phase 3 — Authentication and RBAC [MVP] ✅

Better Auth (ADR 0002):
- Email or username + password and sessions.
- Password reset over SMTP (ADR 0006) and optional email verification.
- GitHub OAuth with explicit account linking, which drives the identity-verification badges.
- Roles enforced on the server:
  - Reader is the default for every sign-up.
  - Writer is granted only by the master admin, from a `/admin` page that answers 404 to everyone else and is never linked publicly.
  - Admin.
- Master admin bootstrap with a forced password change (ADR 0005).
- Account settings and public `/u/[username]` profiles.
- Database rate limiting.
- Playwright e2e suite in CI.

Deferred: LinkedIn (app pending), Content-Security-Policy (Phase 6), 2FA for the master admin [POST-MVP].

## Phase 4 — Editorial [MVP] ✅

- **Articles:** a project is an article in a showcase category. The 6 categories are seeded; tags are free, up to 5.
- **Authorship:** author plus up to 5 co-authors (Writers only). Co-authors edit; only the author publishes.
- **Workflow:** DRAFT → PUBLISHED → ARCHIVED, published directly with no approval step. The slug is fixed at first publication. Admin moderation lives in `/admin/articles`.
- **Studio:** `/studio`, with a TipTap 3 editor (ADR 0007), preview, and image uploads to S3/RustFS (ADR 0008).
- **Public pages:**
  - `/blog` with search, category and tag filters, sort and pagination. `/projects` redirects to it.
  - Article pages with a verified byline and server-side code highlighting.
  - Live data on the landing (ISR) and on author profiles.

Deferred: autosave [POST-MVP], full-text search (tsvector) [POST-MVP], orphaned-upload cleanup [POST-MVP], editorial review states (Phase 7).

## Phase 5 — Community [MVP] ✅

Details in ADR 0009.

- **Comments:** plain text with one level of replies. Authors and admins delete them, including from `/admin/comments`.
- **Likes:** one per user and article.
- **`/account/activity`:** articles viewed, likes given and comments written, all counted from stored rows.
- **Profiles:** real statistics, separate authored and co-authored lists, and recent comments. Reading history stays private.
- **`/team`:** everyone credited on published work.

Deferred: editing and reporting comments, likes on comments, clearing the reading history [POST-MVP].

## Phase 6 — Hardening and observability [POST-MVP] ✅

Details in ADR 0010.

- **Security:** Content-Security-Policy without nonces, stricter headers, and limits on likes, reads and uploads.
- **Observability:** structured JSON logs, every server error recorded with a reference, error screens, `/api/health` and a container `HEALTHCHECK`.
- **CI:** CodeQL, secret scanning, image scanning and Dependabot.
- **Performance:** article images through `next/image`, and budgets for LCP, CLS and JavaScript in the e2e suite.
- **Legal:** `/privacy` and `/terms` for Panama, with recorded acceptance. What must be reviewed before launch is in `docs/compliance/ficha-tecnica-panama.md`.

Waiting for deployment: preview environments, external uptime monitoring, log rotation. Deferred: an external error service [OPTIONAL], CSP with nonces, 2FA for the master admin and self-service account deletion [POST-MVP].

## Phase 7 — Advanced platform [FUTURE]

Editorial workflow (`IN_REVIEW`/`APPROVED`), versioning, advanced search, analytics, notifications, recommendations, theme toggle, localized URL slugs [OPTIONAL], Storybook when the component count justifies it [OPTIONAL].

## Removed from the plan

Azure, AKS, Azure Container Registry and Terraform-for-Azure: replaced by Dokploy (ADR 0004). Revisit Kubernetes only if traffic or team size outgrows a single Dokploy host.
