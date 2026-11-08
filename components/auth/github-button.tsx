"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { getPathname } from "@/i18n/navigation";
import { authClient } from "@/lib/auth/client";

export function GithubButton({ label }: { label: string }) {
  const t = useTranslations("Auth.common");
  const locale = useLocale();
  const [pending, setPending] = useState(false);

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await authClient.signIn.social({
          provider: "github",
          callbackURL: getPathname({ href: "/account", locale }),
          errorCallbackURL: getPathname({ href: "/login", locale }),
        });
      }}
    >
      {pending ? t("submitting") : label}
    </Button>
  );
}
