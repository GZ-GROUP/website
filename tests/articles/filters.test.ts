import { describe, expect, it } from "vitest";
import { buildArticleOrder, buildArticleWhere, filtersToQuery, parseListFilters } from "@/lib/articles/filters";

describe("listing filters", () => {
  it("parses search params defensively", () => {
    expect(parseListFilters({ category: "software", tag: "Machine Learning", q: "  rust ", sort: "oldest", page: "3" })).toEqual({
      category: "software",
      tag: "machine-learning",
      q: "rust",
      sort: "oldest",
      page: 3,
    });
    expect(parseListFilters({ category: "news", page: "-4", sort: "random" })).toMatchObject({
      category: undefined,
      sort: "recent",
      page: 1,
    });
  });

  it("only ever lists published articles", () => {
    expect(buildArticleWhere(parseListFilters({}))).toEqual({ status: "PUBLISHED" });
  });

  it("combines kind, category, tag and search", () => {
    const where = buildArticleWhere(parseListFilters({ category: "research", tag: "ai", q: "redes" }, { kind: "SHOWCASE" }));
    expect(where).toMatchObject({
      status: "PUBLISHED",
      category: { kind: "SHOWCASE", slug: "research" },
      tags: { some: { tag: { slug: "ai" } } },
    });
    expect(where.OR).toHaveLength(3);
  });

  it("sorts by publication date with a stable tie-breaker", () => {
    expect(buildArticleOrder(parseListFilters({}))).toEqual([{ publishedAt: "desc" }, { id: "asc" }]);
    expect(buildArticleOrder(parseListFilters({ sort: "oldest" }))[0]).toEqual({ publishedAt: "asc" });
  });

  it("builds links that keep the other filters", () => {
    const current = parseListFilters({ category: "tutorial", q: "next" });
    expect(filtersToQuery(current, { page: 2 })).toBe("?category=tutorial&q=next&page=2");
    expect(filtersToQuery(current, { category: undefined })).toBe("?q=next");
    expect(filtersToQuery({ sort: "recent", page: 1 })).toBe("");
  });
});
