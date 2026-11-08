import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/layout/site-shell";
import { ArticleView } from "@/components/article/article-view";
import { getPublishedArticle } from "@/lib/articles/queries";

// Rendered per request, not ISR: with ISR the first visit after an archive or
// unpublish could still be served the cached copy, and moderation must take
// effect immediately. The query is small and deduplicated with React cache().
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/[locale]/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublishedArticle(slug);
  if (!article) return {};
  return {
    title: article.title,
    description: article.excerpt,
    openGraph: {
      type: "article",
      title: article.title,
      description: article.excerpt,
      publishedTime: article.publishedAt.toISOString(),
      ...(article.coverImageUrl ? { images: [{ url: article.coverImageUrl, alt: article.coverAlt ?? "" }] } : {}),
    },
  };
}

export default async function ArticlePage({ params }: PageProps<"/[locale]/blog/[slug]">) {
  const { slug } = await params;
  const article = await getPublishedArticle(slug);
  if (!article) notFound(); // drafts and archived articles are not public

  return (
    <SiteShell mainClassName="py-16 md:py-24">
      <ArticleView article={article} />
    </SiteShell>
  );
}
