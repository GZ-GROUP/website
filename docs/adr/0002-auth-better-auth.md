# ADR 0002 — Better Auth for authentication

- **Status:** Accepted. Implemented in Phase 3 (better-auth 1.7.x).
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

Use Better Auth with database sessions in PostgreSQL through its Prisma adapter (`better-auth/adapters/prisma`). The configuration lives in [lib/auth/index.ts](../../lib/auth/index.ts).

### Schema

- Better Auth owns `User`, `Session`, `Account`, `Verification` (its short-lived tokens) and `RateLimit`. They were generated with `npx auth generate` and merged by hand into our conventions.
- Our identity-verification model is renamed to **`IdentityVerification`**, so it does not collide with Better Auth's `Verification`. This keeps the two concepts apart without relying on `modelName` overrides.
- Passwords live in `Account` (`providerId = "credential"`), hashed with scrypt. `User.passwordHash` was removed.

### Roles and authorization

- `User.role` is text (`reader` | `writer` | `admin`), because the admin plugin stores role names as strings.
- Valid roles and permissions are defined once in [lib/auth/permissions.ts](../../lib/auth/permissions.ts) with `createAccessControl`.
- Every check runs on the server: `requireUser`, `requireAdmin`, and server actions that re-authorize every call.

### Plugins

- `username`: sign in with email or username. Reserved names are rejected.
- `admin`: `setRole`, with `reader` as the default role.
- `nextCookies`: lets server actions set cookies.

### Account linking and providers

- Linking is explicit only (`disableImplicitLinking`). A matching email never attaches GitHub to an existing account.
- Linking or unlinking GitHub creates or removes an `IdentityVerification`, which is the "GitHub ✓" badge.
- GitHub is enabled when its credentials exist. LinkedIn is prepared but inactive.

### Other settings

- Email verification is optional by product decision. Password reset uses SMTP ([ADR 0006](0006-transactional-email-smtp.md)).
- Rate limiting is stored in the database, so it survives restarts and works across replicas. Limits are stricter on sign-in, sign-up and reset requests.
- Environment variables: `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL`. Build steps use a non-secret placeholder secret.
- The master admin is covered in [ADR 0005](0005-master-admin-bootstrap.md).

## Consequences

- `better-auth` is pinned to `~1.7.18`. Re-check Prisma and Next.js compatibility before moving to 1.8.
- Route protection lives in server layouts and pages, not in `proxy.ts`, which only negotiates the locale. A cookie-only check in the proxy would not be a security boundary anyway.
- Server Actions cannot read `next/root-params`, so `i18n/request.ts` falls back to next-intl's request locale only in that case. It never touches the lazy `requestLocale` getter on normal renders, which keeps public pages static.
