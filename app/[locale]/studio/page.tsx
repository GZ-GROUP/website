import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusPill } from "@/components/studio/status-pill";
import { createArticleAction } from "@/app/[locale]/studio/actions";
import { requireStudio } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Studio");
  return { title: t("metaTitle") };
}

export default async function StudioPage() {
  const session = await requireStudio();
  const t = await getTranslations("Studio");
  const tc = await getTranslations("Categories");
  const format = await getFormatter();

  const articles = await prisma.article.findMany({
    where: { OR: [{ authorId: session.user.id }, { coAuthors: { some: { userId: session.user.id } } }] },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      authorId: true,
      updatedAt: true,
      category: { select: { slug: true } },
    },
  });

  return (
    <Container size="wide">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold leading-display tracking-display">{t("title")}</h1>
        <form action={createArticleAction}>
          <Button type="submit">
            <Plus data-icon="inline-start" aria-hidden />
            {t("newArticle")}
          </Button>
        </form>
      </div>

      {articles.length === 0 ? (
        <EmptyState className="mt-10" as="p" title={t("empty")} />
      ) : (
        <table className="mt-10 w-full table-fixed border-collapse text-left">
          <thead>
            <tr className="text-sm text-muted-foreground">
              <th scope="col" className="py-3 pr-4 font-normal">{t("columns.article")}</th>
              <th scope="col" className="w-32 py-3 pr-4 font-normal md:w-40">{t("columns.status")}</th>
              <th scope="col" className="hidden w-28 py-3 pr-4 font-normal md:table-cell">{t("columns.role")}</th>
              <th scope="col" className="hidden w-36 py-3 text-right font-normal sm:table-cell">{t("columns.updated")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {articles.map((article) => (
              <tr key={article.id}>
                <td className="py-4 pr-4">
                  <div className="flex min-w-0 flex-col">
                    <Link
                      href={`/studio/${article.id}`}
                      className={`truncate font-bold hover:text-primary-ink ${article.title ? "" : "text-muted-foreground"}`}
                    >
                      {article.title || t("untitled")}
                    </Link>
                    <span className="truncate text-sm text-muted-foreground">
                      {tc(`${article.category.slug}.title` as "software.title")}
                    </span>
                  </div>
                </td>
                <td className="py-4 pr-4">
                  <StatusPill status={article.status} />
                </td>
                <td className="hidden py-4 pr-4 text-muted-foreground md:table-cell">
                  {article.authorId === session.user.id ? t("roleAuthor") : t("roleCoAuthor")}
                </td>
                <td className="hidden py-4 text-right text-muted-foreground tabular-nums sm:table-cell">
                  {format.dateTime(article.updatedAt, { dateStyle: "medium" })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Container>
  );
}
