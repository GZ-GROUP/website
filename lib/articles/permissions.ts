// Editorial permissions as pure functions: unit-tested, and called by every
// server action and route before any write. The UI only uses them to hide
// controls; the server re-checks on each call.

export type ArticleStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type Actor = { id: string; role?: string | null };

export type ArticleAccess = {
  authorId: string;
  coAuthorIds: string[];
  status: ArticleStatus;
  publishedAt: Date | null;
};

function roles(actor: { role?: string | null }): string[] {
  return (actor.role ?? "").split(",").map((r) => r.trim());
}

export function isAdmin(actor: { role?: string | null }): boolean {
  return roles(actor).includes("admin");
}

/** Writers and admins have a studio. Readers never learn it exists. */
export function canUseStudio(actor: { role?: string | null }): boolean {
  const r = roles(actor);
  return r.includes("writer") || r.includes("admin");
}

/** Only writers (or admins) can be listed as co-authors. */
export const canBeCoAuthor = canUseStudio;

const isAuthor = (actor: Actor, article: ArticleAccess) => article.authorId === actor.id;
const isContributor = (actor: Actor, article: ArticleAccess) =>
  isAuthor(actor, article) || article.coAuthorIds.includes(actor.id);

/** Author and co-authors edit content while the article is not archived. */
export function canEdit(actor: Actor, article: ArticleAccess): boolean {
  return canUseStudio(actor) && isContributor(actor, article) && article.status !== "ARCHIVED";
}

export function canView(actor: Actor, article: ArticleAccess): boolean {
  return canUseStudio(actor) && (isContributor(actor, article) || isAdmin(actor));
}

/** Only the author changes the co-author list. */
export function canManageCoAuthors(actor: Actor, article: ArticleAccess): boolean {
  return canEdit(actor, article) && isAuthor(actor, article);
}

export function canPublish(actor: Actor, article: ArticleAccess): boolean {
  return canUseStudio(actor) && isAuthor(actor, article) && article.status === "DRAFT";
}

export function canUnpublish(actor: Actor, article: ArticleAccess): boolean {
  return canUseStudio(actor) && isAuthor(actor, article) && article.status === "PUBLISHED";
}

/** The author, or any admin (content moderation), can archive. */
export function canArchive(actor: Actor, article: ArticleAccess): boolean {
  return canUseStudio(actor) && (isAuthor(actor, article) || isAdmin(actor)) && article.status !== "ARCHIVED";
}

/** Restoring returns an archived article to draft. */
export function canRestore(actor: Actor, article: ArticleAccess): boolean {
  return canUseStudio(actor) && (isAuthor(actor, article) || isAdmin(actor)) && article.status === "ARCHIVED";
}

/** Only never-published drafts can be deleted; published work is archived instead. */
export function canDelete(actor: Actor, article: ArticleAccess): boolean {
  return canUseStudio(actor) && isAuthor(actor, article) && article.status === "DRAFT" && article.publishedAt === null;
}
