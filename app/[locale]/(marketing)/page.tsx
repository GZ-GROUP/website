import { Hero } from "@/components/marketing/hero";
import { WhatWePublish } from "@/components/marketing/what-we-publish";
import { LatestWork } from "@/components/marketing/latest-work";
import { FeaturedMembers } from "@/components/marketing/featured-members";
import { CallToAction } from "@/components/marketing/cta";
import { getFeaturedArticles, getFeaturedMembers, getFeaturedProjects } from "@/lib/content/featured";

// Static, refreshed every 5 minutes and on every publish (revalidatePath).
export const revalidate = 300;

export default async function HomePage() {
  const [projects, articles, members] = await Promise.all([
    getFeaturedProjects(),
    getFeaturedArticles(),
    getFeaturedMembers(),
  ]);

  return (
    <>
      <Hero />
      <WhatWePublish />
      <LatestWork projects={projects} articles={articles} />
      <FeaturedMembers members={members} />
      <CallToAction />
    </>
  );
}
