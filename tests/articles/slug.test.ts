import { describe, expect, it } from "vitest";
import { normalizeTag, slugify, uniqueSlug } from "@/lib/articles/slug";
import { articleMetaSchema, publishProblems } from "@/lib/articles/validation";

describe("slugify", () => {
  it.each([
    ["¿Qué es un compilador?", "que-es-un-compilador"],
    ["Año nuevo, código nuevo", "ano-nuevo-codigo-nuevo"],
    ["  Rust + WebAssembly!! ", "rust-webassembly"],
    ["日本語", ""],
  ])("%s → %s", (input, expected) => expect(slugify(input)).toBe(expected));

  it("caps the length without a trailing dash", () => {
    const slug = slugify("palabra ".repeat(30));
    expect(slug.length).toBeLessThanOrEqual(80);
    expect(slug.endsWith("-")).toBe(false);
  });
});

describe("uniqueSlug", () => {
  it("adds a numeric suffix when taken", async () => {
    const taken = new Set(["mi-proyecto", "mi-proyecto-2"]);
    expect(await uniqueSlug("Mi proyecto", async (s) => taken.has(s))).toBe("mi-proyecto-3");
  });

  it("falls back to 'article' when the title has no latin characters", async () => {
    expect(await uniqueSlug("日本語", async () => false)).toBe("article");
  });
});

describe("tags and article metadata", () => {
  it("normalizes tags", () => {
    expect(normalizeTag("  Machine   Learning ")).toEqual({ slug: "machine-learning", name: "Machine Learning" });
    expect(normalizeTag("!!!")).toBeNull();
  });

  const meta = {
    title: "Un título",
    excerpt: "",
    category: "software",
    language: "ES",
    tags: [],
    coverImageKey: null,
    coverAlt: "",
    repositoryUrl: "",
    externalUrl: "",
    coAuthors: [],
  };

  it("accepts https links only and blanks become null", () => {
    expect(articleMetaSchema.parse(meta).repositoryUrl).toBeNull();
    expect(articleMetaSchema.safeParse({ ...meta, repositoryUrl: "http://github.com/x" }).success).toBe(false);
    expect(articleMetaSchema.safeParse({ ...meta, repositoryUrl: "javascript:alert(1)" }).success).toBe(false);
    expect(articleMetaSchema.parse({ ...meta, repositoryUrl: "https://github.com/GZ-GROUP/x" }).repositoryUrl).toBe(
      "https://github.com/GZ-GROUP/x",
    );
  });

  it("rejects unknown categories, too many tags and foreign cover keys", () => {
    expect(articleMetaSchema.safeParse({ ...meta, category: "news" }).success).toBe(false);
    expect(articleMetaSchema.safeParse({ ...meta, tags: ["a", "b", "c", "d", "e", "f"] }).success).toBe(false);
    expect(articleMetaSchema.safeParse({ ...meta, coverImageKey: "../../etc/passwd" }).success).toBe(false);
  });

  it("lists what blocks publishing", () => {
    expect(publishProblems({ title: "", excerpt: "", contentText: "corto", coverImageKey: "k", coverAlt: "" })).toEqual([
      "TITLE_REQUIRED",
      "EXCERPT_REQUIRED",
      "CONTENT_TOO_SHORT",
      "COVER_ALT_REQUIRED",
    ]);
    expect(
      publishProblems({ title: "T", excerpt: "E", contentText: "x".repeat(60), coverImageKey: null, coverAlt: null }),
    ).toEqual([]);
  });
});
