import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/layout/container";
import { FormMessage } from "@/components/forms/form-message";
import { ChangePasswordForm } from "@/components/account/change-password-form";
import { requireUser } from "@/lib/auth/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Password");
  return { title: t("metaTitle") };
}

export default async function ChangePasswordPage() {
  // The only page a user with a pending forced change can reach.
  const session = await requireUser({ allowPendingPasswordChange: true });
  const t = await getTranslations("Password");
  const forced = session.user.mustChangePassword;

  return (
    <Container size="form">
      <h1 className="text-2xl font-bold leading-display tracking-display md:text-3xl">{t("title")}</h1>
      <div className="mt-10 flex flex-col gap-8">
        {forced && <FormMessage tone="error">{t("required")}</FormMessage>}
        <ChangePasswordForm />
        {!forced && (
          <Link href="/account" className="self-start text-base text-primary-ink underline-offset-4 hover:underline">
            {t("back")}
          </Link>
        )}
      </div>
    </Container>
  );
}
