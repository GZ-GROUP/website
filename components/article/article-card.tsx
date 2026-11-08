import Image from "next/image";
import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { VerifiedBadge } from "@/components/shared/verified-badge";
import type { ArticleSummary } from "@/lib/content/types";

// One card for both projects (showcase categories) and editorial articles.
// The whole card is one link; byline and badges are text inside it.
export function ArticleCard({ article }: { article: ArticleSummary }) {
  const t = useTranslations("Article");
  const format = useFormatter();
  const { author, coAuthors } = article;

  return (
    <article className="group relative flex flex-col">
      <div className="aspect-[16/10] overflow-hidden bg-muted">
        {article.coverImageUrl && (
          <Image
            src={article.coverImageUrl}
            alt=""
            width={800}
            height={500}
            className="size-full object-cover transition-transform duration-300 ease-out-strong group-hover:scale-[1.02]"
          />
        )}
      </div>

      <p className="mt-5 text-sm font-bold text-primary-ink">{article.category.name}</p>
      <h3 className="mt-2 text-xl font-bold leading-snug text-balance">
        <Link href={`/blog/${article.slug}`} className="after:absolute after:inset-0">
          {article.title}
        </Link>
      </h3>
      <p className="mt-3 line-clamp-3 text-base leading-7 text-muted-foreground">{article.excerpt}</p>

      <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
        <span>
          {t("by")} <span className="font-bold text-foreground">{author.displayName}</span>
          {coAuthors.length > 0 &&
            ` ${t("coAuthors", { names: format.list(coAuthors.map((c) => c.displayName)) })}`}
        </span>
        {author.verifications.map((provider) => (
          <VerifiedBadge key={provider} provider={provider} />
        ))}
      </div>
      <time dateTime={article.publishedAt.toISOString()} className="mt-2 text-sm text-muted-foreground">
        {format.dateTime(article.publishedAt, { dateStyle: "long" })}
      </time>
    </article>
  );
}
