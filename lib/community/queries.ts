import type { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/db";
import { authorSelect, toAuthorSummary } from "@/lib/articles/queries";
import { buildThreads, type CommentRow, type CommentThread } from "@/lib/community/threads";
import type { AuthorSummary } from "@/lib/content/types";

// Read models for community features. Every count applies the same filter as
// the list next to it (published articles, comments not removed), so the
// numbers people see always match what they can open.

export const COMMENTS_PAGE_SIZE = 50;
const MAX_COMMENT_PAGES = 10;

const liveComment = {
  deletedAt: null,
  author: { banned: false },
  article: { status: "PUBLISHED" },
} satisfies Prisma.CommentWhereInput;

const commentSelect = {
  id: true,
  parentId: true,
  authorId: true,
  body: true,
  createdAt: true,
  deletedAt: true,
  author: { select: { ...authorSelect, banned: true } },
} satisfies Prisma.CommentSelect;

function toRow(row: Prisma.CommentGetPayload<{ select: typeof commentSelect }>): CommentRow {
  return {
    id: row.id,
    parentId: row.parentId,
    authorId: row.authorId,
    body: row.body,
    createdAt: row.createdAt,
    deletedAt: row.deletedAt,
    authorBanned: row.author.banned,
    author: toAuthorSummary(row.author),
  };
}

export type ArticleComments = { threads: CommentThread[]; total: number; page: number; hasMore: boolean };

/** Newest conversations first; replies read oldest first, like a conversation. */
export async function getArticleComments(articleId: string, requestedPage: number): Promise<ArticleComments> {
  const page = Math.min(Math.max(1, requestedPage), MAX_COMMENT_PAGES);
  const take = page * COMMENTS_PAGE_SIZE;
  const [parents, topLevelTotal, total] = await Promise.all([
    prisma.comment.findMany({
      where: { articleId, parentId: null },
      orderBy: { createdAt: "desc" },
      take,
      select: commentSelect,
    }),
    prisma.comment.count({ where: { articleId, parentId: null } }),
    prisma.comment.count({ where: { articleId, ...liveComment } }),
  ]);
  const replies = await prisma.comment.findMany({
    where: { parentId: { in: parents.map((p) => p.id) } },
    orderBy: { createdAt: "asc" },
    select: commentSelect,
  });
  const threads = buildThreads(parents.map(toRow), replies.map(toRow), Date.now());
  return { threads, total, page, hasMore: topLevelTotal > take && page < MAX_COMMENT_PAGES };
}

export async function getLikeState(articleId: string, userId: string | null): Promise<{ count: number; liked: boolean }> {
  const [count, mine] = await Promise.all([
    prisma.articleLike.count({ where: { articleId } }),
    userId
      ? prisma.articleLike.findUnique({ where: { articleId_userId: { articleId, userId } }, select: { userId: true } })
      : null,
  ]);
  return { count, liked: mine !== null };
}

const articleRefSelect = { slug: true, title: true } satisfies Prisma.ArticleSelect;
const published = { status: "PUBLISHED" } satisfies Prisma.ArticleWhereInput;

export type ActivityArticle = { slug: string; title: string; at: Date };
export type ActivityComment = { id: string; body: string; at: Date; article: { slug: string; title: string } };

const activityCommentSelect = {
  id: true,
  body: true,
  createdAt: true,
  article: { select: articleRefSelect },
} satisfies Prisma.CommentSelect;

function toActivityComment(row: Prisma.CommentGetPayload<{ select: typeof activityCommentSelect }>): ActivityComment {
  return { id: row.id, body: row.body, at: row.createdAt, article: row.article };
}

const ACTIVITY_SIZE = 6;

/** Reader dashboard: every number comes from a stored fact about this user. */
export async function getDashboard(userId: string) {
  const readWhere = { userId, article: published };
  const likeWhere = { userId, article: published };
  const commentWhere = { authorId: userId, deletedAt: null, article: published };

  const [reads, likes, comments, recentReads, recentLikes, recentComments] = await Promise.all([
    prisma.articleRead.count({ where: readWhere }),
    prisma.articleLike.count({ where: likeWhere }),
    prisma.comment.count({ where: commentWhere }),
    prisma.articleRead.findMany({
      where: readWhere,
      orderBy: { lastReadAt: "desc" },
      take: ACTIVITY_SIZE,
      select: { lastReadAt: true, article: { select: articleRefSelect } },
    }),
    prisma.articleLike.findMany({
      where: likeWhere,
      orderBy: { createdAt: "desc" },
      take: ACTIVITY_SIZE,
      select: { createdAt: true, article: { select: articleRefSelect } },
    }),
    prisma.comment.findMany({
      where: commentWhere,
      orderBy: { createdAt: "desc" },
      take: ACTIVITY_SIZE,
      select: activityCommentSelect,
    }),
  ]);

  return {
    metrics: { reads, likes, comments },
    recentReads: recentReads.map((r): ActivityArticle => ({ ...r.article, at: r.lastReadAt })),
    recentLikes: recentLikes.map((l): ActivityArticle => ({ ...l.article, at: l.createdAt })),
    recentComments: recentComments.map(toActivityComment),
  };
}

/** Public profile numbers. Reading history and likes given are never exposed. */
export async function getProfileCommunity(userId: string) {
  const commentWhere = { authorId: userId, ...liveComment };
  const [likesReceived, comments, recentComments] = await Promise.all([
    prisma.articleLike.count({
      where: { article: { ...published, OR: [{ authorId: userId }, { coAuthors: { some: { userId } } }] } },
    }),
    prisma.comment.count({ where: commentWhere }),
    prisma.comment.findMany({
      where: commentWhere,
      orderBy: { createdAt: "desc" },
      take: 5,
      select: activityCommentSelect,
    }),
  ]);
  return { likesReceived, comments, recentComments: recentComments.map(toActivityComment) };
}

export type TeamMember = AuthorSummary & { bio: string | null; occupation: string | null; publications: number };

/** Anyone credited on published work, as author or co-author. */
export async function getTeamMembers(): Promise<TeamMember[]> {
  const users = await prisma.user.findMany({
    where: {
      banned: false,
      OR: [{ articles: { some: published } }, { coAuthorships: { some: { article: published } } }],
    },
    orderBy: { createdAt: "asc" },
    take: 200,
    select: {
      ...authorSelect,
      profile: { select: { bio: true, occupation: true } },
      _count: {
        select: { articles: { where: published }, coAuthorships: { where: { article: published } } },
      },
    },
  });
  return users.map((user) => ({
    ...toAuthorSummary(user),
    bio: user.profile?.bio ?? null,
    occupation: user.profile?.occupation ?? null,
    publications: user._count.articles + user._count.coAuthorships,
  }));
}

/** Moderation list: newest first, removed comments excluded. */
export async function listCommentsForModeration(take = 200) {
  const where = { deletedAt: null } satisfies Prisma.CommentWhereInput;
  const [total, rows] = await Promise.all([
    prisma.comment.count({ where }),
    prisma.comment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      select: {
        id: true,
        body: true,
        createdAt: true,
        author: { select: { name: true, username: true } },
        article: { select: { slug: true, title: true, status: true } },
      },
    }),
  ]);
  return { total, rows };
}
