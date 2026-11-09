import type { ArticleSummary } from "./types";
import { latestPublished } from "@/lib/articles/queries";

// Landing page data. The landing is statically generated and revalidated, but
// `next build` runs without a database: during the build these return empty
// lists and the first revalidation (or a publish) fills them in.
const isBuild = () => process.env.NEXT_PHASE === "phase-production-build";

export async function getFeaturedProjects(): Promise<ArticleSummary[]> {
  return isBuild() ? [] : latestPublished("SHOWCASE", 3);
}

export async function getFeaturedArticles(): Promise<ArticleSummary[]> {
  return isBuild() ? [] : latestPublished("EDITORIAL", 3);
}
