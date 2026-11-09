import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import type { AppLocale } from "@/i18n/routing";
import { blogIndexing, pageMetadata } from "@/lib/seo/metadata";
import { SiteShell } from "@/components/layout/site-shell";
import { ArticleListing } from "@/components/blog/listing";
import { parseListFilters } from "@/lib/articles/filters";
import { CATEGORY_SLUGS } from "@/lib/articles/limits";

export async function generateMetadata({ searchParams }: PageProps<"/[locale]/blog">): Promise<Metadata> {
  const t = await getTranslations("Blog");
  const { path, noindex } = blogIndexing(parseListFilters(await searchParams));
  return pageMetadata({ title: t("metaTitle"), description: t("metaDescription"), path, locale: (await getLocale()) as AppLocale, noindex });
}

export default async function BlogPage({ searchParams }: PageProps<"/[locale]/blog">) {
  const t = await getTranslations("Blog");
  const filters = parseListFilters(await searchParams);

  return (
    <SiteShell mainClassName="py-16 md:py-24">
      <ArticleListing title={t("title")} lead={t("lead")} filters={filters} categories={CATEGORY_SLUGS} />
    </SiteShell>
  );
}
