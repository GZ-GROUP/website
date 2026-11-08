import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Auth.reset");
  return { title: t("metaTitle"), robots: { index: false } };
}

// Better Auth redirects here with ?token=… (or ?error=INVALID_TOKEN).
export default async function ResetPasswordPage({ searchParams }: PageProps<"/[locale]/reset-password">) {
  const { token, error } = await searchParams;
  const t = await getTranslations("Auth.reset");
  const validToken = typeof token === "string" && !error ? token : null;

  return (
    <AuthShell title={t("title")}>
      <ResetPasswordForm token={validToken} />
    </AuthShell>
  );
}
