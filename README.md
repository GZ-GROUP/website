# GZ Group

Editorial platform for GZ Group, a community of emerging software developers: a place to publish, discover and discuss members' software projects, research and experiments, with verified authorship.

> **Status:** Phase 5 (community) done. The bilingual landing page, accounts, profiles, role management, the writers' studio (rich-text editor, images, co-authors, publishing), the public blog and projects pages, comments, likes, the reader dashboard and the team page exist. Deployment is postponed; see the [roadmap](docs/roadmap.md).

## Stack

| Layer | Choice |
| --- | --- |
| App | Next.js 16 (App Router, Turbopack), React 19, TypeScript (strict) |
| UI | Tailwind CSS v4 (tokens in `app/globals.css`), shadcn/ui on Base UI, lucide icons |
| i18n | next-intl: Spanish (default, `/`) and English (`/en`) |
| Data | Prisma 7 + PostgreSQL 17 (driver adapter `@prisma/adapter-pg`) |
| Auth | Better Auth 1.7: email/username + password, GitHub OAuth, RBAC (ADR 0002) |
| Email | nodemailer over the self-hosted SMTP server (ADR 0006) |
| Editor | TipTap 3, stored as JSON, rendered on the server with the static renderer (ADR 0007) |
| Media | S3-compatible storage (RustFS locally), images re-encoded with sharp (ADR 0008) |
| Quality | ESLint, `tsc`, Vitest, Playwright, GitHub Actions, Dependabot |
| Runtime | Docker (standalone Next.js image), deployed on Dokploy |

Architecture: a modular monolith. Route handlers and server actions stay thin; domain logic lives in `lib/`. Decisions are recorded in [`docs/adr/`](docs/adr).

## Requirements

- Node.js 24 LTS or newer
- npm 11
- Docker (for the local PostgreSQL and RustFS)

## Getting started

```bash
git clone https://github.com/GZ-GROUP/<repo>.git
cd <repo>
npm install
cp .env.example .env          # local-only values; never commit .env
docker compose up -d          # PostgreSQL 17 (:5432) and RustFS object storage (:9000, console :9001)
npm run db:generate           # Prisma client → lib/generated/prisma
npm run db:migrate            # apply migrations to the dev database
npm run dev                   # http://localhost:3000 (Spanish) · /en (English)
```

