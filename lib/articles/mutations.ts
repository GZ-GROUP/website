import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/db";
import { contentMediaSources, EMPTY_DOCUMENT, validateContent, type ContentError } from "@/lib/editor/content";
import { mediaKeyFromUrl } from "@/lib/editor/links";
import { normalizeTag, uniqueSlug } from "@/lib/articles/slug";
import { articleMetaSchema, publishProblems } from "@/lib/articles/validation";
import {
  canArchive,
  canBeCoAuthor,
  canDelete,
  canEdit,
  canManageCoAuthors,
  canPublish,
  canRestore,
  canUnpublish,
  canUseStudio,
  type Actor,
  type ArticleAccess,
} from "@/lib/articles/permissions";

// Every editorial write goes through here. Callers pass the signed-in actor;
// each function re-checks permissions against the stored article.

export type MutationError =
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "INVALID_FIELDS"
  | "INVALID_IMAGE"
  | "INVALID_CO_AUTHOR"
  | "NOT_READY"
  | ContentError;

export type MutationResult =
  | { ok: true; slug?: string }
  | { ok: false; error: MutationError; fieldErrors?: Record<string, string>; problems?: string[] };

const accessSelect = {
  id: true,
  slug: true,
  status: true,
  publishedAt: true,
  authorId: true,
  title: true,
  excerpt: true,
  contentText: true,
  coverImageKey: true,
  coverAlt: true,
  coAuthors: { select: { userId: true } },
} satisfies Prisma.ArticleSelect;

async function load(id: string) {
  const row = await prisma.article.findUnique({ where: { id }, select: accessSelect });
  if (!row) return null;
  const access: ArticleAccess = {
    authorId: row.authorId,
    coAuthorIds: row.coAuthors.map((c) => c.userId),
    status: row.status,
    publishedAt: row.publishedAt,
  };
  return { row, access };
}

/** Public pages (landing, blog, projects, article, profiles) are ISR: refresh them. */
function revalidatePublicPages() {
  revalidatePath("/", "layout");
}

export async function createDraft(actor: Actor): Promise<{ id: string } | null> {
  if (!canUseStudio(actor)) return null;
  const category = await prisma.category.findFirstOrThrow({ orderBy: { position: "asc" }, select: { id: true } });
  return prisma.article.create({
    data: {
      slug: `draft-${randomUUID()}`,
      title: "",
      content: EMPTY_DOCUMENT as Prisma.InputJsonValue,
      authorId: actor.id,
      categoryId: category.id,
    },
    select: { id: true },
  });
}

export type SavePayload = { meta: unknown; content: unknown };

