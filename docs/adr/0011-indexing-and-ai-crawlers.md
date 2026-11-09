# ADR 0011: Indexing and AI crawlers

- **Status:** Accepted
- **Date:** 2026-11-09

## Context

Before launch the site needs to be discoverable without exposing the private areas, and without one article appearing as duplicates in each interface language.

## Decision

- **`robots.txt` never names `/admin`, `/studio` or `/account`.** The file is public and would reveal them. They answer 404 to outsiders and carry `noindex`, which a crawler cannot read on a URL it is told not to fetch.
- **AI crawlers:** citing yes, training no. Training crawlers are disallowed by name (`GPTBot`, `ClaudeBot`, `Google-Extended`, `Applebot-Extended`, `CCBot`, `meta-externalagent`). Search and citation crawlers fall under the general rule. `Google-Extended` also governs Gemini grounding, so Gemini may cite the site less; Google Search and AI Overviews are unaffected.
- **Canonical and hreflang** are set per page through `lib/seo/metadata.ts`, and next-intl's HTTP `Link` headers are off, so there is one source and private pages get none.
  - UI-translated pages list both languages plus `x-default`.
  - Articles and profiles exist in one language: one canonical, no hreflang. An article's canonical is the version in the language it was written in.
- **`/blog`:** filtered views canonicalize to `/blog`, numbered pages to themselves, and searches are `noindex`.
- **`llms.txt`** is generated from public data. No major provider has committed to using it, so it is low-cost groundwork rather than an expected ranking gain.
- **Images:** an article with an image lacking alt text cannot be published. Avatars next to a visible name and decorative images keep an empty `alt`.

## Consequences

- `NEXT_PUBLIC_APP_URL` must be the real domain when the image is built.
- A new public page must call `pageMetadata` and be added to the sitemap.
- A new language needs its Open Graph locale in `lib/seo/metadata.ts`.
