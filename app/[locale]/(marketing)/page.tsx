import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Hero } from "@/components/marketing/hero";
import { WhatWePublish } from "@/components/marketing/what-we-publish";
import { LatestWork } from "@/components/marketing/latest-work";
import { FeaturedMembers } from "@/components/marketing/featured-members";
import { CallToAction } from "@/components/marketing/cta";
import { getFeaturedArticles, getFeaturedProjects } from "@/lib/content/featured";
import type { AppLocale } from "@/i18n/routing";
import { JsonLd, siteJsonLd } from "@/lib/seo/json-ld";
import { pageMetadata } from "@/lib/seo/metadata";

// Static, refreshed every minute and on every publish (revalidatePath). The build
// runs without a database, so the first minute after a deploy may show the
// empty state until the first regeneration.
export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  const locale = (await getLocale()) as AppLocale;
  return pageMetadata({ title: t("title"), description: t("description"), path: "/", locale, absoluteTitle: true });
}

export default async function HomePage() {
  const [projects, articles] = await Promise.all([getFeaturedProjects(), getFeaturedArticles()]);

  return (
    <>
      <JsonLd data={siteJsonLd()} />
      <Hero />
      <WhatWePublish />
      <LatestWork projects={projects} articles={articles} />
      <FeaturedMembers />
      <CallToAction />
    </>
  );
}
