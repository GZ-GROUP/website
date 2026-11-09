import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/layout/container";
import { EmptyState } from "@/components/shared/empty-state";
import { DeleteComment } from "@/components/community/delete-comment";
import { listCommentsForModeration } from "@/lib/community/queries";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("AdminComments");
  return { title: t("metaTitle") };
}

// Authorization: the admin layout (requireAdmin) and deleteComment's own check.
export default async function AdminCommentsPage() {
  const t = await getTranslations("AdminComments");
  const format = await getFormatter();
  const { total, rows } = await listCommentsForModeration();

  return (
    <Container size="wide">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="text-2xl font-bold leading-display tracking-display">{t("title")}</h1>
        <p className="text-base text-muted-foreground tabular-nums">{t("total", { count: total })}</p>
      </div>

      {rows.length === 0 ? (
        <EmptyState className="mt-10" as="p" title={t("empty")} />
      ) : (
        <table className="mt-10 w-full table-fixed border-collapse text-left">
          <thead>
            <tr className="text-sm text-muted-foreground">
              <th scope="col" className="py-3 pr-4 font-normal">{t("columns.comment")}</th>
              <th scope="col" className="hidden w-44 py-3 pr-4 font-normal md:table-cell">{t("columns.author")}</th>
              <th scope="col" className="hidden w-64 py-3 pr-4 font-normal lg:table-cell">{t("columns.article")}</th>
              <th scope="col" className="hidden w-32 py-3 pr-4 text-right font-normal lg:table-cell">{t("columns.date")}</th>
              <th scope="col" className="w-40 py-3 text-right font-normal">
                <span className="sr-only">{t("columns.actions")}</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={row.id} className="align-top">
                <td className="py-4 pr-4">
                  <p className="line-clamp-3 wrap-anywhere">{row.body}</p>
                  <p className="mt-1 truncate text-sm text-muted-foreground md:hidden">{row.author.name}</p>
                </td>
                <td className="hidden truncate py-4 pr-4 text-muted-foreground md:table-cell">
                  {row.author.username ? (
                    <Link href={`/u/${row.author.username}`} className="hover:text-primary-ink">
                      {row.author.name}
                    </Link>
                  ) : (
                    row.author.name
                  )}
                </td>
                <td className="hidden truncate py-4 pr-4 lg:table-cell">
                  {row.article.status === "PUBLISHED" ? (
                    <Link href={`/blog/${row.article.slug}#comment-${row.id}`} className="hover:text-primary-ink">
                      {row.article.title}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">{row.article.title}</span>
                  )}
                </td>
                <td className="hidden py-4 pr-4 text-right text-muted-foreground tabular-nums lg:table-cell">
                  {format.dateTime(row.createdAt, { dateStyle: "medium" })}
                </td>
                <td className="py-3">
                  <div className="flex justify-end">
                    <DeleteComment id={row.id} authorName={row.author.name} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Container>
  );
}
