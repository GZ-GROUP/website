# ADR 0005: Master admin bootstrap

- **Status:** Accepted
- **Date:** 2026-11-08

## Context

The platform has one default master admin, `admin@gzgroup.dev`. It is the only account that can promote a Reader to Writer, and that promotion is a backend function the public must not know about. The account cannot come from public sign-up, and its first password must be delivered safely.

## Options considered

| Option | Verdict |
| --- | --- |
| **Password in an environment variable** | **Chosen.** Explicit and automatable on Dokploy, and never logged. |
| Print the password in the build log | Rejected. Builds don't (and shouldn't) touch the production database, they run again on every deploy, and CI/Dokploy logs are kept and readable by anyone with access. |
| Create the admin on the first visit | Rejected. Whoever arrives first after a deploy owns the platform. Bots scan new domains within minutes of their TLS certificate being issued. A fixed password instead would be a hard-coded credential, and either variant puts account creation on a public request path. |

## Decision

- **Configuration:** `ADMIN_EMAIL` (default `admin@gzgroup.dev`) and `ADMIN_INITIAL_PASSWORD` (16+ characters), set as secrets in the Dokploy environment, or in `.env` locally.
- **When it runs:** `instrumentation.ts` → `register()` runs once per server start (dev, `next start`, standalone image) and calls `ensureMasterAdmin()` in `lib/auth/bootstrap.ts`. It is never reachable over HTTP.
- **What `ensureMasterAdmin()` does:**
  - It is idempotent: it does nothing if a user with `isSuperAdmin = true` exists.
  - It refuses to run with a missing or short password, and refuses to promote an existing regular account that uses the admin email.
  - It creates the user through Better Auth's server-side `createUser`, so the password is hashed with scrypt, then sets `isSuperAdmin`, `role = "admin"`, `emailVerified` and `mustChangePassword`.
  - It never logs the password.
- **Uniqueness:** a partial unique index (`users_single_super_admin`) guarantees only one master admin, even if two instances race at startup.
- **Reserved email:** `user.validateUserInfo` rejects the admin email on every path except the bootstrap (`source.method === "admin"`), including sign-up and OAuth. The username `admin` is reserved for it.
- **Forced password change:** while `mustChangePassword` is true, `requireUser()` confines the account to `/account/password`. Changing the password revokes other sessions and clears the flag.
- **After the first sign-in:** remove `ADMIN_INITIAL_PASSWORD` from the environment. It is ignored once the admin exists.

## Consequences

- A fresh environment needs the variable set before first start, or it logs a warning and keeps running without a master admin.
- **[POST-MVP]** Two-factor authentication for the master admin (Better Auth `twoFactor` plugin) and an audit log of role changes.
- Granting the `admin` role to a second person is reserved to the master admin and not exposed in the UI yet.
