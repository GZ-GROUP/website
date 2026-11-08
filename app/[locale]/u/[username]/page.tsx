import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Container } from "@/components/layout/container";
import { SiteShell } from "@/components/layout/site-shell";
import { EmptyState } from "@/components/shared/empty-state";
import { ArticleGrid } from "@/components/article/article-grid";
import { publishedByUser } from "@/lib/articles/queries";
import { VerifiedBadge } from "@/components/shared/verified-badge";
import { hasRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

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
  return { title: t("metaTitle", { name: user.name, username: user.username }), description: user.profile?.bio ?? undefined };
}

// Public profile. Identity: name, handle, bio, occupation, verified accounts.
export default async function PublicProfilePage({ params }: PageProps<"/[locale]/u/[username]">) {
  const { username } = await params;
  const user = await findProfile(username);
  if (!user || user.banned || !user.username) notFound();

  const t = await getTranslations("Profile");
  const to = await getTranslations("Occupation");
  const format = await getFormatter();
  const isWriter = hasRole(user, "writer") || hasRole(user, "admin");
  const articles = isWriter ? await publishedByUser(user.id) : [];

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
              {articles.length === 0 ? (
                <EmptyState className="mt-6" as="p" title={t("articlesEmpty")} />
              ) : (
                <div className="mt-8">
                  <ArticleGrid items={articles} columns={2} />
                </div>
              )}
            </section>
          )}
        </div>
      </Container>
    </SiteShell>
  );
}
