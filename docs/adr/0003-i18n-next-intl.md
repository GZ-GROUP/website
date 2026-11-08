# ADR 0003 — Internationalization with next-intl

- **Status:** Accepted
- **Date:** 2026-11-08

## Context

Code is written in English; the audience is mostly Spanish-speaking, and the site should also be readable in English.

## Decision

- **Library:** next-intl 4, the de facto standard for the App Router, with Server Component support and typed messages. `next-i18next` targets the Pages Router; a hand-rolled dictionary would mean rebuilding locale negotiation and ICU formatting.
- **Locales:** `es` (default) and `en`, with `localePrefix: "as-needed"`. Spanish has no prefix (`/blog`); English uses `/en/blog`. The proxy negotiates the locale from a cookie and `Accept-Language`.
- **Structure:** the root layout is `app/[locale]/layout.tsx`, so `<html lang>` is always correct. The locale is read through `next/root-params` in `i18n/request.ts`, which keeps pages statically rendered without calling `setRequestLocale` everywhere.
- **Messages:** `messages/es.json` is the typed reference catalog (`global.d.ts`). A Vitest test enforces identical keys and ICU placeholders in `en.json`.
- **URLs:** route slugs are in English for both locales (`/projects`). Localized slugs are [OPTIONAL] later.
- **Content:** user-generated content is not translated; only UI text is.

## Consequences

- Always import navigation helpers from `@/i18n/navigation`.
- When the root layout lives under a dynamic segment, Next.js serves the localized 404 rendered on the client. The status code and content are correct. `global-not-found` (experimental) can be revisited if no-JS 404s matter.
