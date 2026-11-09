import { ButtonLink } from "@/components/ui/button-link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ArrowUpRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/layout/container";
import { SettingsSection } from "@/components/account/settings-section";
import { AvatarField } from "@/components/account/avatar-field";
import { ProfileForm } from "@/components/account/profile-form";
import { EmailStatus } from "@/components/account/email-status";
import { LinkedAccounts } from "@/components/account/linked-accounts";
import { SignOutButton } from "@/components/account/sign-out-button";
import { requireUser } from "@/lib/auth/session";
import { isGithubEnabled } from "@/lib/auth/providers";
import { prisma } from "@/lib/db";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Account");
  return { title: t("metaTitle") };
}

export default async function AccountPage() {
  const session = await requireUser();
  const t = await getTranslations("Account");

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: {
      name: true,
      image: true,
      email: true,
      emailVerified: true,
      username: true,
      profile: { select: { bio: true, description: true, occupation: true } },
      accounts: { select: { providerId: true, accountId: true } },
    },
  });
  const githubAccountId = user.accounts.find((a) => a.providerId === "github")?.accountId ?? null;

  return (
    <Container size="content">
      <div className="flex flex-wrap items-end justify-between gap-4 pb-10">
        <h1 className="text-2xl font-bold leading-display tracking-display md:text-3xl">{t("title")}</h1>
        {user.username && (
          <Link
            href={`/u/${user.username}`}
            className="inline-flex items-center gap-1 text-base text-primary-ink underline-offset-4 hover:underline"
          >
            {t("viewProfile")}
            <ArrowUpRight className="size-4" aria-hidden />
          </Link>
        )}
      </div>

      <div className="divide-y divide-border">
        <SettingsSection id="profile" title={t("profile.title")} description={t("profile.lead")}>
          <AvatarField name={user.name} image={user.image} />
          <ProfileForm
            defaults={{
              name: user.name,
              username: user.username ?? "",
              bio: user.profile?.bio ?? "",
              description: user.profile?.description ?? "",
              occupation: user.profile?.occupation ?? "",
            }}
          />
        </SettingsSection>

        <SettingsSection id="email" title={t("email.title")} description={t("email.description")}>
          <EmailStatus email={user.email} verified={user.emailVerified} />
        </SettingsSection>

        <SettingsSection id="linked" title={t("linked.title")} description={t("linked.description")}>
          <LinkedAccounts githubEnabled={isGithubEnabled()} githubAccountId={githubAccountId} />
        </SettingsSection>

        <SettingsSection id="security" title={t("security.title")} description={t("security.description")}>
          <div className="flex flex-wrap gap-3">
            <ButtonLink variant="outline" href="/account/password">
              {t("security.changePassword")}
            </ButtonLink>
            <SignOutButton variant="ghost" label={t("security.signOut")} />
          </div>
        </SettingsSection>
      </div>
    </Container>
  );
}
