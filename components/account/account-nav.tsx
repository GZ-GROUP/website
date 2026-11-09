"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { key: "account", href: "/account" },
  { key: "activity", href: "/account/activity" },
] as const;

// Same treatment as AdminNav: the active tab is a change of ink and an underline.
export function AccountNav({ showAdmin }: { showAdmin: boolean }) {
  const t = useTranslations("AccountNav");
  const pathname = usePathname();
  const items = showAdmin ? [...ITEMS, { key: "admin", href: "/admin" } as const] : ITEMS;

  return (
    <nav aria-label={t("label")} className="mb-10 flex gap-6 border-b border-border">
      {items.map((item) => {
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
  );
}
