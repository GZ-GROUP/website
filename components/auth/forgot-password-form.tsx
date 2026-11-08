"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { getPathname, Link } from "@/i18n/navigation";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/forms/form-field";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { authClient } from "@/lib/auth/client";
import { authErrorKey, type AuthErrorKey } from "@/lib/auth/errors";

export function ForgotPasswordForm() {
  const t = useTranslations("Auth");
  const te = useTranslations("AuthErrors");
  const locale = useLocale();
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<AuthErrorKey | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") ?? "").trim();

    setPending(true);
    setError(null);
    const { error } = await authClient.requestPasswordReset({
      email,
      redirectTo: getPathname({ href: "/reset-password", locale }),
    });
    setPending(false);

    // The same message whether or not the account exists (no account enumeration).
    if (error && error.status === 429) setError(authErrorKey(error));
    else setSent(true);
  }

  return (
    <div className="flex flex-col gap-8">
      {sent ? (
        <FormMessage tone="success">{t("forgot.sent")}</FormMessage>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-6">
          {error && <FormMessage tone="error">{te(error)}</FormMessage>}
          <FormField id="email" label={t("common.email")}>
            {(a11y) => <Input {...a11y} name="email" type="email" autoComplete="email" required />}
          </FormField>
          <SubmitButton pending={pending} pendingLabel={t("common.submitting")} className="self-start">
            {t("forgot.submit")}
          </SubmitButton>
        </form>
      )}
      <Link href="/login" className="self-start text-base text-primary-ink underline-offset-4 hover:underline">
        {t("forgot.back")}
      </Link>
    </div>
  );
}
