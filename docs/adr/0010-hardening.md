# ADR 0010: Hardening (CSP, logs, limits, images)

- **Status:** Accepted
- **Date:** 2026-11-09

## Context

Before launch the platform needs protection against injected content, a way to diagnose failures, limits on expensive actions, and images sized for each screen. Next.js applies nonces only to dynamically rendered pages, and the landing and `/team` are static on purpose.

## Decision

- **CSP without nonces,** set in `next.config.ts`.
  - Every external origin is blocked except GitHub's avatar host. `object-src`, `base-uri`, `form-action` and `frame-ancestors` are locked down.
  - Inline scripts and styles stay allowed, because Next.js needs them and nonces would force every page to be dynamic.
  - The residual risk is low: comments are plain text and article content goes through a validated static renderer, so no user HTML reaches the page.
- **Logs, no external error service.**
  - One JSON object per line on stdout (`lib/logging/logger.ts`), which the container platform collects.
  - Sensitive keys are redacted and email addresses removed from text.
  - `onRequestError` records every server error with its `digest`, which the error screen shows as a reference.
  - GlitchTip or Sentry can be added after deployment. [OPTIONAL]
- **Health check:** `GET /api/health` runs `SELECT 1` and says only ok or unavailable. The Docker image's `HEALTHCHECK` uses it.
- **Action limits** (`lib/security/rate-limit.ts`): atomic fixed windows on the existing `rate_limits` table. Likes 30/min, reads 60/min, uploads 20/min per user.
- **Images through `next/image`,** restricted to `/media/**`. Phones no longer receive 2000 px covers, and the original files stay untouched. Profile photos are already 512 px and skip the optimizer.
- **Legal pages for Panama** (Law 81 of 2019, Executive Decree 285 of 2021). See `docs/compliance/ficha-tecnica-panama.md`, including what a lawyer must review before launch.

## Consequences

- A new third-party script, font or image host must be added to the CSP on purpose.
- The image optimizer writes to `.next/cache` and uses CPU on first request; results are cached for a year because keys are immutable.
- Client-side rendering errors are only visible to the user; they are not logged.
- **Waiting for deployment:** preview environments, external uptime monitoring, log rotation.
- **[POST-MVP]** CSP with nonces, 2FA for the master admin, self-service account deletion.
