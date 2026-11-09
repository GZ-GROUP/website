import Image from "next/image";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { GZLogo } from "@/components/brand/logo";
import type { ArticleSummary } from "@/lib/content/types";

// One card for projects (showcase categories) and editorial articles.
// The title link stretches over the whole card; nothing else inside is a link.
export function ArticleCard({ article, headingLevel = 3 }: { article: ArticleSummary; headingLevel?: 2 | 3 }) {
  const t = useTranslations("ArticlePage");
  const tc = useTranslations("Categories");
  const tl = useTranslations("Languages");
  const format = useFormatter();
  const locale = useLocale();
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const names = [article.author, ...article.coAuthors].map((a) => a.displayName);
  const otherLanguage = article.language.toLowerCase() !== locale;

  return (
    <article className="group relative flex flex-col">
      <div className="relative aspect-16/10 overflow-hidden bg-card">
        {article.coverImageUrl ? (
          <Image
            src={article.coverImageUrl}
            alt={article.coverAlt ?? ""}
            fill
            sizes="(min-width: 1024px) 368px, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 ease-out-strong group-hover:scale-[1.02]"
          />
        ) : (
          <div aria-hidden className="flex size-full items-center justify-center">
            <GZLogo className="h-12 opacity-40" />
          </div>
        )}
      </div>

      <p className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <span className="font-bold text-primary-ink">{tc(`${article.category.slug}.title` as "software.title")}</span>
        {otherLanguage && <span className="text-muted-foreground">{tl(article.language)}</span>}
      </p>
      <Heading className="mt-2 text-xl font-bold leading-snug text-balance">
        <Link
          href={`/blog/${article.slug}`}
          className="after:absolute after:inset-0 group-hover:text-primary-ink focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-ring"
        >
          {article.title}
        </Link>
      </Heading>
      <p className="mt-3 line-clamp-3 text-base leading-7 text-muted-foreground">{article.excerpt}</p>

      <p className="mt-5 text-sm text-muted-foreground">
        {t("by")} <span className="font-bold text-foreground">{format.list(names, { type: "conjunction" })}</span>
      </p>
      <p className="mt-1 text-sm text-muted-foreground tabular-nums">
        <time dateTime={article.publishedAt.toISOString()}>
          {format.dateTime(article.publishedAt, { dateStyle: "medium" })}
        </time>
        {" · "}
        {t("readingTime", { minutes: article.readingMinutes })}
      </p>
    </article>
  );
}
