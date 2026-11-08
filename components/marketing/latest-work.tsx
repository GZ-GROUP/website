import { useTranslations } from "next-intl";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArticleCard } from "@/components/article/article-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Section } from "@/components/marketing/section";
import type { ArticleSummary } from "@/lib/content/types";
import { site } from "@/lib/site";

type LatestWorkProps = {
  projects: ArticleSummary[];
  articles: ArticleSummary[];
};

export function LatestWork({ projects, articles }: LatestWorkProps) {
  const t = useTranslations("Home.latest");
  const nothingPublished = projects.length === 0 && articles.length === 0;

  return (
    <Section id="latest" title={t("title")} tone="card">
      {nothingPublished ? (
        <EmptyState
          className="reveal bg-background"
          title={t("emptyTitle")}
          description={t("emptyBody")}
          action={
            <Button
              variant="outline"
              nativeButton={false}
              render={<a href={site.githubUrl} target="_blank" rel="noopener noreferrer" />}
            >
              {t("githubCta")}
              <ArrowUpRight data-icon="inline-end" aria-hidden />
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-20">
          <ArticleGroup title={t("projects")} items={projects} empty={t("emptyList")} />
          <ArticleGroup title={t("articles")} items={articles} empty={t("emptyList")} />
        </div>
      )}
    </Section>
  );
}

function ArticleGroup({ title, items, empty }: { title: string; items: ArticleSummary[]; empty: string }) {
  return (
    <div>
      <h3 className="reveal text-xl font-bold">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-6 text-base text-muted-foreground">{empty}</p>
      ) : (
        <ul className="mt-8 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((article) => (
            <li key={article.slug} className="reveal">
              <ArticleCard article={article} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
