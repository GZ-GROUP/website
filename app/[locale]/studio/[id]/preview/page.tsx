import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/layout/container";
import { ArticleView } from "@/components/article/article-view";
import { requireStudio } from "@/lib/auth/session";
import { canView } from "@/lib/articles/permissions";
import { getArticleForPreview } from "@/lib/articles/queries";
import { prisma } from "@/lib/db";

// Draft preview with the exact public renderer. Contributors and admins only.
export default async function PreviewPage({ params }: PageProps<"/[locale]/studio/[id]/preview">) {
  const { id } = await params;
  const session = await requireStudio();
  const access = await prisma.article.findUnique({
    where: { id },
    select: { authorId: true, status: true, publishedAt: true, coAuthors: { select: { userId: true } } },
  });
  if (
    !access ||
    !canView(session.user, { ...access, coAuthorIds: access.coAuthors.map((c) => c.userId) })
  ) {
    notFound();
  }
  const article = await getArticleForPreview(id);
  if (!article) notFound();
  const t = await getTranslations("ArticlePage");

  return (
    <>
      <Container size="reading" className="mb-12">
        <p role="status" className="flex flex-wrap items-center justify-between gap-3 bg-card px-5 py-4 text-base">
          {t("previewBanner")}
          <Link href={`/studio/${id}`} className="font-bold text-primary-ink underline-offset-4 hover:underline">
            {t("backToEditor")}
          </Link>
        </p>
      </Container>
      <ArticleView article={article} />
    </>
  );
}
