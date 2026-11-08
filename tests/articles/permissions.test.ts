import { describe, expect, it } from "vitest";
import {
  canArchive,
  canDelete,
  canEdit,
  canManageCoAuthors,
  canPublish,
  canRestore,
  canUnpublish,
  canUseStudio,
  type ArticleAccess,
} from "@/lib/articles/permissions";

const author = { id: "author", role: "writer" };
const coAuthor = { id: "co", role: "writer" };
const otherWriter = { id: "other", role: "writer" };
const admin = { id: "admin", role: "admin" };
const reader = { id: "reader", role: "reader" };

const article = (status: ArticleAccess["status"], publishedAt: Date | null = null): ArticleAccess => ({
  authorId: "author",
  coAuthorIds: ["co"],
  status,
  publishedAt,
});

describe("editorial permissions", () => {
  it("only writers and admins have a studio", () => {
    expect(canUseStudio(author)).toBe(true);
    expect(canUseStudio(admin)).toBe(true);
    expect(canUseStudio(reader)).toBe(false);
    expect(canUseStudio({ role: null })).toBe(false);
  });

  it("author and co-authors edit; other writers and readers don't", () => {
    const draft = article("DRAFT");
    expect(canEdit(author, draft)).toBe(true);
    expect(canEdit(coAuthor, draft)).toBe(true);
    expect(canEdit(otherWriter, draft)).toBe(false);
    expect(canEdit({ ...reader, id: "co" }, draft)).toBe(false); // demoted co-author
  });

  it("archived articles are read-only until restored", () => {
    expect(canEdit(author, article("ARCHIVED"))).toBe(false);
    expect(canRestore(author, article("ARCHIVED"))).toBe(true);
    expect(canRestore(coAuthor, article("ARCHIVED"))).toBe(false);
  });

  it("only the author publishes, unpublishes and manages co-authors", () => {
    expect(canPublish(author, article("DRAFT"))).toBe(true);
    expect(canPublish(coAuthor, article("DRAFT"))).toBe(false);
    expect(canPublish(admin, article("DRAFT"))).toBe(false);
    expect(canUnpublish(author, article("PUBLISHED"))).toBe(true);
    expect(canUnpublish(coAuthor, article("PUBLISHED"))).toBe(false);
    expect(canManageCoAuthors(author, article("DRAFT"))).toBe(true);
    expect(canManageCoAuthors(coAuthor, article("DRAFT"))).toBe(false);
  });

  it("admins can archive any article for moderation", () => {
    expect(canArchive(admin, article("PUBLISHED"))).toBe(true);
    expect(canArchive(otherWriter, article("PUBLISHED"))).toBe(false);
    expect(canArchive(author, article("PUBLISHED"))).toBe(true);
  });

  it("only never-published drafts can be deleted", () => {
    expect(canDelete(author, article("DRAFT"))).toBe(true);
    expect(canDelete(author, article("DRAFT", new Date()))).toBe(false);
    expect(canDelete(author, article("PUBLISHED", new Date()))).toBe(false);
    expect(canDelete(coAuthor, article("DRAFT"))).toBe(false);
  });
});
