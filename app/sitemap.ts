import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { publishedForDiscovery } from "@/lib/articles/queries";
import { getTeamMembers } from "@/lib/community/queries";
import { absoluteUrl, languageAlternates } from "@/lib/seo/metadata";

// Per request: `next build` runs without a database.
export const dynamic = "force-dynamic";

const TRANSLATED_PAGES = ["/", "/blog", "/team", "/contact", "/privacy", "/terms"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, members] = await Promise.all([publishedForDiscovery(), getTeamMembers()]);

  const pages = TRANSLATED_PAGES.flatMap((path) =>
    routing.locales.map((locale) => ({
      url: absoluteUrl(path, locale),
      alternates: { languages: languageAlternates(path) },
    })),
  );

  // One URL each: the content of these exists in a single language.
  const posts = articles.map((article) => ({
    url: absoluteUrl(`/blog/${article.slug}`, article.language === "EN" ? "en" : "es"),
    lastModified: article.updatedAt,
  }));
  const profiles = members.filter((member) => member.username).map((member) => ({ url: absoluteUrl(`/u/${member.username}`) }));

  return [...pages, ...posts, ...profiles];
}
