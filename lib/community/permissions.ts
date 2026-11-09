import { isAdmin, type Actor, type ArticleStatus } from "@/lib/articles/permissions";

// Community permissions as pure functions, called by every mutation against the
// stored article or comment. The UI only uses them to hide controls.

export type CommunityActor = Actor & { banned?: boolean | null };

/** Any signed-in, non-banned user can take part, on published articles only. */
export function canComment(actor: CommunityActor, status: ArticleStatus): boolean {
  return !actor.banned && status === "PUBLISHED";
}

export const canLike = canComment;

/** The comment's author, or any admin (moderation). */
export function canDeleteComment(actor: CommunityActor, comment: { authorId: string }): boolean {
  return !actor.banned && (comment.authorId === actor.id || isAdmin(actor));
}
