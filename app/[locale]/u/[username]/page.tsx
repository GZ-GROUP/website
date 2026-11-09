import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Container } from "@/components/layout/container";
import { SiteShell } from "@/components/layout/site-shell";
import { EmptyState } from "@/components/shared/empty-state";
import { ArticleGrid } from "@/components/article/article-grid";
import { publishedByUser } from "@/lib/articles/queries";
import { VerifiedBadge } from "@/components/shared/verified-badge";
import { hasRole } from "@/lib/auth/session";
import { getProfileCommunity } from "@/lib/community/queries";
import { prisma } from "@/lib/db";
import { pageMetadata } from "@/lib/seo/metadata";

// Rendered per request: the statistics below must never be a stale copy.
export const dynamic = "force-dynamic";

async function findProfile(username: string) {
  return prisma.user.findUnique({
    where: { username: username.toLowerCase() },
    select: {
      id: true,
      name: true,
      username: true,
      displayUsername: true,
      image: true,
      role: true,
      banned: true,
      createdAt: true,
      profile: { select: { bio: true, description: true, occupation: true } },
      identityVerifications: { select: { provider: true }, orderBy: { provider: "asc" } },
    },
  });
}

export async function generateMetadata({ params }: PageProps<"/[locale]/u/[username]">): Promise<Metadata> {
  const { username } = await params;
  const user = await findProfile(username);
  if (!user || user.banned || !user.username) return {};
  const t = await getTranslations("Profile");
  return pageMetadata({
    title: t("metaTitle", { name: user.name, username: user.username }),
    description: user.profile?.bio ?? undefined,
    path: `/u/${user.username}`,
    locale: "es",
    translated: false,
  });
}

// Public profile. Identity, real statistics and public work; never the
// person's reading history or the likes they have given.
export default async function PublicProfilePage({ params }: PageProps<"/[locale]/u/[username]">) {
  const { username } = await params;
  const user = await findProfile(username);
  if (!user || user.banned || !user.username) notFound();

  const t = await getTranslations("Profile");
  const to = await getTranslations("Occupation");
  const format = await getFormatter();
  const isWriter = hasRole(user, "writer") || hasRole(user, "admin");
  const [articles, community] = await Promise.all([
    isWriter ? publishedByUser(user.id) : { authored: [], coAuthored: [] },
    getProfileCommunity(user.id),
  ]);
  const publications = articles.authored.length + articles.coAuthored.length;

  const stats = [
    ...(isWriter
      ? [
          { label: t("stats.publications"), value: publications },
          { label: t("stats.likesReceived"), value: community.likesReceived },
        ]
      : []),
    { label: t("stats.comments"), value: community.comments },
  ];

  return (
    <SiteShell mainClassName="py-16 md:py-24">
      <Container size="content" className="grid gap-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <header className="flex flex-col gap-6">
          <Avatar className="size-24">
            {user.image && <AvatarImage src={user.image} alt="" />}
            <AvatarFallback className="text-3xl font-bold">{user.name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold leading-display tracking-display text-balance md:text-3xl">{user.name}</h1>
            <p className="mt-2 text-base text-muted-foreground">@{user.displayUsername ?? user.username}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {isWriter && (
              <span className="bg-accent px-2 py-1 text-sm font-bold text-accent-foreground">{t("writer")}</span>
            )}
            {user.identityVerifications.map(({ provider }) => (
              <VerifiedBadge key={provider} provider={provider} />
            ))}
          </div>

          <div className="flex flex-col gap-1 text-base">
            {user.profile?.occupation && <p>{to(user.profile.occupation)}</p>}
            <p className="text-muted-foreground">
              {t("memberSince", { date: format.dateTime(user.createdAt, { month: "long", year: "numeric" }) })}
            </p>
          </div>

          <dl className="flex flex-wrap gap-x-8 gap-y-4">
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col-reverse">
                <dt className="text-sm text-muted-foreground">{stat.label}</dt>
                <dd className="text-2xl font-bold leading-display tabular-nums">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </header>

        <div className="flex flex-col gap-12">
          <div className="flex flex-col gap-4">
            <p className="text-xl leading-8 text-balance">{user.profile?.bio ?? t("noBio")}</p>
            {user.profile?.description && (
              <p className="max-w-prose text-base leading-7 whitespace-pre-line text-muted-foreground">
                {user.profile.description}
              </p>
            )}
          </div>

          {isWriter && (
            <section aria-labelledby="articles-title">
              <h2 id="articles-title" className="text-xl font-bold">
                {t("articles")}
              </h2>
              {articles.authored.length === 0 ? (
                <EmptyState className="mt-6" as="p" title={t("articlesEmpty")} />
              ) : (
                <div className="mt-8">
                  <ArticleGrid items={articles.authored} columns={2} />
                </div>
              )}
            </section>
          )}

          {articles.coAuthored.length > 0 && (
            <section aria-labelledby="coauthored-title">
              <h2 id="coauthored-title" className="text-xl font-bold">
                {t("coAuthored")}
              </h2>
              <div className="mt-8">
                <ArticleGrid items={articles.coAuthored} columns={2} />
              </div>
            </section>
          )}

          {community.recentComments.length > 0 && (
            <section aria-labelledby="comments-title">
              <h2 id="comments-title" className="text-xl font-bold">
                {t("recentComments")}
              </h2>
              <ul className="mt-6 flex flex-col gap-6">
                {community.recentComments.map((comment) => (
                  <li key={comment.id}>
                    <p className="line-clamp-3 text-base leading-7 wrap-anywhere">{comment.body}</p>
                    <Link
                      href={`/blog/${comment.article.slug}#comment-${comment.id}`}
                      className="mt-1 inline-block text-sm text-primary-ink underline-offset-4 hover:underline"
                    >
                      {t("commentOn", { title: comment.article.title })}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </Container>
    </SiteShell>
  );
}
