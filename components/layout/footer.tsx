import { useTranslations } from "next-intl";
import { ArrowUpRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { GZLogo } from "@/components/brand/logo";
import { Container } from "@/components/layout/container";
import { PRIMARY_NAV } from "@/components/layout/nav-config";
import { site } from "@/lib/site";

const FOOTER_LINK = "text-base text-muted-foreground transition-colors duration-150 hover:text-foreground";

export function Footer() {
  const t = useTranslations("Footer");
  const th = useTranslations("Header");
  const year = new Date().getFullYear();

  return (
    <footer className="bg-card text-card-foreground">
      <Container size="wide" className="py-16 md:py-20">
        <div className="grid gap-12 sm:grid-cols-3 lg:grid-cols-[2fr_1fr_1fr_1fr]">
          <div className="max-w-sm sm:col-span-3 lg:col-span-1">
            <div className="flex items-center gap-3">
              <GZLogo className="h-10" />
              <span className="text-xl font-bold">GZ Group</span>
            </div>
            <p className="mt-6 text-base leading-7 text-muted-foreground">{t("tagline")}</p>
          </div>

          <nav aria-label={t("explore")}>
            <h2 className="text-base font-bold">{t("explore")}</h2>
            <ul className="mt-4 space-y-3">
              {PRIMARY_NAV.map((item) => (
                <li key={item.key}>
                  <Link href={item.href} className={FOOTER_LINK}>
                    {th(item.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label={t("community")}>
            <h2 className="text-base font-bold">{t("community")}</h2>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/register" className={FOOTER_LINK}>
                  {th("register")}
                </Link>
              </li>
              <li>
                <Link href="/login" className={FOOTER_LINK}>
                  {th("login")}
                </Link>
              </li>
              <li>
                <a
                  href={site.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${FOOTER_LINK} inline-flex items-center gap-1`}
                >
                  GitHub
                  <ArrowUpRight className="size-4" aria-hidden />
                </a>
              </li>
            </ul>
          </nav>

          <nav aria-label={t("legal")}>
            <h2 className="text-base font-bold">{t("legal")}</h2>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/privacy" className={FOOTER_LINK}>
                  {t("privacy")}
                </Link>
              </li>
              <li>
                <Link href="/terms" className={FOOTER_LINK}>
                  {t("terms")}
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <p className="mt-16 text-sm text-muted-foreground">{t("copyright", { year })}</p>
      </Container>
    </footer>
  );
}
