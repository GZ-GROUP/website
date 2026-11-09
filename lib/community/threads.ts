import type { AuthorSummary } from "@/lib/content/types";

// Pure read-model and deletion rules for comment threads (unit-tested).

export type CommentRow = {
  id: string;
  parentId: string | null;
  authorId: string;
  body: string;
  createdAt: Date;
  deletedAt: Date | null;
  authorBanned: boolean;
  author: AuthorSummary;
};

export type VisibleComment = {
  removed: false;
  id: string;
  authorId: string;
  body: string;
  createdAt: Date;
  author: AuthorSummary;
  /** Just posted: the only comments that animate in. */
  fresh: boolean;
};

export type RemovedComment = { removed: true; id: string };

export type CommentThread = (VisibleComment | RemovedComment) & { replies: VisibleComment[] };

const FRESH_MS = 10_000;

const isHidden = (row: CommentRow) => row.deletedAt !== null || row.authorBanned;

function toVisible(row: CommentRow, now: number): VisibleComment {
  return {
    removed: false,
    id: row.id,
    authorId: row.authorId,
    body: row.body,
    createdAt: row.createdAt,
    author: row.author,
    fresh: now - row.createdAt.getTime() < FRESH_MS,
  };
}

/**
 * Builds the one-level tree, preserving the order of `parents` and `replies`.
 * A hidden comment with visible replies becomes a tombstone that shows neither
 * author nor text; one without replies disappears. Hiding is computed here, so
 * lifting a ban brings that user's comments back.
 */
export function buildThreads(parents: CommentRow[], replies: CommentRow[], now: number): CommentThread[] {
  const repliesByParent = new Map<string, VisibleComment[]>();
  for (const reply of replies) {
    if (!reply.parentId || isHidden(reply)) continue;
    const siblings = repliesByParent.get(reply.parentId) ?? [];
    siblings.push(toVisible(reply, now));
    repliesByParent.set(reply.parentId, siblings);
  }

  return parents.flatMap((parent): CommentThread[] => {
    const threadReplies = repliesByParent.get(parent.id) ?? [];
    if (!isHidden(parent)) return [{ ...toVisible(parent, now), replies: threadReplies }];
    return threadReplies.length > 0 ? [{ removed: true, id: parent.id, replies: threadReplies }] : [];
  });
}

export type DeletionPlan = "DELETE" | "TOMBSTONE" | "DELETE_WITH_PARENT";

/**
 * - With replies: keep a tombstone so the conversation still reads.
 * - The last reply of a tombstoned parent: remove both, nothing is left to show.
 * - Otherwise: delete for real.
 */
export function deletionPlan(comment: {
  replyCount: number;
  parent: { deleted: boolean; otherReplies: number } | null;
}): DeletionPlan {
  if (comment.replyCount > 0) return "TOMBSTONE";
  if (comment.parent?.deleted && comment.parent.otherReplies === 0) return "DELETE_WITH_PARENT";
  return "DELETE";
}
