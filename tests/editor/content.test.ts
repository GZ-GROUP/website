import { describe, expect, it } from "vitest";
import { EMPTY_DOCUMENT, readingMinutesFor, validateContent } from "@/lib/editor/content";
import { isSafeHref } from "@/lib/editor/links";

const MEDIA = "/media/articles/0b9f3c8e-1d2a-4c5b-9e7f-123456789abc.webp";

const doc = (...content: object[]) => ({ type: "doc", content });
const p = (text: string, marks?: object[]) => ({ type: "paragraph", content: [{ type: "text", text, marks }] });

describe("validateContent", () => {
  it("accepts the empty document", () => {
    const result = validateContent(EMPTY_DOCUMENT);
    expect(result.ok).toBe(true);
  });

  it("extracts text, word count and reading time", () => {
    const words = Array.from({ length: 450 }, (_, i) => `w${i}`).join(" ");
    const result = validateContent(doc({ type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Intro" }] }, p(words)));
    expect(result.ok && result.words).toBe(451);
    expect(result.ok && result.readingMinutes).toBe(2);
    expect(result.ok && result.text.startsWith("Intro")).toBe(true);
  });

  it("accepts code blocks, lists, quotes and media images", () => {
    const result = validateContent(
      doc(
        { type: "codeBlock", attrs: { language: "typescript" }, content: [{ type: "text", text: "const a = 1;" }] },
        { type: "bulletList", content: [{ type: "listItem", content: [p("item")] }] },
        { type: "blockquote", content: [p("quote")] },
        { type: "image", attrs: { src: MEDIA, alt: "diagram", width: 800, height: 600 } },
      ),
    );
    expect(result.ok).toBe(true);
  });

  it("rejects unknown nodes and h1 headings", () => {
    expect(validateContent(doc({ type: "iframe" }))).toEqual({ ok: false, error: "INVALID_CONTENT" });
    const h1 = doc({ type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "x" }] });
    expect(validateContent(h1)).toEqual({ ok: false, error: "INVALID_CONTENT" });
  });

  it("rejects javascript: links", () => {
    const result = validateContent(doc(p("click", [{ type: "link", attrs: { href: "javascript:alert(1)" } }])));
    expect(result).toEqual({ ok: false, error: "UNSAFE_LINK" });
  });

  it("rejects images that are not in our media store", () => {
    const result = validateContent(doc({ type: "image", attrs: { src: "https://tracker.example/pixel.png" } }));
    expect(result).toEqual({ ok: false, error: "EXTERNAL_IMAGE" });
  });

  it("rejects non-documents and oversized input", () => {
    expect(validateContent("<script>").ok).toBe(false);
    expect(validateContent(doc(p("x".repeat(600_000))))).toEqual({ ok: false, error: "CONTENT_TOO_LARGE" });
  });

  it("reading time is at least one minute", () => {
    expect(readingMinutesFor(0)).toBe(1);
    expect(readingMinutesFor(1000)).toBe(5);
  });
});

describe("isSafeHref", () => {
  it.each(["https://gzgroup.dev", "http://example.com/a?b=c", "mailto:hi@gzgroup.dev", "/blog/post", "#section"])(
    "allows %s",
    (href) => expect(isSafeHref(href)).toBe(true),
  );
  it.each(["javascript:alert(1)", "data:text/html,<b>x</b>", "//evil.example", "vbscript:x", "ftp://x"])("blocks %s", (href) =>
    expect(isSafeHref(href)).toBe(false),
  );
});
