import { ButtonLink } from "@/components/ui/button-link";
import { getLocale, getTranslations } from "next-intl/server";
import { Search } from "lucide-react";
import { getPathname, Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Container } from "@/components/layout/container";
import { ArticleGrid } from "@/components/article/article-grid";
import { EmptyState } from "@/components/shared/empty-state";
import { filtersToQuery, type ListFilters } from "@/lib/articles/filters";
import { listPublishedArticles, publishedTags } from "@/lib/articles/queries";
import { cn } from "@/lib/utils";

type ListingProps = {
  title: string;
  lead: string;
  filters: ListFilters;
  categories: readonly string[];
};

const CHIP =
  "inline-flex h-10 items-center px-4 text-base transition-colors duration-150 border border-border hover:border-primary-ink hover:text-primary-ink";
const CHIP_ACTIVE = "border-primary bg-primary text-primary-foreground hover:text-primary-foreground hover:border-primary";

// Filters are plain links and a GET form, so the
// whole listing works without JavaScript and every state has a shareable URL.
export async function ArticleListing({ title, lead, filters, categories }: ListingProps) {
  const t = await getTranslations("Blog");
  const tc = await getTranslations("Categories");
  const locale = await getLocale();
  const [page, tags] = await Promise.all([listPublishedArticles(filters), publishedTags()]);
  const hasFilters = Boolean(filters.category || filters.tag || filters.q || filters.sort === "oldest");
  const href = (change: Partial<ListFilters>) => `/blog${filtersToQuery(filters, { page: 1, ...change })}`;

  return (
    <Container size="wide">
      <header className="max-w-3xl">
        <h1 className="text-3xl font-bold leading-display tracking-display text-balance md:text-4xl">{title}</h1>
        <p className="mt-6 text-base leading-7 text-muted-foreground md:text-xl md:leading-8">{lead}</p>
      </header>

      <section aria-label={t("filters")} className="mt-12 flex flex-col gap-6 md:mt-16">
        <form method="get" action={getPathname({ href: "/blog", locale })} role="search" className="flex max-w-xl items-end gap-3">
          {filters.category && <input type="hidden" name="category" value={filters.category} />}
          {filters.tag && <input type="hidden" name="tag" value={filters.tag} />}
          {filters.sort === "oldest" && <input type="hidden" name="sort" value="oldest" />}
          <label className="flex flex-1 flex-col gap-2">
            <span className="sr-only">{t("search")}</span>
            <Input name="q" type="search" defaultValue={filters.q ?? ""} placeholder={t("searchPlaceholder")} maxLength={80} />
          </label>
          <Button type="submit" variant="outline" aria-label={t("searchSubmit")}>
            <Search aria-hidden />
          </Button>
        </form>

        <nav aria-label={t("category")} className="flex flex-wrap gap-2">
          <Link href={href({ category: undefined })} className={cn(CHIP, !filters.category && CHIP_ACTIVE)} aria-current={!filters.category ? "page" : undefined}>
            {t("allCategories")}
          </Link>
          {categories.map((slug) => (
            <Link
              key={slug}
              href={href({ category: slug as ListFilters["category"] })}
              className={cn(CHIP, filters.category === slug && CHIP_ACTIVE)}
              aria-current={filters.category === slug ? "page" : undefined}
            >
              {tc(`${slug}.title` as "software.title")}
            </Link>
          ))}
        </nav>

        {tags.length > 0 && (
          <nav aria-label={t("tags")} className="flex flex-wrap items-center gap-x-4 gap-y-2 text-base">
            <span className="text-sm text-muted-foreground">{t("tags")}</span>
            {tags.map((tag) => (
              <Link
                key={tag.slug}
                href={href({ tag: filters.tag === tag.slug ? undefined : tag.slug })}
                className={cn(
                  "underline-offset-4 hover:text-primary-ink hover:underline",
                  filters.tag === tag.slug ? "font-bold text-primary-ink underline" : "text-muted-foreground",
                )}
                aria-current={filters.tag === tag.slug ? "page" : undefined}
              >
                #{tag.name}
              </Link>
            ))}
          </nav>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4 text-base">
          <p className="text-muted-foreground tabular-nums" aria-live="polite">
            {t("results", { count: page.total })}
          </p>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{t("sort")}</span>
            <Link href={href({ sort: "recent" })} className={filters.sort === "recent" ? "font-bold" : "text-muted-foreground hover:text-foreground"} aria-current={filters.sort === "recent" ? "true" : undefined}>
              {t("recent")}
            </Link>
            <Link href={href({ sort: "oldest" })} className={filters.sort === "oldest" ? "font-bold" : "text-muted-foreground hover:text-foreground"} aria-current={filters.sort === "oldest" ? "true" : undefined}>
              {t("oldest")}
            </Link>
            {hasFilters && (
              <Link href="/blog" className="text-primary-ink underline-offset-4 hover:underline">
                {t("clear")}
              </Link>
            )}
          </div>
        </div>
      </section>

      <div className="mt-12">
        {page.items.length === 0 ? (
          <EmptyState as="p" title={hasFilters ? t("empty") : t("emptyAll")} />
        ) : (
          <ArticleGrid items={page.items} headingLevel={2} />
        )}
      </div>

      {page.pageCount > 1 && (
        <nav aria-label={t("pagination")} className="mt-16 flex items-center justify-between gap-4">
          {page.page > 1 ? (
            <ButtonLink variant="outline" href={href({ page: page.page - 1 })}>
              {t("previous")}
            </ButtonLink>
          ) : (
            <span />
          )}
          <p className="text-base text-muted-foreground tabular-nums">{t("pageOf", { page: page.page, count: page.pageCount })}</p>
          {page.page < page.pageCount ? (
            <ButtonLink variant="outline" href={href({ page: page.page + 1 })}>
              {t("next")}
            </ButtonLink>
          ) : (
            <span />
          )}
        </nav>
      )}
    </Container>
  );
}
