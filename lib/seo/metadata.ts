import type { Metadata } from "next";
import { routing, type AppLocale } from "@/i18n/routing";
import { site } from "@/lib/site";

// Canonical, hreflang and social metadata for public pages. Set per page, never
// in a layout, so private and not-found pages can't inherit a wrong canonical.

export const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");

const OG_LOCALES: Record<AppLocale, string> = { es: "es_PA", en: "en_US" };
const SHARE_IMAGE = { url: "/brand/og-default.png", width: 1200, height: 630 };

/** The default locale has no prefix (routing: "as-needed"). */
export function localizedPath(path: string, locale: AppLocale): string {
  if (locale === routing.defaultLocale) return path;
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}

export const absoluteUrl = (path: string, locale: AppLocale = routing.defaultLocale) =>
  `${SITE_URL}${localizedPath(path, locale)}`;

/** Every language, the current one included, plus the fallback for anyone else. */
export function languageAlternates(path: string): Record<string, string> {
  return {
    ...Object.fromEntries(routing.locales.map((locale) => [locale, absoluteUrl(path, locale)])),
    "x-default": absoluteUrl(path, routing.defaultLocale),
  };
}

type PageSeo = {
  title: string;
  description?: string;
  path: string;
  locale: AppLocale;
  /** Use the title exactly as given, without the " | GZ Group" suffix. */
  absoluteTitle?: boolean;
  /** False when the main content is the same in every language: articles and profiles. */
  translated?: boolean;
  noindex?: boolean;
};

export function pageMetadata({ title, description, path, locale, absoluteTitle, translated = true, noindex }: PageSeo): Metadata {
  const canonical = absoluteUrl(path, locale);
  const fullTitle = absoluteTitle ? title : `${title} | ${site.name}`;
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical, ...(translated ? { languages: languageAlternates(path) } : {}) },
    openGraph: {
      title: fullTitle,
      description,
      url: canonical,
      siteName: site.name,
      locale: OG_LOCALES[locale],
      type: "website",
      images: [SHARE_IMAGE],
    },
    twitter: { card: "summary_large_image", title: fullTitle, description, images: [SHARE_IMAGE.url] },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

/**
 * Which /blog URL represents a listing. Filtered views collapse into /blog,
 * numbered pages stand on their own, and search results stay out of the index.
 */
export function blogIndexing(filters: { category?: string; tag?: string; q?: string; sort?: string; page: number }) {
  const filtered = Boolean(filters.category || filters.tag || filters.sort === "oldest");
  const path = !filtered && filters.page > 1 ? `/blog?page=${filters.page}` : "/blog";
  return { path, noindex: Boolean(filters.q) };
}
