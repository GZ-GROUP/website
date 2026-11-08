import { ArticleCard } from "@/components/article/article-card";
import type { ArticleSummary } from "@/lib/content/types";

type ArticleGridProps = { items: ArticleSummary[]; headingLevel?: 2 | 3; columns?: 2 | 3 };

export function ArticleGrid({ items, headingLevel = 3, columns = 3 }: ArticleGridProps) {
  return (
    <ul className={`grid gap-x-8 gap-y-16 sm:grid-cols-2 ${columns === 3 ? "lg:grid-cols-3" : ""}`}>
      {items.map((article) => (
        <li key={article.slug} className="reveal">
          <ArticleCard article={article} headingLevel={headingLevel} />
        </li>
      ))}
    </ul>
  );
}
