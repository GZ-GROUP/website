"use client";

import { ButtonLink } from "@/components/ui/button-link";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Menu } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { PRIMARY_NAV } from "@/components/layout/nav-config";
import { authClient } from "@/lib/auth/client";

const MENU_LINK =
  "block py-3 text-xl font-bold text-foreground transition-colors duration-150 hover:text-primary-ink";

export function MobileNav() {
  const t = useTranslations("Header");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const { data } = authClient.useSession();
  const user = data?.user;
  const roles = (user?.role ?? "").split(",");
  const isAdmin = roles.includes("admin");
  const isWriter = isAdmin || roles.includes("writer");

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
                  <Link href={item.href} onClick={close} className={MENU_LINK}>
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
                <ButtonLink variant="outline" href="/account" onClick={close}>
                  {t("account")}
                </ButtonLink>
                {isWriter && (
                  <ButtonLink variant="outline" href="/studio" onClick={close}>
                    {t("studio")}
                  </ButtonLink>
                )}
                {isAdmin && (
                  <ButtonLink variant="outline" href="/admin" onClick={close}>
                    {t("admin")}
                  </ButtonLink>
                )}
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
