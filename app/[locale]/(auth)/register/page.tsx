import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";
import { redirect } from "@/i18n/navigation";
import { isGithubEnabled } from "@/lib/auth/providers";
import { getSession } from "@/lib/auth/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Auth.register");
  return { title: t("metaTitle") };
}

export default async function RegisterPage() {
  if (await getSession()) redirect({ href: "/account", locale: await getLocale() });
  const t = await getTranslations("Auth.register");

  return (
    <AuthShell title={t("title")} lead={t("lead")}>
      <RegisterForm githubEnabled={isGithubEnabled()} />
    </AuthShell>
  );
}
