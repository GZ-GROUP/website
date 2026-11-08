"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/forms/form-field";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { GithubButton } from "@/components/auth/github-button";
import { authClient } from "@/lib/auth/client";
import { authErrorKey, type AuthErrorKey } from "@/lib/auth/errors";

export function LoginForm({ githubEnabled }: { githubEnabled: boolean }) {
  const t = useTranslations("Auth");
  const te = useTranslations("AuthErrors");
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<AuthErrorKey | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const identifier = String(form.get("identifier") ?? "").trim();
    const password = String(form.get("password") ?? "");

    setPending(true);
    setError(null);
    const { error } = identifier.includes("@")
      ? await authClient.signIn.email({ email: identifier, password })
      : await authClient.signIn.username({ username: identifier, password });

    if (error) {
      setError(authErrorKey(error));
      setPending(false);
      return;
    }
    // The account page redirects to the forced password change when needed.
    router.replace("/account");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={onSubmit} className="flex flex-col gap-6" noValidate={false}>
        {error && <FormMessage tone="error">{te(error)}</FormMessage>}

        <FormField id="identifier" label={t("login.identifier")}>
          {(a11y) => (
            <Input {...a11y} name="identifier" autoComplete="username" required autoCapitalize="none" spellCheck={false} />
          )}
        </FormField>

        <FormField id="password" label={t("common.password")}>
          {(a11y) => <Input {...a11y} name="password" type="password" autoComplete="current-password" required />}
        </FormField>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <SubmitButton pending={pending} pendingLabel={t("common.submitting")}>
            {t("login.submit")}
          </SubmitButton>
          <Link href="/forgot-password" className="text-base text-primary-ink underline-offset-4 hover:underline">
            {t("login.forgot")}
          </Link>
        </div>
      </form>

      {githubEnabled && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">{t("common.or")}</p>
          <GithubButton label={t("common.github")} />
        </div>
      )}

      <p className="text-base text-muted-foreground">
        {t("login.noAccount")}{" "}
        <Link href="/register" className="font-bold text-primary-ink underline-offset-4 hover:underline">
          {t("login.registerLink")}
        </Link>
      </p>
    </div>
  );
}
