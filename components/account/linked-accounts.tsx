"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/forms/form-message";
import { VerifiedBadge } from "@/components/shared/verified-badge";
import { getPathname, useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth/client";
import { authErrorKey, type AuthErrorKey } from "@/lib/auth/errors";

type LinkedAccountsProps = {
  githubEnabled: boolean;
  /** The linked GitHub account id, or null when GitHub is not linked. */
  githubAccountId: string | null;
};

// Linking is always explicit and requires an active session (ADR 0002).
export function LinkedAccounts({ githubEnabled, githubAccountId }: LinkedAccountsProps) {
  const githubLinked = githubAccountId !== null;
  const t = useTranslations("Account.linked");
  const ta = useTranslations("Auth.common");
  const te = useTranslations("AuthErrors");
  const locale = useLocale();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<AuthErrorKey | null>(null);

  if (!githubEnabled && !githubLinked) {
    return <p className="text-base text-muted-foreground">{t("unavailable")}</p>;
  }

  async function connect() {
    setPending(true);
    setError(null);
    const { error } = await authClient.linkSocial({
      provider: "github",
      callbackURL: getPathname({ href: "/account", locale }),
    });
    if (error) {
      setError(authErrorKey(error));
      setPending(false);
    }
  }

  async function disconnect() {
    setPending(true);
    setError(null);
    const { error } = await authClient.unlinkAccount({ accountId: githubAccountId ?? "" });
    setPending(false);
    if (error) setError(authErrorKey(error));
    else router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      {error && <FormMessage tone="error">{te(error)}</FormMessage>}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-base font-bold">{t("github")}</span>
          {githubLinked ? (
            <VerifiedBadge provider="GITHUB" />
          ) : (
            <span className="text-sm text-muted-foreground">{t("notConnected")}</span>
          )}
        </div>
        {githubLinked ? (
          <Button variant="outline" size="sm" disabled={pending} onClick={disconnect}>
            {pending ? ta("submitting") : t("disconnect")}
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled={pending} onClick={connect}>
            {pending ? ta("submitting") : t("connect")}
          </Button>
        )}
      </div>
    </div>
  );
}
