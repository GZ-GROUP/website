import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["es", "en"],
  defaultLocale: "es",
  // Spanish (default) has no prefix: /blog. English is prefixed: /en/blog.
  localePrefix: "as-needed",
  // hreflang is declared once, in each page's metadata: competing HTTP headers
  // would also reach private pages.
  alternateLinks: false,
});

export type AppLocale = (typeof routing.locales)[number];
