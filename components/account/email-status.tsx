"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/forms/form-message";
import { getPathname } from "@/i18n/navigation";
import { authClient } from "@/lib/auth/client";
import { authErrorKey, type AuthErrorKey } from "@/lib/auth/errors";

export function EmailStatus({ email, verified }: { email: string; verified: boolean }) {
  const t = useTranslations("Account.email");
  const ta = useTranslations("Auth.common");
  const te = useTranslations("AuthErrors");
  const locale = useLocale();
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<AuthErrorKey | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-base font-bold break-all">{email}</span>
        {verified ? (
          <span className="inline-flex items-center gap-1 text-sm text-primary-ink">
            <BadgeCheck className="size-4" aria-hidden />
            {t("verified")}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">{t("unverified")}</span>
        )}
      </div>

      {!verified && (
        <>
          {sent && <FormMessage tone="success">{t("resent")}</FormMessage>}
          {error && <FormMessage tone="error">{te(error)}</FormMessage>}
          <Button
            variant="outline"
            className="self-start"
            disabled={pending || sent}
            onClick={async () => {
              setPending(true);
              setError(null);
              const { error } = await authClient.sendVerificationEmail({
                email,
                callbackURL: getPathname({ href: "/account", locale }),
              });
              setPending(false);
              if (error) setError(authErrorKey(error));
              else setSent(true);
            }}
          >
            {pending ? ta("submitting") : t("resend")}
          </Button>
        </>
      )}
    </div>
  );
}
