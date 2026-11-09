# ADR 0008: Image storage on S3-compatible object storage (RustFS)

- **Status:** Accepted
- **Date:** 2026-11-08

## Context

Articles have a cover image and inline images. Files must not live in the container filesystem, which is ephemeral and holds a single copy. The product decision is S3-compatible storage, with **RustFS** running in docker-compose.

## Decision

- **Storage:** any S3-compatible service, accessed with `@aws-sdk/client-s3` in path-style mode (RustFS supports only path-style addressing).
  - Configuration: `S3_ENDPOINT`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET` and `S3_FORCE_PATH_STYLE`.
  - Locally, `rustfs/rustfs:1.0.4` runs in docker-compose: S3 API on :9000, console on :9001.
  - The bucket is created by `instrumentation.ts` at server start when it is missing. The step is idempotent.
- **Upload (`POST /api/uploads`):**
  - Only Writers and Admins. Everyone else gets a 404, so the studio is never revealed.
  - At most 5 MB. The real format is read from the bytes with sharp: JPEG, PNG or WebP.
  - Each image is re-encoded to WebP at a maximum width of 2000 px and EXIF orientation is applied. All metadata (EXIF, GPS) is dropped.
  - Each file gets an immutable random key (`articles/<uuid>.webp`) and a `Media` row records who uploaded it.
- **Serving (`GET /media/articles/<uuid>.webp`):**
  - The bucket stays **private**. RustFS's anonymous-read support could not be confirmed, and one origin keeps CSP and cookies simple.
  - The route validates the key pattern and streams the object with `Cache-Control: public, max-age=31536000, immutable`, `X-Content-Type-Options: nosniff` and a restrictive CSP.
- **Validation on save:** articles can only reference keys that exist in `Media`, both for the cover and for inline images. The content validator rejects any other image source.

- **Profile photos (`POST` and `DELETE /api/account/avatar`):**
  - Any signed-in user, at most one change every 5 seconds.
  - Same validation as article images, then a 512 px square cropped around the most interesting part of the picture, stored under `avatars/<uuid>.webp`.
  - Replacing or removing a photo deletes the previous file.
  - `avatars/` keys are served by `/media` but can never be embedded in an article.
  - Better Auth's public `/update-user` endpoint cannot change `image`, so a photo cannot point to an external URL.

## Consequences

- Production needs an S3-compatible endpoint and credentials, either RustFS on the server or a managed S3 bucket. Deployment work stays paused until every phase is finished.
- Images are served through the app. A CDN in front of `/media` is possible later and needs no code changes, because keys are immutable.
- **[POST-MVP]** A cleanup job for orphaned uploads (`Media` rows no article references).
