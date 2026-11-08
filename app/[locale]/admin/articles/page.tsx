import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/layout/container";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusPill } from "@/components/studio/status-pill";
import { ArticleModeration } from "@/components/admin/article-moderation";
import { prisma } from "@/lib/db";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("AdminArticles");
  return { title: t("metaTitle") };
}

const PAGE_SIZE = 200;

// Every article except never-published drafts (those belong to their authors).
export default async function AdminArticlesPage() {
  const t = await getTranslations("AdminArticles");
  const ts = await getTranslations("Studio");
  const format = await getFormatter();
  const where = { NOT: { status: "DRAFT" as const, publishedAt: null } };

  const [total, articles] = await Promise.all([
    prisma.article.count({ where }),
    prisma.article.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: PAGE_SIZE,
      select: {
        id: true,
        slug: true,
        title: true,
        status: true,
        updatedAt: true,
        author: { select: { name: true, username: true } },
      },
    }),
  ]);

  return (
    <Container size="wide">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="text-2xl font-bold leading-display tracking-display">{t("title")}</h1>
        <p className="text-base text-muted-foreground tabular-nums">{t("total", { count: total })}</p>
      </div>

      {articles.length === 0 ? (
        <EmptyState className="mt-10" as="p" title={t("empty")} />
      ) : (
        <table className="mt-10 w-full table-fixed border-collapse text-left">
          <thead>
            <tr className="text-sm text-muted-foreground">
              <th scope="col" className="py-3 pr-4 font-normal">{t("columns.article")}</th>
              <th scope="col" className="hidden w-48 py-3 pr-4 font-normal md:table-cell">{t("columns.author")}</th>
              <th scope="col" className="w-32 py-3 pr-4 font-normal">{t("columns.status")}</th>
              <th scope="col" className="hidden w-32 py-3 pr-4 text-right font-normal lg:table-cell">{t("columns.updated")}</th>
              <th scope="col" className="w-32 py-3 text-right font-normal">
                <span className="sr-only">{t("archive")}</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {articles.map((article) => (
              <tr key={article.id}>
                <td className="py-4 pr-4">
                  <div className="flex min-w-0 flex-col">
                    {article.status === "PUBLISHED" ? (
                      <Link href={`/blog/${article.slug}`} className="truncate font-bold hover:text-primary-ink">
                        {article.title || ts("untitled")}
                      </Link>
                    ) : (
                      <span className="truncate font-bold">{article.title || ts("untitled")}</span>
                    )}
                    <span className="truncate text-sm text-muted-foreground md:hidden">{article.author.name}</span>
                  </div>
                </td>
                <td className="hidden truncate py-4 pr-4 text-muted-foreground md:table-cell">{article.author.name}</td>
                <td className="py-4 pr-4">
                  <StatusPill status={article.status} />
                </td>
                <td className="hidden py-4 pr-4 text-right text-muted-foreground tabular-nums lg:table-cell">
                  {format.dateTime(article.updatedAt, { dateStyle: "medium" })}
                </td>
                <td className="py-4 text-right">
                  {article.status !== "DRAFT" && (
                    <ArticleModeration id={article.id} status={article.status} title={article.title} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Container>
  );
}
