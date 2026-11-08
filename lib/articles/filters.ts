import type { Prisma } from "@/lib/generated/prisma/client";
import { CATEGORY_SLUGS, type CategorySlug } from "@/lib/articles/validation";
import { slugify } from "@/lib/articles/slug";

// Public listing filters, parsed from URL search params. Pure and unit-tested;
// search is a case-insensitive match today and can move to full-text search
// behind this same shape later.

export const PAGE_SIZE = 12;

export type ListFilters = {
  kind?: "SHOWCASE" | "EDITORIAL";
  category?: CategorySlug;
  tag?: string;
  q?: string;
  sort: "recent" | "oldest";
  page: number;
};

type SearchParams = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export function parseListFilters(params: SearchParams, base: Partial<ListFilters> = {}): ListFilters {
  const category = first(params.category);
  const tag = first(params.tag);
  const q = first(params.q)?.trim().slice(0, 80);
  const page = Number.parseInt(first(params.page) ?? "1", 10);
  return {
    ...base,
    category: (CATEGORY_SLUGS as readonly string[]).includes(category ?? "") ? (category as CategorySlug) : undefined,
    tag: tag ? slugify(tag) || undefined : undefined,
    q: q || undefined,
    sort: first(params.sort) === "oldest" ? "oldest" : "recent",
    page: Number.isFinite(page) && page > 0 ? Math.min(page, 1000) : 1,
  };
}

export function buildArticleWhere(filters: ListFilters): Prisma.ArticleWhereInput {
  const where: Prisma.ArticleWhereInput = { status: "PUBLISHED" };
  if (filters.kind || filters.category) {
    where.category = {
      ...(filters.kind ? { kind: filters.kind } : {}),
      ...(filters.category ? { slug: filters.category } : {}),
    };
  }
  if (filters.tag) where.tags = { some: { tag: { slug: filters.tag } } };
  if (filters.q) {
    where.OR = [
      { title: { contains: filters.q, mode: "insensitive" } },
      { excerpt: { contains: filters.q, mode: "insensitive" } },
      { contentText: { contains: filters.q, mode: "insensitive" } },
    ];
  }
  return where;
}

export function buildArticleOrder(filters: ListFilters): Prisma.ArticleOrderByWithRelationInput[] {
  return [{ publishedAt: filters.sort === "oldest" ? "asc" : "desc" }, { id: "asc" }];
}

/** Query string for links that change one filter and keep the rest. */
export function filtersToQuery(filters: Partial<ListFilters>, change: Partial<ListFilters> = {}): string {
  const merged = { ...filters, ...change };
  const params = new URLSearchParams();
  if (merged.category) params.set("category", merged.category);
  if (merged.tag) params.set("tag", merged.tag);
  if (merged.q) params.set("q", merged.q);
  if (merged.sort === "oldest") params.set("sort", "oldest");
  if (merged.page && merged.page > 1) params.set("page", String(merged.page));
  const query = params.toString();
  return query ? `?${query}` : "";
}
