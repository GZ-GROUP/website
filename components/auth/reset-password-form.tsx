"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/forms/form-field";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { authClient } from "@/lib/auth/client";
import { authErrorKey, type AuthErrorKey } from "@/lib/auth/errors";
import { PASSWORD_MAX, PASSWORD_MIN } from "@/lib/validation/limits";

export function ResetPasswordForm({ token }: { token: string | null }) {
  const t = useTranslations("Auth");
  const te = useTranslations("AuthErrors");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<AuthErrorKey | null>(token ? null : "INVALID_TOKEN");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    const form = new FormData(event.currentTarget);
    const newPassword = String(form.get("password") ?? "");
    if (newPassword !== String(form.get("confirm") ?? "")) {
      setError("PASSWORDS_DO_NOT_MATCH");
      return;
    }

    setPending(true);
    setError(null);
    const { error } = await authClient.resetPassword({ newPassword, token });
    setPending(false);
    if (error) setError(authErrorKey(error));
    else setDone(true);
  }

  if (done) {
    return (
      <div className="flex flex-col gap-8">
        <FormMessage tone="success">{t("reset.done")}</FormMessage>
        <Link href="/login" className="self-start font-bold text-primary-ink underline-offset-4 hover:underline">
          {t("reset.loginLink")}
        </Link>
      </div>
    );
  }

  if (!token || error === "INVALID_TOKEN") {
    return (
      <div className="flex flex-col gap-8">
        <FormMessage tone="error">{t("reset.invalid")}</FormMessage>
        <Link href="/forgot-password" className="self-start font-bold text-primary-ink underline-offset-4 hover:underline">
          {t("reset.requestNew")}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      {error && <FormMessage tone="error">{te(error)}</FormMessage>}
      <FormField id="password" label={t("reset.newPassword")} hint={t("register.passwordHint")}>
        {(a11y) => (
          <Input
            {...a11y}
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={PASSWORD_MIN}
            maxLength={PASSWORD_MAX}
          />
        )}
      </FormField>
      <FormField id="confirm" label={t("reset.confirm")}>
        {(a11y) => <Input {...a11y} name="confirm" type="password" autoComplete="new-password" required />}
      </FormField>
      <SubmitButton pending={pending} pendingLabel={t("common.submitting")} className="self-start">
        {t("reset.submit")}
      </SubmitButton>
    </form>
  );
}
