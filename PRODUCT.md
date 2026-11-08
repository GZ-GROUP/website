# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary (today): readers who explore.** Developers, students, professors and companies who arrive to discover software projects, research and experiments made by GZ Group members, and read the explanations behind them.
- **Secondary: readers who sign up.** Public sign-up only ever creates a Reader (informally "reviewer"): they comment on and react to projects and articles, and manage their profile. Later, companies or recruiters evaluating the group's work.
- **Authors are never recruited publicly.** Nobody signs up as an author. The master admin promotes an existing Reader to Writer from the backend; this flow must not be mentioned or hinted at anywhere public.

## Product Purpose

GZ Group is a community of emerging software developers. The platform is its editorial home: a place to publish, discover and discuss members' projects, research and experiments, with clear authorship. Long term, GZ Group intends to become a software development company, so the platform must be able to grow from a community site into a professional one.

## Positioning

Work explained by the people who built it, with authorship you can trust: every author can link and verify GitHub or LinkedIn, and bylines show those verifications. A "project" is an article in a showcase category (Software, Research, Experiments); editorial articles (tutorials, opinion, community) share the same model.

## Capabilities and Constraints

- Built so far: landing page (es/en), design tokens, layout shell. Blog, projects, team, auth and profiles are planned (see docs/roadmap.md) and must not be presented as working before they ship.
- Roles: Reader (default for every sign-up), Writer (granted only by the master admin), Admin. The master admin is the default account `admin@gzgroup.dev`, created at bootstrap, not through sign-up. RBAC is always enforced server-side.
- Authentication, account linking, identity verification and authorization are separate concepts.
- UI is bilingual: Spanish (default, unprefixed URLs) and English (`/en`). Code and message keys are in English. User-generated content is not translated.
- Stack: Next.js 16 App Router, Tailwind v4, shadcn/ui on Base UI, Prisma 7 + PostgreSQL 17, Better Auth (Phase 3), deployed with Docker on Dokploy.

## Brand Commitments

- Official colour ramps (text, background, primary, secondary, accent; 50–950, light + official dark inversion) are binding; components consume tokens only (app/globals.css).
- Typeface: Poppins 400 and 700 only, on the official scale (sm 0.75rem → 5xl 4.21rem).
- Logo: the "G" stroke with the cursor arrow, `public/brand/gz-logo.svg` (#38bdf8 / #2563eb).
- Dark mode is the default. Square-cornered shadcn "Sera" preset.
- GitHub organization: https://github.com/GZ-GROUP

## Evidence on Hand

- No published projects, articles, member profiles, testimonials, press or metrics exist yet. Landing sections show honest empty states; never fabricate content, people, quotes or numbers.
- No photography or footage of the group exists yet.

## Product Principles

1. Show real work or say plainly that it is coming; never fake proof.
2. Authorship is first-class: who built it, and how we know it's them.
3. Reading comes first on editorial surfaces; tools (editor, dashboard) favour usability over decoration.
4. Grow in phases; no feature ships before its phase.

## Accessibility & Inclusion

WCAG AA minimum (AAA for critical UI where reasonable), keyboard operable, visible focus everywhere, `prefers-reduced-motion` respected, bilingual UI with correct `lang`.
