"use client";

import { ButtonLink } from "@/components/ui/button-link";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Menu, Pencil, Settings, User } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { PRIMARY_NAV } from "@/components/layout/nav-config";
import { authClient } from "@/lib/auth/client";
import { ripple } from "@/lib/ui/ripple";

const MENU_LINK =
  "relative -mx-3 block overflow-hidden px-3 py-3 text-xl font-bold text-foreground transition-colors duration-150 hover:bg-popover-hover hover:text-primary-ink";

export function MobileNav() {
  const t = useTranslations("Header");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const { data } = authClient.useSession();
  const user = data?.user;
  const roles = (user?.role ?? "").split(",");
  const isWriter = roles.includes("admin") || roles.includes("writer");

  return (
    <div className="flex items-center gap-1 lg:hidden">
      <LocaleSwitcher />
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger render={<Button variant="ghost" size="icon" aria-label={t("openMenu")} />}>
          <Menu className="size-5" />
        </SheetTrigger>
        <SheetContent side="right" closeLabel={t("closeMenu")} className="gap-8 p-6">
          <SheetTitle>{t("menuTitle")}</SheetTitle>
          <nav aria-label={t("primaryNav")}>
            <ul className="flex flex-col">
              {PRIMARY_NAV.map((item) => (
                <li key={item.key}>
                  <Link href={item.href} onClick={close} onPointerDown={ripple} className={MENU_LINK}>
                    {t(item.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="mt-auto flex flex-col gap-3">
            {user ? (
              <>
                <p className="text-sm text-muted-foreground">{user.name}</p>
                {user.username && (
                  <ButtonLink variant="outline" href={`/u/${user.username}`} onClick={close}>
                    <User data-icon="inline-start" aria-hidden />
                    {t("profile")}
                  </ButtonLink>
                )}
                {isWriter && (
                  <ButtonLink variant="outline" href="/studio" onClick={close}>
                    <Pencil data-icon="inline-start" aria-hidden />
                    {t("studio")}
                  </ButtonLink>
                )}
                <ButtonLink variant="outline" href="/account" onClick={close}>
                  <Settings data-icon="inline-start" aria-hidden />
                  {t("account")}
                </ButtonLink>
                <Button
                  variant="ghost"
                  onClick={async () => {
                    close();
                    await authClient.signOut();
                    router.replace("/");
                    router.refresh();
                  }}
                >
                  {t("signOut")}
                </Button>
              </>
            ) : (
              <>
                <ButtonLink href="/register" onClick={close}>
                  {t("register")}
                </ButtonLink>
                <ButtonLink variant="outline" href="/login" onClick={close}>
                  {t("login")}
                </ButtonLink>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
