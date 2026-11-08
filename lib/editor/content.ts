import { getSchema, type JSONContent } from "@tiptap/core";
import { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { articleExtensions } from "@/lib/editor/extensions";
import { isMediaSrc, isSafeHref } from "@/lib/editor/links";

// Server-side gate for article content: everything stored has been parsed
// against the article schema, so the renderer never meets unknown nodes,
// script URLs or third-party images.

const schema = getSchema(articleExtensions);

export const MAX_CONTENT_BYTES = 500_000;
const WORDS_PER_MINUTE = 200;

export const EMPTY_DOCUMENT: JSONContent = { type: "doc", content: [{ type: "paragraph" }] };

export type ContentError = "INVALID_CONTENT" | "CONTENT_TOO_LARGE" | "UNSAFE_LINK" | "EXTERNAL_IMAGE";

export type ValidContent = {
  ok: true;
  doc: JSONContent;
  text: string;
  words: number;
  readingMinutes: number;
};

export type ContentResult = ValidContent | { ok: false; error: ContentError };

export function readingMinutesFor(words: number): number {
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

export function validateContent(input: unknown): ContentResult {
  if (JSON.stringify(input ?? null).length > MAX_CONTENT_BYTES) return { ok: false, error: "CONTENT_TOO_LARGE" };

  let doc: ProseMirrorNode;
  try {
    doc = ProseMirrorNode.fromJSON(schema, input);
    doc.check(); // throws on invalid structure or unknown attributes
  } catch {
    return { ok: false, error: "INVALID_CONTENT" };
  }
  if (doc.type.name !== "doc") return { ok: false, error: "INVALID_CONTENT" };

  let error: ContentError | null = null;
  doc.descendants((node) => {
    if (error) return false;
    if (node.type.name === "image" && !isMediaSrc(node.attrs.src)) error = "EXTERNAL_IMAGE";
    // The article title is the page h1: content headings are h2/h3 only.
    if (node.type.name === "heading" && ![2, 3].includes(node.attrs.level)) error = "INVALID_CONTENT";
    for (const mark of node.marks) {
      if (mark.type.name === "link" && !isSafeHref(String(mark.attrs.href ?? ""))) error = "UNSAFE_LINK";
    }
    return !error;
  });
  if (error) return { ok: false, error };

  const text = doc.textBetween(0, doc.content.size, "\n\n", " ").trim();
  const words = text ? text.split(/\s+/).length : 0;
  return { ok: true, doc: doc.toJSON() as JSONContent, text, words, readingMinutes: readingMinutesFor(words) };
}

/** Media keys referenced by images in a (validated) document. */
export function contentMediaSources(doc: JSONContent): string[] {
  const out: string[] = [];
  const walk = (node: JSONContent) => {
    if (node.type === "image" && typeof node.attrs?.src === "string") out.push(node.attrs.src);
    node.content?.forEach(walk);
  };
  walk(doc);
  return out;
}
