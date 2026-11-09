import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { AuthShell } from "@/components/auth/auth-shell";
import mascot from "@/public/brand/mascot-coding.png";
import { RegisterForm } from "@/components/auth/register-form";
import { redirect } from "@/i18n/navigation";
import { isGithubEnabled } from "@/lib/auth/providers";
import { getSession } from "@/lib/auth/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Auth.register");
  return { title: t("metaTitle"), robots: { index: false, follow: true } };
}

export default async function RegisterPage() {
  if (await getSession()) redirect({ href: "/account", locale: await getLocale() });
  const t = await getTranslations("Auth.register");

  return (
    <AuthShell title={t("title")} lead={t("lead")} illustration={mascot}>
      <RegisterForm githubEnabled={isGithubEnabled()} />
    </AuthShell>
  );
}
