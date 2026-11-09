import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/layout/site-shell";
import { Container } from "@/components/layout/container";
import { ArticleView } from "@/components/article/article-view";
import { ArticleReaction } from "@/components/community/article-reaction";
import { ArticleReadTracker } from "@/components/community/article-read-tracker";
import { CommentSection } from "@/components/community/comment-section";
import { getPublishedArticle } from "@/lib/articles/queries";
import { articleJsonLd, JsonLd } from "@/lib/seo/json-ld";
import { pageMetadata } from "@/lib/seo/metadata";
import { getSession } from "@/lib/auth/session";
import { getArticleComments, getLikeState } from "@/lib/community/queries";

// Rendered per request, not ISR: with ISR the first visit after an archive or
// unpublish could still be served the cached copy, and moderation must take
// effect immediately. The query is small and deduplicated with React cache().
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/[locale]/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublishedArticle(slug);
  if (!article) return {};
  const seo = pageMetadata({
    title: article.title,
    description: article.excerpt,
    path: `/blog/${article.slug}`,
    // The content exists in one language: that version is the canonical one.
    locale: article.language === "EN" ? "en" : "es",
    translated: false,
  });
  const cover = article.coverImageUrl ? [{ url: article.coverImageUrl, alt: article.coverAlt ?? "" }] : undefined;
  return {
    ...seo,
    openGraph: {
      ...seo.openGraph,
      type: "article",
      publishedTime: article.publishedAt.toISOString(),
      modifiedTime: article.updatedAt.toISOString(),
      authors: [article.author, ...article.coAuthors].map((person) => person.displayName),
      ...(cover ? { images: cover } : {}),
    },
    ...(cover ? { twitter: { ...seo.twitter, images: cover } } : {}),
  };
}

export default async function ArticlePage({ params, searchParams }: PageProps<"/[locale]/blog/[slug]">) {
  const { slug } = await params;
  const article = await getPublishedArticle(slug);
  if (!article) notFound(); // drafts and archived articles are not public

  const { comments: commentsPage } = await searchParams;
  const session = await getSession();
  const actor = session && !session.user.mustChangePassword ? session.user : null;
  const [likes, comments] = await Promise.all([
    getLikeState(article.id, actor?.id ?? null),
    getArticleComments(article.id, Number(commentsPage) || 1),
  ]);

  return (
    <SiteShell mainClassName="py-16 md:py-24">
      <JsonLd data={articleJsonLd(article)} />
      {actor && <ArticleReadTracker articleId={article.id} />}
      <ArticleView article={article} />
      {/* Interaction lives here, not in ArticleView, which the studio preview also renders. */}
      <Container size="reading" className="mt-12 flex flex-col gap-16 md:gap-20">
        <ArticleReaction articleId={article.id} initial={likes} signedIn={actor !== null} returnTo={`/blog/${slug}`} />
        <CommentSection articleId={article.id} slug={slug} comments={comments} actor={actor} />
      </Container>
    </SiteShell>
  );
}
