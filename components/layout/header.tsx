import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { GZLogo } from "@/components/brand/logo";
import { Container } from "@/components/layout/container";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { MobileNav } from "@/components/layout/mobile-nav";
import { SHOWCASE_CATEGORIES, categoryHref } from "@/components/layout/nav-config";

const NAV_LINK =
  "inline-flex h-10 items-center px-3 text-base text-muted-foreground transition-colors duration-150 hover:bg-transparent hover:text-foreground focus:bg-transparent";

export function Header() {
  const t = useTranslations("Header");
  const tc = useTranslations("Categories");

  return (
    <header className="bg-background">
      <Container size="wide" className="flex h-16 items-center justify-between gap-6">
        <div className="flex items-center gap-8">
          <Link href="/" aria-label={t("homeLabel")} className="flex items-center gap-3">
            <GZLogo className="h-8" />
            <span className="text-base font-bold text-foreground">GZ Group</span>
          </Link>

          <NavigationMenu aria-label={t("primaryNav")} className="hidden lg:flex">
            <NavigationMenuList className="gap-1">
              <NavigationMenuItem>
                <NavigationMenuLink render={<Link href="/blog" />} className={NAV_LINK}>
                  {t("blog")}
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger className={`${NAV_LINK} data-popup-open:text-foreground`}>
                  {t("projects")}
                </NavigationMenuTrigger>
                <NavigationMenuContent className="w-[34rem] p-0">
                  <ul className="grid gap-1 p-3">
                    {SHOWCASE_CATEGORIES.map(({ slug, icon: Icon }) => (
                      <li key={slug}>
                        <NavigationMenuLink
                          render={<Link href={categoryHref(slug)} />}
                          className="grid grid-cols-[auto_1fr] items-start gap-x-4 gap-y-1 p-3"
                        >
                          <Icon className="mt-1 size-5 text-primary-ink" aria-hidden />
                          <span className="text-base font-bold text-foreground">{tc(`${slug}.title`)}</span>
                          <span className="col-start-2 text-base leading-6 text-muted-foreground">
                            {tc(`${slug}.description`)}
                          </span>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                  <div className="bg-muted px-6 py-4">
                    <Link
                      href="/projects"
                      className="group inline-flex items-center gap-2 text-base font-bold text-primary-ink"
                    >
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
                <NavigationMenuLink render={<Link href="/team" />} className={NAV_LINK}>
                  {t("team")}
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <LocaleSwitcher />
          <Button variant="ghost" nativeButton={false} render={<Link href="/login" />}>
            {t("login")}
          </Button>
          <Button nativeButton={false} render={<Link href="/register" />}>
            {t("register")}
          </Button>
        </div>

        <MobileNav />
      </Container>
    </header>
  );
}
