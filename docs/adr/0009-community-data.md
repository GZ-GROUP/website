# ADR 0009: Community data (comments, likes, reading history)

- **Status:** Accepted
- **Date:** 2026-11-08

## Context

Phase 5 lets signed-in users comment on and like articles, and gives them a dashboard with real metrics only. Three questions shape the data: what deleting a comment means when others have replied to it, how "articles viewed" can be real without tracking visitors, and how to limit abuse without new infrastructure.

## Decision

- **Comments are plain text, with one level of replies.**
  - The body is stored as typed and always rendered as text, so a comment cannot inject HTML.
  - The server enforces the single level: a reply's parent must be a live top-level comment of the same article.
  - A comment's author and any admin can delete it. Authors of the article cannot.
- **Mixed deletion:**
  - No replies: the row is deleted.
  - With replies: the row stays as a tombstone, with `deletedAt` set and the text erased, so the conversation still reads.
  - Deleting the last reply of a tombstone removes both.
- **Banned users are hidden when reading, not deleted.** Lifting a ban brings their comments back.
- **Likes are per article, one per user** (`ArticleLike`). Counts are computed with `COUNT`; a denormalised counter is **[POST-MVP]** if traffic requires it.
- **Reading history (`ArticleRead`):**
  - Signed-in users only, one row per user and article. No IP addresses and nothing about anonymous visitors.
  - Recorded by a server action called from the browser, because writing during a GET render would count prefetches and crawlers.
  - Private to the user: public profiles never show it, nor the likes someone has given.
- **Metrics count only what can be opened:** published articles and comments that were not removed, so a number always matches the list beside it.
- **Comment rate limit:** at most 5 comments per user per 60 seconds, checked against the `comments` table. It is approximate under concurrency, which is acceptable for an anti-spam limit.

## Consequences

- Comments block deleting a user (`onDelete: Restrict`), like articles and uploads. Account deletion, when it exists, must decide what happens to them.
- The erased text of a tombstone cannot be recovered.
- **[POST-MVP]** Editing comments, reporting them, liking comments, and clearing the reading history.
