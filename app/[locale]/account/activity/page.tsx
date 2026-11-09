import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/layout/container";
import { AccountTabs } from "@/components/account/account-tabs";
import { ActivityPanel, ArticleActivityList, CommentActivityList, Metric } from "@/components/dashboard/activity";
import { requireUser } from "@/lib/auth/session";
import { getDashboard } from "@/lib/community/queries";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Dashboard");
  return { title: t("metaTitle") };
}

// A tab of Settings. Every number is a count of stored rows about this user (no estimates).
export default async function ActivityPage() {
  const session = await requireUser();
  const t = await getTranslations("Dashboard");
  const { metrics, recentReads, recentLikes, recentComments } = await getDashboard(session.user.id);

  return (
    <Container size="content">
      <AccountTabs />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold leading-display tracking-display md:text-3xl">{t("title")}</h1>
          <p className="mt-2 text-base text-muted-foreground">{t("privacy")}</p>
        </div>
        <ButtonLink variant="outline" href="/blog">
          {t("explore")}
        </ButtonLink>
      </div>

      <dl className="mt-10 grid grid-cols-1 gap-6 bg-card p-6 sm:grid-cols-3 md:p-8">
        <Metric label={t("metrics.reads")} value={metrics.reads} />
        <Metric label={t("metrics.likes")} value={metrics.likes} />
        <Metric label={t("metrics.comments")} value={metrics.comments} />
      </dl>

      <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="flex flex-col gap-12">
          <ActivityPanel id="recent-reads" title={t("recentReads")} empty={recentReads.length === 0 ? t("emptyReads") : null}>
            <ArticleActivityList items={recentReads} />
          </ActivityPanel>
          <ActivityPanel
            id="recent-comments"
            title={t("recentComments")}
            empty={recentComments.length === 0 ? t("emptyComments") : null}
          >
            <CommentActivityList items={recentComments} onLabel={(title) => t("commentOn", { title })} />
          </ActivityPanel>
        </div>
        <ActivityPanel id="recent-likes" title={t("recentLikes")} empty={recentLikes.length === 0 ? t("emptyLikes") : null}>
          <ArticleActivityList items={recentLikes} />
        </ActivityPanel>
      </div>
    </Container>
  );
}
