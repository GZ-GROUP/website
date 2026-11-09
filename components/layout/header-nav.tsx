"use client";

import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { SHOWCASE_CATEGORIES, categoryHref } from "@/components/layout/nav-config";
import { ripple } from "@/lib/ui/ripple";
import { cn } from "@/lib/utils";

// Indicator: a 2px bar under the item. It grows from the left on hover
// (200ms, ease-out-strong) and stays for the current section. Colour and
// position carry the state; no layout shift.
const INDICATOR =
  "after:pointer-events-none after:absolute after:inset-x-3 after:bottom-1 after:h-0.5 after:origin-left after:scale-x-0 after:bg-primary after:transition-transform after:duration-200 after:ease-out-strong hover:after:scale-x-100 data-[active=true]:text-foreground data-[active=true]:after:scale-x-100";

const NAV_ITEM = cn(
  "relative inline-flex h-10 items-center overflow-hidden px-3 text-base text-muted-foreground transition-colors duration-150 hover:bg-transparent hover:text-foreground focus:bg-transparent data-[active=true]:bg-transparent data-popup-open:bg-transparent data-popup-open:hover:bg-transparent",
  INDICATOR,
);

/** Menu rows inside the "Projects" panel: highlighted on hover/focus, ripple on press. */
const PANEL_ITEM =
  "relative grid grid-cols-[auto_1fr] items-start gap-x-4 gap-y-1 overflow-hidden p-3 transition-colors duration-150 hover:bg-popover-hover focus:bg-popover-hover focus-visible:bg-popover-hover";

export function HeaderNav() {
  const t = useTranslations("Header");
  const tc = useTranslations("Categories");
  const pathname = usePathname();
  const section = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <NavigationMenu aria-label={t("primaryNav")} className="hidden lg:flex">
      <NavigationMenuList className="gap-1">
        <NavigationMenuItem>
          <NavigationMenuTrigger
            className={cn(NAV_ITEM, "data-popup-open:text-foreground data-popup-open:after:scale-x-100")}
            data-active={section("/projects")}
            onPointerDown={ripple}
          >
            {t("projects")}
          </NavigationMenuTrigger>
          <NavigationMenuContent className="w-[34rem] p-0">
            <ul className="grid gap-1 p-3">
              {SHOWCASE_CATEGORIES.map(({ slug, icon: Icon }) => (
                <li key={slug}>
                  <NavigationMenuLink render={<Link href={categoryHref(slug)} />} className={PANEL_ITEM} onPointerDown={ripple}>
                    <Icon className="mt-1 size-5 text-primary-ink" aria-hidden />
                    <span className="text-base font-bold text-foreground">{tc(`${slug}.title`)}</span>
                    <span className="col-start-2 text-base leading-6 text-muted-foreground">{tc(`${slug}.description`)}</span>
                  </NavigationMenuLink>
                </li>
              ))}
            </ul>
            <div className="border-t border-border px-6 py-4">
              <Link href="/projects" className="group inline-flex items-center gap-2 text-base font-bold text-primary-ink">
                {t("allProjects")}
                <ArrowRight
                  className="size-4 transition-transform duration-150 ease-out group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuLink
            render={<Link href="/team" />}
            className={NAV_ITEM}
            data-active={section("/team")}
            aria-current={section("/team") ? "page" : undefined}
            onPointerDown={ripple}
          >
            {t("team")}
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
