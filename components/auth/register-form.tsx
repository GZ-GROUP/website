"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { getPathname, Link, useRouter } from "@/i18n/navigation";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/forms/form-field";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { GithubButton } from "@/components/auth/github-button";
import { LegalNotice } from "@/components/auth/legal-notice";
import { authClient } from "@/lib/auth/client";
import { authErrorKey, type AuthErrorKey } from "@/lib/auth/errors";
import { USERNAME_MAX, USERNAME_MIN } from "@/lib/auth/usernames";
import { PASSWORD_MAX, PASSWORD_MIN } from "@/lib/validation/limits";

export function RegisterForm({ githubEnabled }: { githubEnabled: boolean }) {
  const t = useTranslations("Auth");
  const te = useTranslations("AuthErrors");
  const locale = useLocale();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<AuthErrorKey | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    setPending(true);
    setError(null);
    const { error } = await authClient.signUp.email({
      name: String(form.get("name") ?? "").trim(),
      username: String(form.get("username") ?? "").trim().toLowerCase(),
      email: String(form.get("email") ?? "").trim(),
      password: String(form.get("password") ?? ""),
      // Where the (optional) verification link lands.
      callbackURL: getPathname({ href: "/account", locale }),
    });

    if (error) {
      setError(authErrorKey(error));
      setPending(false);
      return;
    }
    router.replace("/account");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={onSubmit} className="flex flex-col gap-6">
        {error && <FormMessage tone="error">{te(error)}</FormMessage>}

        <FormField id="name" label={t("register.name")}>
          {(a11y) => <Input {...a11y} name="name" autoComplete="name" required maxLength={80} />}
        </FormField>

        <FormField id="username" label={t("register.username")} hint={t("register.usernameHint")}>
          {(a11y) => (
            <Input
              {...a11y}
              name="username"
              autoComplete="username"
              required
              minLength={USERNAME_MIN}
              maxLength={USERNAME_MAX}
              pattern="[a-zA-Z0-9][a-zA-Z0-9_.]*[a-zA-Z0-9]"
              autoCapitalize="none"
              spellCheck={false}
            />
          )}
        </FormField>

        <FormField id="email" label={t("common.email")}>
          {(a11y) => <Input {...a11y} name="email" type="email" autoComplete="email" required />}
        </FormField>

        <FormField id="password" label={t("common.password")} hint={t("register.passwordHint")}>
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

        <SubmitButton pending={pending} pendingLabel={t("common.submitting")} className="self-start">
          {t("register.submit")}
        </SubmitButton>
      </form>

      {githubEnabled && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">{t("common.or")}</p>
          <GithubButton label={t("common.github")} />
        </div>
      )}

      <LegalNotice messageKey="register.legal" />

      <p className="text-base text-muted-foreground">
        {t("register.haveAccount")}{" "}
        <Link href="/login" className="font-bold text-primary-ink underline-offset-4 hover:underline">
          {t("register.loginLink")}
        </Link>
      </p>
    </div>
  );
}
