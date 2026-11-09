import Image from "next/image";
import { Fragment } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import type { JSONContent } from "@tiptap/core";
import type { Mark, Node as ProseMirrorNode } from "@tiptap/pm/model";
import { renderToReactElement } from "@tiptap/static-renderer/pm/react";
import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import { articleExtensions } from "@/lib/editor/extensions";
import { isExternalHref, isMediaSrc, isSafeHref } from "@/lib/editor/links";
import { lowlight } from "@/lib/editor/lowlight";

// Server-side rendering of stored article JSON into React elements.
// No HTML strings and no dangerouslySetInnerHTML: every node becomes a React
// element, so stored content cannot inject markup or scripts.

type NodeProps = { node: ProseMirrorNode; children?: React.ReactNode };
type MarkProps = { mark: Mark; children?: React.ReactNode };

/** Anchor ids for headings, stable for a given document. */
export function headingId(text: string): string {
  return (
    text
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "section"
  );
}

function Heading({ node, children }: NodeProps) {
  const id = headingId(node.textContent);
  return node.attrs.level === 3 ? <h3 id={id}>{children}</h3> : <h2 id={id}>{children}</h2>;
}

function CodeBlock({ node }: NodeProps) {
  const language = String(node.attrs.language ?? "plaintext");
  const code = node.textContent;
  const highlighted =
    language !== "plaintext" && lowlight.registered(language)
      ? toJsxRuntime(lowlight.highlight(language, code), { Fragment, jsx, jsxs })
      : code;
  return (
    <pre data-language={language}>
      <code className={`hljs language-${language}`}>{highlighted}</code>
    </pre>
  );
}

function ContentImage({ node }: NodeProps) {
  const { src, alt, width, height } = node.attrs;
  if (!isMediaSrc(src)) return null; // validated on save; defense in depth
  return (
    <figure>
      <Image
        src={src}
        alt={typeof alt === "string" ? alt : ""}
        width={typeof width === "number" ? width : 1200}
        height={typeof height === "number" ? height : 750}
        sizes="(min-width: 42rem) 608px, 100vw"
      />
    </figure>
  );
}

function LinkMark({ mark, children }: MarkProps) {
  const href = String(mark.attrs.href ?? "");
  if (!isSafeHref(href)) return <>{children}</>;
  return isExternalHref(href) ? (
    <a href={href} target="_blank" rel="noopener noreferrer nofollow">
      {children}
    </a>
  ) : (
    <a href={href}>{children}</a>
  );
}

export function renderArticleContent(content: JSONContent): React.ReactNode {
  return renderToReactElement({
    content,
    extensions: articleExtensions,
    options: {
      nodeMapping: { heading: Heading, codeBlock: CodeBlock, image: ContentImage },
      markMapping: { link: LinkMark },
    },
  });
}
