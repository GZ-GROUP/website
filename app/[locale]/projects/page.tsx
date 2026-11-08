import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SiteShell } from "@/components/layout/site-shell";
import { ArticleListing } from "@/components/blog/listing";
import { parseListFilters } from "@/lib/articles/filters";
import { SHOWCASE_SLUGS } from "@/lib/articles/validation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Blog");
  return { title: t("projectsMetaTitle"), description: t("projectsLead") };
}

// Projects are articles in showcase categories (no separate entity).
export default async function ProjectsPage({ searchParams }: PageProps<"/[locale]/projects">) {
  const t = await getTranslations("Blog");
  const filters = parseListFilters(await searchParams, { kind: "SHOWCASE" });

  return (
    <SiteShell mainClassName="py-16 md:py-24">
      <ArticleListing
        basePath="/projects"
        title={t("projectsTitle")}
        lead={t("projectsLead")}
        filters={filters}
        categories={SHOWCASE_SLUGS}
      />
    </SiteShell>
  );
}