export async function saveArticle(actor: Actor, id: string, payload: SavePayload): Promise<MutationResult> {
  const loaded = await load(id);
  if (!loaded) return { ok: false, error: "NOT_FOUND" };
  if (!canEdit(actor, loaded.access)) return { ok: false, error: "FORBIDDEN" };

  const meta = articleMetaSchema.safeParse(payload.meta);
  if (!meta.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of meta.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return { ok: false, error: "INVALID_FIELDS", fieldErrors };
  }
  const content = validateContent(payload.content);
  if (!content.ok) return { ok: false, error: content.error };
  const m = meta.data;

  // Every image (cover and inline) must be a file uploaded to our media store.
  const keys = new Set(
    [m.coverImageKey, ...contentMediaSources(content.doc).map(mediaKeyFromUrl)].filter((k): k is string => Boolean(k)),
  );
  if (keys.size && (await prisma.media.count({ where: { key: { in: [...keys] } } })) !== keys.size) {
    return { ok: false, error: "INVALID_IMAGE" };
  }

  const category = await prisma.category.findUniqueOrThrow({ where: { slug: m.category }, select: { id: true } });

  const tags = [...new Map(m.tags.map(normalizeTag).filter((t) => t !== null).map((t) => [t.slug, t])).values()];

  // Only the author edits the co-author list; co-authors' saves leave it untouched.
  let coAuthorIds: string[] | undefined;
  if (canManageCoAuthors(actor, loaded.access)) {
    const usernames = [...new Set(m.coAuthors)].filter(Boolean);
    const users = usernames.length
      ? await prisma.user.findMany({
          where: { username: { in: usernames }, banned: false },
          select: { id: true, username: true, role: true },
        })
      : [];
    const valid = users.filter((u) => canBeCoAuthor(u) && u.id !== loaded.row.authorId);
    if (valid.length !== usernames.length) return { ok: false, error: "INVALID_CO_AUTHOR" };
    coAuthorIds = usernames.map((name) => valid.find((u) => u.username === name)!.id);
  }

  await prisma.$transaction(async (tx) => {
    const tagRows = await Promise.all(
      tags.map((t) =>
        tx.tag.upsert({ where: { slug: t.slug }, create: { slug: t.slug, name: t.name }, update: {}, select: { id: true } }),
      ),
    );
    await tx.article.update({
      where: { id },
      data: {
        title: m.title,
        excerpt: m.excerpt,
        content: content.doc as Prisma.InputJsonValue,
        contentText: content.text,
        readingMinutes: content.readingMinutes,
        language: m.language,
        categoryId: category.id,
        coverImageKey: m.coverImageKey,
        coverAlt: m.coverAlt || null,
        repositoryUrl: m.repositoryUrl,
        externalUrl: m.externalUrl,
        tags: { deleteMany: {}, create: tagRows.map((t) => ({ tagId: t.id })) },
        ...(coAuthorIds
          ? { coAuthors: { deleteMany: {}, create: coAuthorIds.map((userId, position) => ({ userId, position })) } }
          : {}),
      },
    });
  });

  if (loaded.row.status === "PUBLISHED") revalidatePublicPages();
  return { ok: true };
}

export async function publishArticle(actor: Actor, id: string): Promise<MutationResult> {
  const loaded = await load(id);
  if (!loaded) return { ok: false, error: "NOT_FOUND" };
  if (!canPublish(actor, loaded.access)) return { ok: false, error: "FORBIDDEN" };

  const problems = publishProblems(loaded.row);
  if (problems.length) return { ok: false, error: "NOT_READY", problems };

  // The slug is derived on first publication and frozen afterwards (stable links).
  const slug = loaded.row.publishedAt
    ? loaded.row.slug
    : await uniqueSlug(loaded.row.title, async (candidate) =>
        Boolean(await prisma.article.findFirst({ where: { slug: candidate, NOT: { id } }, select: { id: true } })),
      );

  await prisma.article.update({
    where: { id },
    data: { status: "PUBLISHED", slug, publishedAt: loaded.row.publishedAt ?? new Date() },
  });
  revalidatePublicPages();
  return { ok: true, slug };
}

async function transition(
  actor: Actor,
  id: string,
  allowed: (actor: Actor, access: ArticleAccess) => boolean,
  status: "DRAFT" | "ARCHIVED",
): Promise<MutationResult> {
  const loaded = await load(id);
  if (!loaded) return { ok: false, error: "NOT_FOUND" };
  if (!allowed(actor, loaded.access)) return { ok: false, error: "FORBIDDEN" };
  await prisma.article.update({ where: { id }, data: { status } });
  if (loaded.row.status === "PUBLISHED" || status === "ARCHIVED") revalidatePublicPages();
  return { ok: true };
}

export const unpublishArticle = (actor: Actor, id: string) => transition(actor, id, canUnpublish, "DRAFT");
export const archiveArticle = (actor: Actor, id: string) => transition(actor, id, canArchive, "ARCHIVED");
export const restoreArticle = (actor: Actor, id: string) => transition(actor, id, canRestore, "DRAFT");

export async function deleteArticle(actor: Actor, id: string): Promise<MutationResult> {
  const loaded = await load(id);
  if (!loaded) return { ok: false, error: "NOT_FOUND" };
  if (!canDelete(actor, loaded.access)) return { ok: false, error: "FORBIDDEN" };
  await prisma.article.delete({ where: { id } });
  return { ok: true };
}
