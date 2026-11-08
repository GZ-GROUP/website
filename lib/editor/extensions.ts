import type { Extensions } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { lowlight } from "@/lib/editor/lowlight";
import { isSafeHref } from "@/lib/editor/links";

// The single TipTap schema for articles. The editor (client), the validator and
// the static renderer (server) all use this list, so what can be written is
// exactly what can be stored and rendered.

/** Images keep their intrinsic size so the page reserves space (no layout shift). */
const ArticleImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: { default: null },
      height: { default: null },
    };
  },
}).configure({ inline: false, allowBase64: false });

export const articleExtensions: Extensions = [
  StarterKit.configure({
    heading: { levels: [2, 3] }, // the article title is the page's h1
    codeBlock: false, // replaced by the highlighted code block below
    underline: false, // underline reads as a link on the web
    link: {
      openOnClick: false,
      autolink: true,
      defaultProtocol: "https",
      isAllowedUri: (url) => isSafeHref(url),
    },
  }),
  ArticleImage,
  CodeBlockLowlight.configure({ lowlight, defaultLanguage: "plaintext" }),
];