On first start the server creates the master admin from `ADMIN_EMAIL` / `ADMIN_INITIAL_PASSWORD` (see [Authentication](#authentication)). Without `SMTP_HOST`, emails such as password-reset links are printed in the terminal.

> npm 11 blocks dependency install scripts by default. Prisma works without them; if a tool asks for its scripts, review them with `npm install-scripts ls` before approving.

## Environment variables

See [`.env.example`](.env.example) for the full list with comments. Summary:

| Variable | Local | CI | Production (Dokploy) |
| --- | --- | --- | --- |
| `DATABASE_URL` | `.env` (compose DB) | inline in `ci.yml` (throwaway DB) | Dokploy env (internal Postgres URL) |
| `NEXT_PUBLIC_APP_URL` | `.env` | — | Dokploy env |
| `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` | `.env` | throwaway values in `ci.yml` | Dokploy env (secret) |
| `ADMIN_EMAIL`, `ADMIN_INITIAL_PASSWORD` | `.env` | fixed test values in `playwright.config.ts` | Dokploy env (secret); remove the password after the first sign-in |
| `SMTP_*`, `EMAIL_FROM` | optional (console fallback) | not used (file mailbox) | Dokploy env (required) |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | `.env` (optional) | — | Dokploy env |
| `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET`, `S3_REGION`, `S3_FORCE_PATH_STYLE` | `.env` (matches docker-compose) | RustFS service in `ci.yml` | Dokploy env (secret) |

Secrets never enter Git or the Docker image.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / server |
| `npm run lint` | ESLint |
| `npm run typecheck` | Generates Next route types, then `tsc --noEmit` |
| `npm test` | Vitest unit tests (RBAC, validation, email templates, bootstrap, es/en message parity) |
| `npm run test:e2e` | Playwright: production build against a separate `gz_group_e2e` database that is reset on every run |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:deploy` | `prisma migrate deploy` (CI/production) |
| `npm run db:studio` | Prisma Studio |

## Docker

- **Development:** `docker-compose.yml` runs only PostgreSQL; Next.js runs natively for fast refresh.
- **Production:** the multi-stage [`Dockerfile`](Dockerfile) builds a standalone Next.js server and runs it as a non-root user.

```bash
docker build -t gz-group .
docker run --rm -p 3000:3000 -e DATABASE_URL="postgresql://…" gz-group
```

## Project structure

```text
app/
  [locale]/              root layout (<html lang>), localized pages and 404
    (marketing)/         public landing
    (auth)/              login, register, forgot/reset password
    account/             account settings, change password (private)
    u/[username]/        public profile
    admin/               users and article moderation (admin only; 404 for everyone else)
    blog/ projects/      public listings and article pages
    studio/              writers' area: articles list, editor, preview (404 for non-writers)
  api/auth/[...all]/     Better Auth handler
  api/uploads/           image upload (writers only)
  media/[...key]/        serves uploaded images from the private bucket
  globals.css            design tokens: the single source of truth
components/
  ui/                    shadcn primitives (Base UI)
  layout/                header, footer, container, locale switcher, user menu
  marketing/             landing sections
  auth/ account/ admin/ forms/ article/ shared/ brand/
i18n/                    next-intl routing, request config, navigation
messages/                es.json (reference) and en.json
lib/
  auth/                  Better Auth config, RBAC, session guards, admin bootstrap
  articles/              editorial permissions, queries, mutations, filters, slugs
  editor/                TipTap schema, content validation, server renderer
  storage/               S3 client and image processing
  email/                 SMTP transport and localized templates
  validation/            zod schemas shared by forms and server actions
prisma/                  schema and migrations
docs/                    ADRs, roadmap, design system
tests/                   Vitest (unit) · tests/e2e: Playwright
instrumentation.ts       server-start hook (master admin bootstrap, media bucket)
proxy.ts                 locale negotiation (Next 16 "proxy", formerly middleware)
```

## Editorial workflow

- **Studio:** Writers (and Admins) write in `/studio`, which answers 404 to everyone else.
  - Articles move DRAFT → PUBLISHED → ARCHIVED. Publishing is immediate, with no approval step.
  - The slug is fixed at first publication.
  - Only never-published drafts can be deleted. Admins can archive or restore any article from `/admin/articles`.
- **Authorship:** the author can add up to 5 co-authors, who must be Writers. Co-authors edit content; only the author publishes.
- **Projects:** a project is an article in a showcase category (Software, Research, Experiments). The 6 categories are seeded by a migration. Tags are free, up to 5 per article.
- **Images:** uploaded from the editor, re-encoded to WebP and served from `/media/…` ([ADR 0008](docs/adr/0008-media-storage-rustfs.md)).

## Authentication

- **Roles:**
  - Every sign-up is a **Reader**, who can comment on and like articles and see their own activity in `/dashboard`.
  - A Reader becomes a **Writer** only when the master admin promotes them from `/admin`. That page is not linked anywhere public and answers 404 to non-admins.
  - Authorization is always checked on the server: `lib/auth/session.ts` and the server actions.
- **Master admin:** created on first server start from `ADMIN_EMAIL` and `ADMIN_INITIAL_PASSWORD`. It must change that password on first sign-in, and nobody can sign up with its email. See [ADR 0005](docs/adr/0005-master-admin-bootstrap.md).
- **GitHub:** set `GITHUB_CLIENT_ID`/`GITHUB_CLIENT_SECRET` to enable "Continue with GitHub" and account linking. The OAuth app's callback URL is `<BETTER_AUTH_URL>/api/auth/callback/github`. Linking GitHub shows the "GitHub ✓" badge on the profile.

## Internationalization

- Code, identifiers and message keys are written in English; UI text lives in `messages/*.json`.
- Import `Link`, `redirect`, `usePathname` and `useRouter` from `@/i18n/navigation`, not from Next.
- Add a key to **both** catalogs; `npm test` fails if they diverge.
- User-generated content (articles, names, bios) is never machine-translated.

## CI/CD

GitHub Actions ([`ci.yml`](.github/workflows/ci.yml)) on every pull request and push to `main`: dependency audit → Prisma generate → lint → typecheck → migrations on a throwaway Postgres → unit tests → build, then in parallel the Playwright e2e suite and the Docker image build. Deployment to Dokploy is postponed until every feature phase is finished; see [ADR 0004](docs/adr/0004-deployment-dokploy.md).

## Contributing

Work on a branch, use [Conventional Commits](https://www.conventionalcommits.org/), and open a pull request; CI must pass. UI work follows the design system in [`docs/design-system`](docs/design-system/README.md) and [`PRODUCT.md`](PRODUCT.md).

## License

Not decided yet. All rights reserved until a license is added.
