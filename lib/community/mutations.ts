import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { canComment, canDeleteComment, canLike, type CommunityActor } from "@/lib/community/permissions";
import { deletionPlan } from "@/lib/community/threads";
import { COMMENT_RATE_MAX, COMMENT_RATE_WINDOW_MS, commentBodySchema } from "@/lib/community/validation";

// Every community write goes through here. Callers pass the signed-in actor;
// each function re-checks permissions against what is stored.

export type CommunityError = "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "INVALID_BODY" | "INVALID_PARENT" | "RATE_LIMITED";

export type CommunityResult = { ok: true } | { ok: false; error: CommunityError };
export type LikeResult = { ok: true; liked: boolean; count: number } | { ok: false; error: CommunityError };

/** Only the article page changes: other public pages keep their ISR cache. */
function revalidateArticlePage() {
  revalidatePath("/[locale]/blog/[slug]", "page");
}

const loadArticle = (id: string) => prisma.article.findUnique({ where: { id }, select: { id: true, status: true } });

export async function addComment(
  actor: CommunityActor,
  articleId: string,
  input: { body: unknown; parentId: string | null },
): Promise<CommunityResult> {
  const article = await loadArticle(articleId);
  if (!article) return { ok: false, error: "NOT_FOUND" };
  if (!canComment(actor, article.status)) return { ok: false, error: "FORBIDDEN" };

  const body = commentBodySchema.safeParse(input.body);
  if (!body.success) return { ok: false, error: "INVALID_BODY" };

  // One level only: the parent must be a live top-level comment of this article.
  if (input.parentId) {
    const parent = await prisma.comment.findUnique({
      where: { id: input.parentId },
      select: { articleId: true, parentId: true, deletedAt: true },
    });
    if (!parent || parent.articleId !== articleId || parent.parentId !== null || parent.deletedAt !== null) {
      return { ok: false, error: "INVALID_PARENT" };
    }
  }

  const recent = await prisma.comment.count({
    where: { authorId: actor.id, createdAt: { gte: new Date(Date.now() - COMMENT_RATE_WINDOW_MS) } },
  });
  if (recent >= COMMENT_RATE_MAX) return { ok: false, error: "RATE_LIMITED" };

  await prisma.comment.create({ data: { articleId, authorId: actor.id, parentId: input.parentId, body: body.data } });
  revalidateArticlePage();
  return { ok: true };
}

export async function deleteComment(actor: CommunityActor, id: string): Promise<CommunityResult> {
  const result = await prisma.$transaction(async (tx): Promise<CommunityResult> => {
    const comment = await tx.comment.findUnique({
      where: { id },
      select: {
        authorId: true,
        deletedAt: true,
        parentId: true,
        parent: { select: { deletedAt: true } },
        _count: { select: { replies: true } },
      },
    });
    if (!comment || comment.deletedAt) return { ok: false, error: "NOT_FOUND" };
    if (!canDeleteComment(actor, comment)) return { ok: false, error: "FORBIDDEN" };

    const otherReplies = comment.parentId
      ? await tx.comment.count({ where: { parentId: comment.parentId, NOT: { id } } })
      : 0;
    const plan = deletionPlan({
      replyCount: comment._count.replies,
      parent: comment.parent ? { deleted: comment.parent.deletedAt !== null, otherReplies } : null,
    });

    if (plan === "TOMBSTONE") {
      await tx.comment.update({ where: { id }, data: { deletedAt: new Date(), body: "" } });
    } else if (plan === "DELETE_WITH_PARENT" && comment.parentId) {
      // Replies cascade from the parent.
      await tx.comment.delete({ where: { id: comment.parentId } });
    } else {
      await tx.comment.delete({ where: { id } });
    }
    return { ok: true };
  });

  if (result.ok) {
    revalidateArticlePage();
    revalidatePath("/[locale]/admin/comments", "page");
  }
  return result;
}

/** Sets the like to the requested state, so repeated clicks cannot desynchronise it. */
export async function setLike(actor: CommunityActor, articleId: string, liked: boolean): Promise<LikeResult> {
  const article = await loadArticle(articleId);
  if (!article) return { ok: false, error: "NOT_FOUND" };
  if (!canLike(actor, article.status)) return { ok: false, error: "FORBIDDEN" };

  if (liked) {
    await prisma.articleLike.createMany({ data: { articleId, userId: actor.id }, skipDuplicates: true });
  } else {
    await prisma.articleLike.deleteMany({ where: { articleId, userId: actor.id } });
  }
  return { ok: true, liked, count: await prisma.articleLike.count({ where: { articleId } }) };
}

/** Private reading history. Published articles only, so previews never count. */
export async function recordRead(actor: CommunityActor, articleId: string): Promise<void> {
  const article = await loadArticle(articleId);
  if (article?.status !== "PUBLISHED") return;
  const now = new Date();
  await prisma.articleRead.upsert({
    where: { articleId_userId: { articleId, userId: actor.id } },
    create: { articleId, userId: actor.id, firstReadAt: now, lastReadAt: now },
    update: { lastReadAt: now },
  });
}
