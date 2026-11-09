"use server";

import { getSession } from "@/lib/auth/session";
import {
  addComment,
  deleteComment,
  recordRead,
  setLike,
  type CommunityResult,
  type LikeResult,
} from "@/lib/community/mutations";

// Thin server actions: authenticate here, then delegate to
// lib/community/mutations.ts, which re-checks against the stored data.

/** Users confined to the forced password change cannot take part yet. */
async function getActor() {
  const session = await getSession();
  return session && !session.user.mustChangePassword ? session.user : null;
}

export async function addCommentAction(articleId: string, body: string, parentId: string | null): Promise<CommunityResult> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "UNAUTHORIZED" };
  return addComment(actor, articleId, { body, parentId });
}

export async function deleteCommentAction(id: string): Promise<CommunityResult> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "UNAUTHORIZED" };
  return deleteComment(actor, id);
}

export async function setLikeAction(articleId: string, liked: boolean): Promise<LikeResult> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "UNAUTHORIZED" };
  return setLike(actor, articleId, liked);
}

export async function recordReadAction(articleId: string): Promise<void> {
  const actor = await getActor();
  if (actor) await recordRead(actor, articleId);
}
