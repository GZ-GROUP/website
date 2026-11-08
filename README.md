# GZ Group

Editorial platform for GZ Group, a student software development community: a place to publish, discover and discuss members' software projects, research and experiments, with verified authorship.

> **Status:** Phase 1 (foundation). The bilingual landing page, design system and project infrastructure exist. Accounts, articles, projects, comments and profiles are **not built yet**; see the [roadmap](docs/roadmap.md).

## Stack

| Layer | Choice |
| --- | --- |
| App | Next.js 16 (App Router, Turbopack), React 19, TypeScript (strict) |
| UI | Tailwind CSS v4 (tokens in `app/globals.css`), shadcn/ui on Base UI, lucide icons |
| i18n | next-intl: Spanish (default, `/`) and English (`/en`) |
| Data | Prisma 7 + PostgreSQL 17 (driver adapter `@prisma/adapter-pg`) |
| Auth | Better Auth (planned, Phase 3) |
| Quality | ESLint, `tsc`, Vitest, GitHub Actions, Dependabot |
| Runtime | Docker (standalone Next.js image), deployed on Dokploy |

Architecture: a modular monolith. Route handlers and server actions stay thin; domain logic lives in `lib/`. Decisions are recorded in [`docs/adr/`](docs/adr).

## Requirements

- Node.js 24 LTS or newer
- npm 11
- Docker (for the local PostgreSQL)

## Getting started

```bash
git clone https://github.com/GZ-GROUP/<repo>.git
cd <repo>
npm install
cp .env.example .env          # local-only values; never commit .env
docker compose up -d          # PostgreSQL 17 on localhost:5432
npm run db:generate           # Prisma client → lib/generated/prisma
npm run db:migrate            # apply migrations to the dev database
npm run dev                   # http://localhost:3000 (Spanish) · /en (English)
```

> npm 11 blocks dependency install scripts by default. Prisma works without them; if a tool asks for its scripts, review them with `npm install-scripts ls` before approving.

## Environment variables

See [`.env.example`](.env.example) for the full list with comments. Summary:

| Variable | Local | CI | Production (Dokploy) |
| --- | --- | --- | --- |
| `DATABASE_URL` | `.env` (compose DB) | inline in `ci.yml` (throwaway DB) | Dokploy env (internal Postgres URL) |
| `NEXT_PUBLIC_APP_URL` | `.env` | — | Dokploy env |
| `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` | `.env` (Phase 3) | GitHub secret if needed | Dokploy env |
| OAuth client IDs/secrets | `.env` (Phase 3) | — | Dokploy env |

Secrets never enter Git or the Docker image.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / server |
| `npm run lint` | ESLint |
| `npm run typecheck` | Generates Next route types, then `tsc --noEmit` |
| `npm test` | Vitest (includes es/en message parity) |
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
  globals.css            design tokens: the single source of truth
components/
  ui/                    shadcn primitives (Base UI)
  layout/                header, footer, container, locale switcher
  marketing/             landing sections
  article/ shared/ brand/
i18n/                    next-intl routing, request config, navigation
messages/                es.json (reference) and en.json
lib/                     db client, content read models, site facts
prisma/                  schema and migrations
docs/                    ADRs, roadmap, design system
tests/                   Vitest
proxy.ts                 locale negotiation (Next 16 "proxy", formerly middleware)
```

## Internationalization

- Code, identifiers and message keys are written in English; UI text lives in `messages/*.json`.
- Import `Link`, `redirect`, `usePathname` and `useRouter` from `@/i18n/navigation`, not from Next.
- Add a key to **both** catalogs; `npm test` fails if they diverge.
- User-generated content (articles, names, bios) is never machine-translated.

## CI/CD

GitHub Actions ([`ci.yml`](.github/workflows/ci.yml)) on every pull request and push to `main`: dependency audit → Prisma generate → lint → typecheck → migrations on a throwaway Postgres → tests → build → Docker image build. Deployment to Dokploy is planned for Phase 2; see [ADR 0004](docs/adr/0004-deployment-dokploy.md).

## Contributing

Work on a branch, use [Conventional Commits](https://www.conventionalcommits.org/), and open a pull request; CI must pass. UI work follows the design system in [`docs/design-system`](docs/design-system/README.md) and [`PRODUCT.md`](PRODUCT.md).

## License

Not decided yet. All rights reserved until a license is added.
