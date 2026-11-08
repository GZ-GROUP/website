"use server";

import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { prisma } from "@/lib/db";
import { requireStudio } from "@/lib/auth/session";
import { canBeCoAuthor } from "@/lib/articles/permissions";
import {
  archiveArticle,
  createDraft,
  deleteArticle,
  publishArticle,
  restoreArticle,
  saveArticle,
  unpublishArticle,
  type MutationResult,
  type SavePayload,
} from "@/lib/articles/mutations";

// Thin server actions: authenticate (requireStudio → 404 for non-writers),
// then delegate to lib/articles/mutations.ts, which re-checks per article.

export async function createArticleAction(): Promise<void> {
  const session = await requireStudio();
  const draft = await createDraft(session.user);
  const locale = await getLocale();
  if (!draft) return redirect({ href: "/studio", locale });
  return redirect({ href: `/studio/${draft.id}`, locale });
}

export async function saveArticleAction(id: string, payload: SavePayload): Promise<MutationResult> {
  const session = await requireStudio();
  return saveArticle(session.user, id, payload);
}

export async function publishArticleAction(id: string): Promise<MutationResult> {
  const session = await requireStudio();
  return publishArticle(session.user, id);
}

export async function unpublishArticleAction(id: string): Promise<MutationResult> {
  const session = await requireStudio();
  return unpublishArticle(session.user, id);
}

export async function archiveArticleAction(id: string): Promise<MutationResult> {
  const session = await requireStudio();
  return archiveArticle(session.user, id);
}

export async function restoreArticleAction(id: string): Promise<MutationResult> {
  const session = await requireStudio();
  return restoreArticle(session.user, id);
}

export async function deleteArticleAction(id: string): Promise<MutationResult> {
  const session = await requireStudio();
  const result = await deleteArticle(session.user, id);
  if (result.ok) return redirect({ href: "/studio", locale: await getLocale() });
  return result;
}

/** Co-author picker: writers whose username starts with the query. */
export async function searchWritersAction(query: string): Promise<{ username: string; name: string }[]> {
  const session = await requireStudio();
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const users = await prisma.user.findMany({
    where: { username: { startsWith: q }, banned: false, NOT: { id: session.user.id } },
    select: { username: true, name: true, role: true },
    take: 20,
    orderBy: { username: "asc" },
  });
  return users
    .filter((u) => u.username && canBeCoAuthor(u))
    .slice(0, 8)
    .map((u) => ({ username: u.username!, name: u.name }));
}
