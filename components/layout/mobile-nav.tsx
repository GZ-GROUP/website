"use client";

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
  const isAdmin = (user?.role ?? "").split(",").includes("admin");

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
                <Button variant="outline" nativeButton={false} render={<Link href="/account" onClick={close} />}>
                  {t("account")}
                </Button>
                {isAdmin && (
                  <Button variant="outline" nativeButton={false} render={<Link href="/admin" onClick={close} />}>
                    {t("admin")}
                  </Button>
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
                <Button nativeButton={false} render={<Link href="/register" onClick={close} />}>
                  {t("register")}
                </Button>
                <Button variant="outline" nativeButton={false} render={<Link href="/login" onClick={close} />}>
                  {t("login")}
                </Button>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
