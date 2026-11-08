"use client";

import { useLocale, useTranslations } from "next-intl";
import { Languages } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

// Two locales, so the switcher is a single link to the same page in the other language.
export function LocaleSwitcher({ className }: { className?: string }) {
  const t = useTranslations("LocaleSwitcher");
  const locale = useLocale();
  const pathname = usePathname();
  const target = routing.locales.find((l) => l !== locale) ?? routing.defaultLocale;
  const language = t(target);

  return (
    <Link
      href={pathname}
      locale={target}
      hrefLang={target}
      aria-label={t("switchTo", { language })}
      className={cn(
        "inline-flex h-10 items-center gap-2 px-3 text-base text-muted-foreground transition-colors duration-150 hover:text-foreground",
        className,
      )}
    >
      <Languages className="size-4" aria-hidden />
      <span lang={target}>{language}</span>
    </Link>
  );
}
