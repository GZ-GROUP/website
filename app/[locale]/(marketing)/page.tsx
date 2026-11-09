import { Hero } from "@/components/marketing/hero";
import { WhatWePublish } from "@/components/marketing/what-we-publish";
import { LatestWork } from "@/components/marketing/latest-work";
import { FeaturedMembers } from "@/components/marketing/featured-members";
import { CallToAction } from "@/components/marketing/cta";
import { getFeaturedArticles, getFeaturedProjects } from "@/lib/content/featured";

// Static, refreshed every minute and on every publish (revalidatePath). The build
// runs without a database, so the first minute after a deploy may show the
// empty state until the first regeneration.
export const revalidate = 60;

export default async function HomePage() {
  const [projects, articles] = await Promise.all([getFeaturedProjects(), getFeaturedArticles()]);

  return (
    <>
      <Hero />
      <WhatWePublish />
      <LatestWork projects={projects} articles={articles} />
      <FeaturedMembers />
      <CallToAction />
    </>
  );
}
