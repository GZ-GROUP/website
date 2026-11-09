import { routing } from "@/i18n/routing";
import type { ArticleDetail } from "@/lib/articles/queries";
import { absoluteUrl, SITE_URL } from "@/lib/seo/metadata";
import { site } from "@/lib/site";

/** Titles and names are written by users: "<" must not be able to close the script tag. */
export function serializeJsonLd(data: object): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />;
}

const organization = {
  "@type": "Organization",
  name: site.name,
  url: SITE_URL,
  logo: `${SITE_URL}/brand/gz-logo.svg`,
  sameAs: [site.githubUrl],
};

export function siteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [organization, { "@type": "WebSite", name: site.name, url: SITE_URL, inLanguage: routing.locales }],
  };
}

export function articleJsonLd(article: ArticleDetail) {
  const locale = article.language === "EN" ? "en" : "es";
  const url = absoluteUrl(`/blog/${article.slug}`, locale);
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.excerpt,
    url,
    mainEntityOfPage: url,
    inLanguage: locale,
    datePublished: article.publishedAt.toISOString(),
    dateModified: article.updatedAt.toISOString(),
    author: [article.author, ...article.coAuthors].map((person) => ({
      "@type": "Person",
      name: person.displayName,
      ...(person.username ? { url: absoluteUrl(`/u/${person.username}`) } : {}),
    })),
    publisher: organization,
    ...(article.coverImageUrl ? { image: `${SITE_URL}${article.coverImageUrl}` } : {}),
  };
}
