import { ButtonLink } from "@/components/ui/button-link";
import { useTranslations } from "next-intl";
import { SiteShell } from "@/components/layout/site-shell";
import { Container } from "@/components/layout/container";

export default function NotFound() {
  const t = useTranslations("NotFound");

  return (
    <SiteShell mainClassName="flex items-center py-24 md:py-32">
      <Container size="reading">
        <h1 className="text-3xl font-bold leading-display tracking-display text-balance md:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-6 text-base leading-7 text-muted-foreground">{t("body")}</p>
        <ButtonLink className="mt-10" href="/">
          {t("home")}
        </ButtonLink>
      </Container>
    </SiteShell>
  );
}
