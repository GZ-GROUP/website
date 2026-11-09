import { useFormatter } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { ActivityArticle, ActivityComment } from "@/lib/community/queries";

// Reader dashboard pieces. Operate mode: numbers are type, not tiles.

export function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col-reverse gap-1">
      <dt className="text-base text-muted-foreground">{label}</dt>
      <dd className="text-3xl font-bold leading-display tabular-nums md:text-4xl">{value}</dd>
    </div>
  );
}

export function ActivityPanel({
  id,
  title,
  empty,
  children,
}: {
  id: string;
  title: string;
  empty: string | null;
  children?: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="border-b border-border pb-3 text-xl font-bold">
        {title}
      </h2>
      {empty ? <p className="mt-4 text-base text-muted-foreground">{empty}</p> : children}
    </section>
  );
}

function When({ at }: { at: Date }) {
  const format = useFormatter();
  return (
    <time dateTime={at.toISOString()} className="shrink-0 text-sm text-muted-foreground tabular-nums">
      {format.dateTime(at, { dateStyle: "medium" })}
    </time>
  );
}

export function ArticleActivityList({ items }: { items: ActivityArticle[] }) {
  return (
    <ul className="divide-y divide-border">
      {items.map((item) => (
        <li key={item.slug} className="flex items-baseline justify-between gap-4 py-3">
          <Link href={`/blog/${item.slug}`} className="min-w-0 text-base hover:text-primary-ink">
            {item.title}
          </Link>
          <When at={item.at} />
        </li>
      ))}
    </ul>
  );
}

export function CommentActivityList({ items, onLabel }: { items: ActivityComment[]; onLabel: (title: string) => string }) {
  return (
    <ul className="divide-y divide-border">
      {items.map((item) => (
        <li key={item.id} className="flex flex-col gap-1 py-3">
          <p className="line-clamp-2 text-base leading-7 wrap-anywhere">{item.body}</p>
          <div className="flex items-baseline justify-between gap-4">
            <Link
              href={`/blog/${item.article.slug}#comment-${item.id}`}
              className="min-w-0 text-sm text-primary-ink underline-offset-4 hover:underline"
            >
              {onLabel(item.article.title)}
            </Link>
            <When at={item.at} />
          </div>
        </li>
      ))}
    </ul>
  );
}
