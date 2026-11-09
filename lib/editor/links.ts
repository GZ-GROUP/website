// Link and image URL rules for article content. Pure functions, shared by the
// editor (client) and validation/rendering (server).

const SAFE_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);

/** Absolute http(s)/mailto URLs, same-site paths ("/…") and fragments ("#…"). */
export function isSafeHref(value: string): boolean {
  const href = value.trim();
  if (href.startsWith("/") && !href.startsWith("//")) return true;
  if (href.startsWith("#")) return true;
  try {
    return SAFE_PROTOCOLS.has(new URL(href).protocol);
  } catch {
    return false;
  }
}

export function isExternalHref(href: string): boolean {
  return /^https?:\/\//i.test(href.trim());
}

/** Content images must come from our own media store (no hotlinking or tracking pixels). */
export const MEDIA_PATH_PATTERN = /^\/media\/articles\/[0-9a-f-]{36}\.webp$/;

/** Profile photos. Separate from article images: they can never be embedded in an article. */
const AVATAR_PATH_PATTERN = /^\/media\/avatars\/[0-9a-f-]{36}\.webp$/;

/** Everything GET /media/... may serve. */
export function isServedMediaPath(path: string): boolean {
  return MEDIA_PATH_PATTERN.test(path) || AVATAR_PATH_PATTERN.test(path);
}

/** The storage key of a photo we host; null for GitHub's or for no photo. */
export function avatarKeyFromUrl(url: string | null | undefined): string | null {
  return url && AVATAR_PATH_PATTERN.test(url) ? url.slice("/media/".length) : null;
}

export function isMediaSrc(src: unknown): src is string {
  return typeof src === "string" && MEDIA_PATH_PATTERN.test(src);
}

export function mediaUrl(key: string): string {
  return `/media/${key}`;
}

export function mediaKeyFromUrl(url: string): string | null {
  return isMediaSrc(url) ? url.slice("/media/".length) : null;
}

/** External project links (repository, demo): https only. */
export function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}
