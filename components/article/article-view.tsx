import { ButtonAnchor } from "@/components/ui/button-link";
import type { JSONContent } from "@tiptap/core";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { ArrowUpRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/layout/container";
import { Byline } from "@/components/article/byline";
import { renderArticleContent } from "@/lib/editor/render";
import type { ArticleDetail } from "@/lib/articles/queries";

// The reading experience, shared by the public article page and the studio
// preview so authors see exactly what readers will. Reading measure: 42rem.
export async function ArticleView({ article }: { article: ArticleDetail }) {
  const t = await getTranslations("ArticlePage");
  const tc = await getTranslations("Categories");
  const tl = await getTranslations("Languages");
  const format = await getFormatter();
  const locale = await getLocale();
  const otherLanguage = article.language.toLowerCase() !== locale;

  return (
    <article>
      <Container size="reading">
        <header>
          <Link
            href={`/blog?category=${article.category.slug}`}
            className="text-base font-bold text-primary-ink underline-offset-4 hover:underline"
          >
            {tc(`${article.category.slug}.title` as "software.title")}
          </Link>
          <h1 className="mt-4 text-3xl font-bold leading-display tracking-display text-balance md:text-4xl">
            {article.title}
          </h1>
          {article.excerpt && (
            <p className="mt-6 text-xl leading-8 text-pretty text-muted-foreground">{article.excerpt}</p>
          )}
          <p className="mt-8 flex flex-wrap gap-x-3 gap-y-1 text-base text-muted-foreground tabular-nums">
            <time dateTime={article.publishedAt.toISOString()}>
              {t("publishedOn", { date: format.dateTime(article.publishedAt, { dateStyle: "long" }) })}
            </time>
            <span aria-hidden>·</span>
            <span>{t("readingTime", { minutes: article.readingMinutes })}</span>
            {otherLanguage && (
              <>
                <span aria-hidden>·</span>
                <span lang={article.language.toLowerCase()}>{t("writtenIn", { language: tl(article.language) })}</span>
              </>
            )}
          </p>
          <div className="mt-8">
            <Byline author={article.author} coAuthors={article.coAuthors} />
          </div>
        </header>
      </Container>

      {article.coverImageUrl && (
        <Container size="content" className="mt-12 md:mt-16">
          {/* Already WebP and size-capped at upload (ADR 0008). */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={article.coverImageUrl} alt={article.coverAlt ?? ""} className="w-full bg-card" />
        </Container>
      )}

      <Container size="reading" className="mt-12 md:mt-16">
        <div className="article-prose" lang={article.language.toLowerCase()}>
          {renderArticleContent(article.content as JSONContent)}
        </div>

        {(article.tags.length > 0 || article.repositoryUrl || article.externalUrl) && (
          <footer className="mt-16 flex flex-col gap-8 border-t border-border pt-10">
            {article.tags.length > 0 && (
              <nav aria-label={t("tags")} className="flex flex-wrap gap-x-4 gap-y-2 text-base">
                {article.tags.map((tag) => (
                  <Link
                    key={tag.slug}
                    href={`/blog?tag=${tag.slug}`}
                    className="text-muted-foreground underline-offset-4 hover:text-primary-ink hover:underline"
                  >
                    #{tag.name}
                  </Link>
                ))}
              </nav>
            )}
            {(article.repositoryUrl || article.externalUrl) && (
              <div className="flex flex-wrap gap-3">
                {article.repositoryUrl && (
                  <ButtonAnchor variant="outline" href={article.repositoryUrl} target="_blank" rel="noopener noreferrer nofollow">
                    {t("repository")}
                    <ArrowUpRight data-icon="inline-end" aria-hidden />
                  </ButtonAnchor>
                )}
                {article.externalUrl && (
                  <ButtonAnchor variant="outline" href={article.externalUrl} target="_blank" rel="noopener noreferrer nofollow">
                    {t("demo")}
                    <ArrowUpRight data-icon="inline-end" aria-hidden />
                  </ButtonAnchor>
                )}
              </div>
            )}
          </footer>
        )}
      </Container>
    </article>
  );
}
