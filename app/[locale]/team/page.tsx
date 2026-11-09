import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import type { AppLocale } from "@/i18n/routing";
import { pageMetadata } from "@/lib/seo/metadata";
import { Container } from "@/components/layout/container";
import { SiteShell } from "@/components/layout/site-shell";
import { EmptyState } from "@/components/shared/empty-state";
import { WriterCard } from "@/components/shared/writer-card";
import { getTeamMembers, type TeamMember } from "@/lib/community/queries";

// Same rendering as the landing: static, refreshed every minute and on publish
// (`next build` runs without a database, so the build renders the empty state).
export const revalidate = 60;

const isBuild = () => process.env.NEXT_PHASE === "phase-production-build";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Team");
  return pageMetadata({ title: t("metaTitle"), description: t("metaDescription"), path: "/team", locale: (await getLocale()) as AppLocale });
}

export default async function TeamPage() {
  const t = await getTranslations("Team");
  const to = await getTranslations("Occupation");
  const members: TeamMember[] = isBuild() ? [] : await getTeamMembers();

  return (
    <SiteShell mainClassName="py-16 md:py-24">
      <Container size="content">
        <h1 className="text-3xl font-bold leading-display tracking-display text-balance md:text-4xl">{t("title")}</h1>
        <p className="mt-6 max-w-prose text-xl leading-8 text-pretty text-muted-foreground">{t("lead")}</p>

        {members.length === 0 ? (
          <EmptyState className="mt-16" as="h2" title={t("emptyTitle")} description={t("emptyBody")} />
        ) : (
          <ul className="mt-16 grid gap-x-12 gap-y-14 md:grid-cols-2">
            {members.map((member) => (
              <li key={member.username}>
                <WriterCard member={member} prominent>
                  {member.bio && <p className="max-w-prose text-base leading-7 text-pretty">{member.bio}</p>}
                  <p className="text-sm text-muted-foreground tabular-nums">
                    {member.occupation && `${to(member.occupation as "DEVELOPER")} · `}
                    {t("publications", { count: member.publications })}
                  </p>
                </WriterCard>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </SiteShell>
  );
}
