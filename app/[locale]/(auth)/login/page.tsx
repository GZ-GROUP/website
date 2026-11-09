import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { redirect } from "@/i18n/navigation";
import mascot from "@/public/brand/mascot-tech.png";
import { safeNextPath } from "@/lib/auth/next-path";
import { isGithubEnabled } from "@/lib/auth/providers";
import { getSession } from "@/lib/auth/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Auth.login");
  return { title: t("metaTitle"), robots: { index: false, follow: true } };
}

export default async function LoginPage({ searchParams }: PageProps<"/[locale]/login">) {
  const next = safeNextPath((await searchParams).next);
  if (await getSession()) redirect({ href: next ?? "/account", locale: await getLocale() });
  const t = await getTranslations("Auth.login");

  return (
    <AuthShell title={t("title")} illustration={mascot}>
      <LoginForm githubEnabled={isGithubEnabled()} next={next} />
    </AuthShell>
  );
}
