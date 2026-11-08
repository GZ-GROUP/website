# ADR 0007: Rich-text editor with TipTap and server-side static rendering

- **Status:** Accepted
- **Date:** 2026-11-08

## Context

Writers need a rich-text editor for articles that can contain headings, lists, quotes, code blocks, links and images. Readers must get fast, safe, server-rendered pages. The product decision was a visual (rich-text) editor rather than Markdown, choosing between Lexical and TipTap.

## Options considered

| Option | For | Against |
| --- | --- | --- |
| **TipTap 3** (ProseMirror) | Stable 3.x release line. JSON documents. `@tiptap/static-renderer` turns JSON into React elements on the server with no DOM and no HTML strings. Large extension ecosystem (code blocks with lowlight, images, links). | Some extensions are paid (not needed here). |
| Lexical | Backed by Meta, fast editor. | Still 0.x (0.53 in Nov 2026). Server rendering needs `@lexical/headless` plus a DOM (jsdom) to export HTML, which then has to be injected and sanitized. |

## Decision

- **Editor and storage:** TipTap 3. Articles are stored as TipTap (ProseMirror) JSON in `Article.content`, plus a plain-text copy (`contentText`) for search and reading time.
- **One schema:** a single extension list, [lib/editor/extensions.ts](../../lib/editor/extensions.ts), is shared by the editor (client), the validator and the renderer (server).
  - StarterKit with headings limited to h2/h3, since the title is the page h1.
  - No underline, because it reads as a link.
  - Links: http, https, mailto, same-site paths and fragments only.
  - Images that carry width and height.
  - Code blocks with lowlight.
- **Validation on save:** [lib/editor/content.ts](../../lib/editor/content.ts) parses the document against the ProseMirror schema. It rejects:
  - unknown nodes and unsupported attributes
  - h1 headings
  - unsafe links
  - images not served from our media store
  - documents over 500 KB
- **Rendering:** [lib/editor/render.tsx](../../lib/editor/render.tsx) uses `renderToReactElement` with custom mappings:
  - Headings get anchors.
  - External links open in a new tab with `rel="noopener noreferrer nofollow"`.
  - Media images keep their intrinsic size.
  - Code blocks are highlighted on the server (lowlight → hast → JSX), so readers download no highlighting JavaScript.
  - Rendering never uses `dangerouslySetInnerHTML`, so stored content cannot inject markup.
- **Shared typography:** one `.article-prose` class is used by the public page, the preview and the editor, so writers see what readers will see.

## Consequences

- Adding a node type means adding it to the shared extension list. Validation and rendering pick it up together.
- Markdown export or import is possible later with `@tiptap/static-renderer/pm/markdown` **[OPTIONAL]**.
- Autosave and collaborative editing are **[POST-MVP]** and **[FUTURE]** respectively.
