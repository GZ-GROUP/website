import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { JSONContent } from "@tiptap/core";
import { getTranslations } from "next-intl/server";
import { Container } from "@/components/layout/container";
import { ArticleEditor } from "@/components/editor/article-editor";
import { requireStudio } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import type { CategorySlug } from "@/lib/articles/limits";
import {
  canArchive,
  canDelete,
  canEdit,
  canManageCoAuthors,
  canPublish,
  canRestore,
  canUnpublish,
  canView,
  type ArticleAccess,
} from "@/lib/articles/permissions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Editor");
  return { title: t("metaTitle") };
}

export default async function EditArticlePage({ params }: PageProps<"/[locale]/studio/[id]">) {
  const { id } = await params;
  const session = await requireStudio();

  const article = await prisma.article.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      status: true,
      publishedAt: true,
      authorId: true,
      title: true,
      excerpt: true,
      content: true,
      language: true,
      coverImageKey: true,
      coverAlt: true,
      repositoryUrl: true,
      externalUrl: true,
      category: { select: { slug: true } },
      tags: { select: { tag: { select: { name: true } } } },
      coAuthors: { orderBy: { position: "asc" }, select: { user: { select: { id: true, username: true, name: true } } } },
    },
  });
  if (!article) notFound();

  const access: ArticleAccess = {
    authorId: article.authorId,
    coAuthorIds: article.coAuthors.map((c) => c.user.id),
    status: article.status,
    publishedAt: article.publishedAt,
  };
  const actor = session.user;
  if (!canView(actor, access)) notFound();

  return (
    <Container size="wide">
      <ArticleEditor
        // A new key after each server refresh of status keeps permissions in sync.
        key={`${article.id}-${article.status}`}
        article={{
          id: article.id,
          slug: article.slug,
          status: article.status,
          title: article.title,
          excerpt: article.excerpt,
          content: article.content as JSONContent,
          category: article.category.slug as CategorySlug,
          language: article.language,
          tags: article.tags.map((t) => t.tag.name),
          coverImageKey: article.coverImageKey,
          coverAlt: article.coverAlt ?? "",
          repositoryUrl: article.repositoryUrl ?? "",
          externalUrl: article.externalUrl ?? "",
          coAuthors: article.coAuthors.map((c) => ({ username: c.user.username ?? "", name: c.user.name })),
        }}
        can={{
          edit: canEdit(actor, access),
          manageCoAuthors: canManageCoAuthors(actor, access),
          publish: canPublish(actor, access),
          unpublish: canUnpublish(actor, access),
          archive: canArchive(actor, access),
          restore: canRestore(actor, access),
          delete: canDelete(actor, access),
        }}
      />
    </Container>
  );
}
