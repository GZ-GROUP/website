import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SiteShell } from "@/components/layout/site-shell";
import { ArticleListing } from "@/components/blog/listing";
import { parseListFilters } from "@/lib/articles/filters";
import { CATEGORY_SLUGS } from "@/lib/articles/limits";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Blog");
  return { title: t("metaTitle"), description: t("lead") };
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
