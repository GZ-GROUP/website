"use client";

import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { key: "users", href: "/admin" },
  { key: "articles", href: "/admin/articles" },
  { key: "comments", href: "/admin/comments" },
] as const;

// Area navigation: the active item is a change of ink and an underline, not a coloured pill.
export function AdminNav() {
  const t = useTranslations("AdminNav");
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-4">
      {/* Administration is reached from Settings, so that is the way back. */}
      <Link
        href="/account"
        className="inline-flex items-center gap-1 self-start text-base text-primary-ink underline-offset-4 hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t("backToSettings")}
      </Link>
      <nav aria-label={t("label")} className="flex gap-6 border-b border-border">
        {ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "-mb-px border-b-2 py-3 text-base transition-colors duration-150",
                active ? "border-primary font-bold text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {t(item.key)}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
