import { describe, expect, it } from "vitest";
import { hasImageWithoutAlt } from "@/lib/editor/content";
import { serializeJsonLd } from "@/lib/seo/json-ld";
import { blogIndexing, languageAlternates, localizedPath, pageMetadata } from "@/lib/seo/metadata";
import { robotsConfig, TRAINING_CRAWLERS } from "@/lib/seo/robots";

describe("robots", () => {
  const config = robotsConfig();
  const text = JSON.stringify(config);

  it("never names the private areas, which robots.txt would reveal", () => {
    for (const area of ["/admin", "/studio", "/account"]) expect(text).not.toContain(area);
  });

  it("blocks training crawlers and leaves search and citation crawlers to the general rule", () => {
    const rules = [config.rules].flat();
    const blocked = rules.find((rule) => Array.isArray(rule.userAgent))!;
    expect(blocked.disallow).toBe("/");
    expect(blocked.userAgent).toEqual([...TRAINING_CRAWLERS]);
    for (const bot of ["OAI-SearchBot", "ChatGPT-User", "Claude-SearchBot", "Claude-User", "Googlebot"]) {
      expect(blocked.userAgent).not.toContain(bot);
    }
  });

  it("points to the sitemap", () => {
    expect(config.sitemap).toMatch(/\/sitemap\.xml$/);
  });
});

describe("URLs", () => {
  it("omits the prefix for the default language only", () => {
    expect(localizedPath("/blog", "es")).toBe("/blog");
    expect(localizedPath("/blog", "en")).toBe("/en/blog");
    expect(localizedPath("/", "en")).toBe("/en");
  });

  it("lists every language, itself included, plus x-default", () => {
    const languages = languageAlternates("/contact");
    expect(Object.keys(languages).sort()).toEqual(["en", "es", "x-default"]);
    expect(languages.en).toMatch(/\/en\/contact$/);
    expect(languages["x-default"]).toBe(languages.es);
  });
});

describe("pageMetadata", () => {
  it("adds hreflang only to pages that are really translated", () => {
    const translated = pageMetadata({ title: "A", path: "/team", locale: "es" });
    expect(translated.alternates?.languages).toBeDefined();
    const single = pageMetadata({ title: "A", path: "/blog/x", locale: "en", translated: false });
    expect(single.alternates?.languages).toBeUndefined();
    expect(single.alternates?.canonical).toMatch(/\/en\/blog\/x$/);
  });

  it("can keep a page out of the index while its links are followed", () => {
    expect(pageMetadata({ title: "A", path: "/", locale: "es", noindex: true }).robots).toEqual({ index: false, follow: true });
  });
});

describe("blogIndexing", () => {
  it("collapses filters into /blog, keeps numbered pages, and hides searches", () => {
    expect(blogIndexing({ page: 1 })).toEqual({ path: "/blog", noindex: false });
    expect(blogIndexing({ page: 3 })).toEqual({ path: "/blog?page=3", noindex: false });
    expect(blogIndexing({ page: 2, category: "software" })).toEqual({ path: "/blog", noindex: false });
    expect(blogIndexing({ page: 1, q: "rust" })).toEqual({ path: "/blog", noindex: true });
  });
});

describe("serializeJsonLd", () => {
  it("cannot be used to close the script tag", () => {
    expect(serializeJsonLd({ headline: "</script><script>alert(1)</script>" })).not.toContain("<");
  });
});

describe("hasImageWithoutAlt", () => {
  const image = (alt?: unknown) => ({ type: "image", attrs: { src: "/media/articles/x.webp", alt } });
  const doc = (...content: object[]) => ({ type: "doc", content });

  it("finds images with no description, however deep", () => {
    expect(hasImageWithoutAlt(doc(image()))).toBe(true);
    expect(hasImageWithoutAlt(doc(image("   ")))).toBe(true);
    expect(hasImageWithoutAlt(doc({ type: "blockquote", content: [image("")] }))).toBe(true);
  });

  it("accepts described images and documents without images", () => {
    expect(hasImageWithoutAlt(doc(image("Diagrama del compilador")))).toBe(false);
    expect(hasImageWithoutAlt(doc({ type: "paragraph" }))).toBe(false);
  });
});
