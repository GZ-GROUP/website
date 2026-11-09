"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { GZLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/layout/container";

// Shown when a page fails on the server or in the browser. No site header here:
// the header may be part of what failed. The reference matches the server log.
export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const t = useTranslations("Error");
  const tc = useTranslations("Header");

  return (
    <div className="flex min-h-dvh flex-col justify-center py-16">
      <Container size="reading">
        <main>
          <Link href="/" aria-label={tc("homeLabel")} className="inline-block">
            <GZLogo className="h-10" />
          </Link>
          <h1 className="mt-10 text-3xl font-bold leading-display tracking-display text-balance md:text-4xl">{t("title")}</h1>
          <p className="mt-6 text-base leading-7">{t("body")}</p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button onClick={() => retry()}>{t("retry")}</Button>
            <ButtonLink variant="outline" href="/">
              {t("home")}
            </ButtonLink>
          </div>
          {error.digest && (
            <p className="mt-8 text-sm text-muted-foreground tabular-nums">{t("reference", { digest: error.digest })}</p>
          )}
        </main>
      </Container>
    </div>
  );
}
