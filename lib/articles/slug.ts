const MAX_SLUG = 80;

/** "¿Qué es un compilador?" → "que-es-un-compilador". */
export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/ñ/g, "n")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SLUG)
    .replace(/-+$/g, "");
}

/** Appends -2, -3… until `isTaken` says the slug is free. */
export async function uniqueSlug(base: string, isTaken: (slug: string) => Promise<boolean>): Promise<string> {
  const root = slugify(base) || "article";
  if (!(await isTaken(root))) return root;
  for (let n = 2; n < 1000; n++) {
    const candidate = `${root.slice(0, MAX_SLUG - String(n).length - 1)}-${n}`;
    if (!(await isTaken(candidate))) return candidate;
  }
  return `${root.slice(0, MAX_SLUG - 9)}-${Date.now().toString(36)}`;
}

/** Tags: lowercase words, letters/digits/dashes, at most 40 characters. */
export function normalizeTag(value: string): { slug: string; name: string } | null {
  const name = value.trim().replace(/\s+/g, " ").slice(0, 40);
  const slug = slugify(name).slice(0, 40);
  return slug ? { slug, name } : null;
}
