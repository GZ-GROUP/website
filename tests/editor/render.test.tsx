import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { renderArticleContent, headingId } from "@/lib/editor/render";

const MEDIA = "/media/articles/0b9f3c8e-1d2a-4c5b-9e7f-123456789abc.webp";

function html(content: object) {
  return renderToStaticMarkup(<>{renderArticleContent(content)}</>);
}

describe("renderArticleContent", () => {
  it("renders headings with anchors, paragraphs and marks", () => {
    const out = html({
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Cómo empezar" }] },
        { type: "paragraph", content: [{ type: "text", text: "bold", marks: [{ type: "bold" }] }] },
      ],
    });
    expect(out).toContain('<h2 id="como-empezar">Cómo empezar</h2>');
    expect(out).toContain("<strong>bold</strong>");
  });

  it("opens external links safely and keeps internal links plain", () => {
    const out = html({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "ext", marks: [{ type: "link", attrs: { href: "https://example.com" } }] },
            { type: "text", text: "int", marks: [{ type: "link", attrs: { href: "/blog/x" } }] },
          ],
        },
      ],
    });
    expect(out).toContain('href="https://example.com" target="_blank" rel="noopener noreferrer nofollow"');
    expect(out).toContain('<a href="/blog/x">int</a>');
  });

  it("highlights code on the server", () => {
    const out = html({
      type: "doc",
      content: [{ type: "codeBlock", attrs: { language: "typescript" }, content: [{ type: "text", text: "const a = 1;" }] }],
    });
    expect(out).toContain('data-language="typescript"');
    expect(out).toContain('class="hljs-keyword"');
  });

  it("renders media images with their size and drops anything else", () => {
    const out = html({
      type: "doc",
      content: [
        { type: "image", attrs: { src: MEDIA, alt: "Diagrama", width: 800, height: 600 } },
        { type: "image", attrs: { src: "https://evil.example/x.png", alt: "x" } },
      ],
    });
    expect(out).toContain(`src="${MEDIA}"`);
    expect(out).toContain('width="800"');
    expect(out).not.toContain("evil.example");
  });

  it("never emits raw HTML from text", () => {
    const out = html({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "<script>x</script>" }] }] });
    expect(out).not.toContain("<script>");
    expect(out).toContain("&lt;script&gt;");
  });

  it("builds stable heading ids", () => {
    expect(headingId("Instalación y uso!")).toBe("instalacion-y-uso");
    expect(headingId("???")).toBe("section");
  });
});
