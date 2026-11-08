import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { GZLogo } from "@/components/brand/logo";
import { Container } from "@/components/layout/container";
import { HeaderNav } from "@/components/layout/header-nav";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { MobileNav } from "@/components/layout/mobile-nav";
import { UserMenu } from "@/components/layout/user-menu";

export function Header() {
  const t = useTranslations("Header");

  return (
    <header className="bg-background">
      <Container size="wide" className="flex h-16 items-center justify-between gap-6">
        <div className="flex items-center gap-8">
          <Link href="/" aria-label={t("homeLabel")} className="flex items-center gap-3">
            <GZLogo className="h-8" />
            <span className="text-base font-bold text-foreground">GZ Group</span>
          </Link>
          <HeaderNav />
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <LocaleSwitcher />
          <UserMenu />
        </div>

        <MobileNav />
      </Container>
    </header>
  );
}
