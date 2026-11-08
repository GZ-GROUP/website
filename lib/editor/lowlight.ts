import { common, createLowlight } from "lowlight";

// One syntax-highlighting instance (highlight.js "common" grammars) shared by the
// editor and the server renderer, so both agree on the languages.
export const lowlight = createLowlight(common);

/** Languages offered in the editor's code-block picker. */
export const CODE_LANGUAGES = [
  "plaintext",
  "bash",
  "c",
  "cpp",
  "csharp",
  "css",
  "go",
  "java",
  "javascript",
  "json",
  "kotlin",
  "markdown",
  "php",
  "python",
  "rust",
  "sql",
  "swift",
  "typescript",
  "xml",
  "yaml",
] as const;
