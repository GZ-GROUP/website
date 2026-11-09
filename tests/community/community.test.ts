import { describe, expect, it } from "vitest";
import { safeNextPath } from "@/lib/auth/next-path";
import { canComment, canDeleteComment, canLike } from "@/lib/community/permissions";
import { buildThreads, deletionPlan, type CommentRow } from "@/lib/community/threads";
import { MAX_COMMENT_LENGTH } from "@/lib/community/limits";
import { commentBodySchema } from "@/lib/community/validation";

const NOW = Date.UTC(2026, 10, 8, 12);
const reader = { id: "r1", role: "reader" };
const admin = { id: "a1", role: "admin" };

function row(id: string, overrides: Partial<CommentRow> = {}): CommentRow {
  return {
    id,
    parentId: null,
    authorId: "u1",
    body: `body ${id}`,
    createdAt: new Date(NOW - 3_600_000),
    deletedAt: null,
    authorBanned: false,
    author: { username: "ana", displayName: "Ana", avatarUrl: null, verifications: [] },
    ...overrides,
  };
}

describe("community permissions", () => {
  it("lets any signed-in user take part on published articles only", () => {
    expect(canComment(reader, "PUBLISHED")).toBe(true);
    expect(canLike(reader, "PUBLISHED")).toBe(true);
    expect(canComment(reader, "DRAFT")).toBe(false);
    expect(canComment(reader, "ARCHIVED")).toBe(false);
    expect(canLike(admin, "ARCHIVED")).toBe(false);
  });

  it("blocks banned users", () => {
    expect(canComment({ ...reader, banned: true }, "PUBLISHED")).toBe(false);
    expect(canDeleteComment({ ...reader, banned: true }, { authorId: "r1" })).toBe(false);
  });

  it("allows deleting only your own comment, unless admin", () => {
    expect(canDeleteComment(reader, { authorId: "r1" })).toBe(true);
    expect(canDeleteComment(reader, { authorId: "other" })).toBe(false);
    expect(canDeleteComment({ id: "w1", role: "writer" }, { authorId: "other" })).toBe(false);
    expect(canDeleteComment(admin, { authorId: "other" })).toBe(true);
  });
});

describe("comment body", () => {
  it("trims and requires content", () => {
    expect(commentBodySchema.parse("  hola  ")).toBe("hola");
    expect(commentBodySchema.safeParse("   ").success).toBe(false);
  });

  it("enforces the length limit", () => {
    expect(commentBodySchema.safeParse("a".repeat(MAX_COMMENT_LENGTH)).success).toBe(true);
    expect(commentBodySchema.safeParse("a".repeat(MAX_COMMENT_LENGTH + 1)).success).toBe(false);
  });
});

describe("buildThreads", () => {
  it("nests replies under their parent and keeps the given order", () => {
    const threads = buildThreads([row("b"), row("a")], [row("r1", { parentId: "a" }), row("r2", { parentId: "a" })], NOW);
    expect(threads.map((t) => t.id)).toEqual(["b", "a"]);
    expect(threads[1].replies.map((r) => r.id)).toEqual(["r1", "r2"]);
  });

  it("keeps a removed comment with replies as a tombstone without author or text", () => {
    const [thread] = buildThreads(
      [row("a", { deletedAt: new Date(NOW), body: "" })],
      [row("r1", { parentId: "a" })],
      NOW,
    );
    expect(thread).toEqual({ removed: true, id: "a", replies: [expect.objectContaining({ id: "r1" })] });
  });

  it("drops a removed comment with no visible replies", () => {
    expect(buildThreads([row("a", { deletedAt: new Date(NOW) })], [], NOW)).toEqual([]);
  });

  it("hides a banned author's comments, which come back if the ban is lifted", () => {
    const banned = row("a", { authorBanned: true });
    expect(buildThreads([banned], [], NOW)).toEqual([]);
    expect(buildThreads([row("p")], [row("r1", { parentId: "p", authorBanned: true })], NOW)[0].replies).toEqual([]);
    expect(buildThreads([{ ...banned, authorBanned: false }], [], NOW)).toHaveLength(1);
  });

  it("marks only just-posted comments as fresh", () => {
    const threads = buildThreads([row("new", { createdAt: new Date(NOW - 2_000) }), row("old")], [], NOW);
    expect(threads.map((t) => !t.removed && t.fresh)).toEqual([true, false]);
  });
});

describe("deletionPlan", () => {
  it("deletes a comment with no replies", () => {
    expect(deletionPlan({ replyCount: 0, parent: null })).toBe("DELETE");
  });

  it("keeps a tombstone when there are replies", () => {
    expect(deletionPlan({ replyCount: 2, parent: null })).toBe("TOMBSTONE");
  });

  it("removes a tombstoned parent with its last reply", () => {
    expect(deletionPlan({ replyCount: 0, parent: { deleted: true, otherReplies: 0 } })).toBe("DELETE_WITH_PARENT");
  });

  it("keeps the tombstone while other replies remain, and live parents always", () => {
    expect(deletionPlan({ replyCount: 0, parent: { deleted: true, otherReplies: 1 } })).toBe("DELETE");
    expect(deletionPlan({ replyCount: 0, parent: { deleted: false, otherReplies: 0 } })).toBe("DELETE");
  });
});

describe("safeNextPath", () => {
  it("accepts internal paths", () => {
    expect(safeNextPath("/blog/mi-articulo")).toBe("/blog/mi-articulo");
    expect(safeNextPath("/blog/x#comments")).toBe("/blog/x#comments");
  });

  it.each([
    ["https://evil.test"],
    ["//evil.test"],
    ["/\\evil.test"],
    ["\\\\evil.test"],
    ["javascript:alert(1)"],
    ["/a\nb"],
    [""],
    [undefined],
    [["/a", "/b"]],
    [`/${"a".repeat(600)}`],
  ])("rejects %s", (value) => {
    expect(safeNextPath(value)).toBeNull();
  });
});
