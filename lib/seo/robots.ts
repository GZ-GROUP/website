import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo/metadata";

/**
 * Crawlers that collect content to train models. Search and citation crawlers
 * (OAI-SearchBot, ChatGPT-User, Claude-SearchBot, Claude-User, PerplexityBot...)
 * are not listed: the general rule already lets them in.
 */
export const TRAINING_CRAWLERS = [
  "GPTBot",
  "ClaudeBot",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
  "meta-externalagent",
] as const;

/**
 * robots.txt is public, so private areas are deliberately absent: naming them
 * would reveal them. They answer 404 to outsiders and carry noindex, which a
 * crawler could not even read if the path were blocked here.
 */
export function robotsConfig(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: "/api/" },
      { userAgent: [...TRAINING_CRAWLERS], disallow: "/" },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
