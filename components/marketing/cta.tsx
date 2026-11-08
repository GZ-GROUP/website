import { useTranslations } from "next-intl";
import { ArrowUpRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { site } from "@/lib/site";

// The one full field of brand colour on the page. Buttons invert onto it.
export function CallToAction() {
  const t = useTranslations("Home.cta");

  return (
    <section aria-labelledby="cta-title" className="bg-primary text-primary-foreground">
      <Container size="wide" className="grid gap-10 py-24 md:py-32 lg:grid-cols-[1.4fr_1fr] lg:items-end">
        <div className="reveal">
          <h2 id="cta-title" className="text-2xl font-bold leading-display tracking-display text-balance md:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-6 max-w-xl text-base leading-7 md:text-xl md:leading-8">{t("body")}</p>
        </div>
        <div className="reveal flex flex-col gap-3 sm:flex-row lg:justify-end">
          <Button
            size="lg"
            nativeButton={false}
            render={<Link href="/register" />}
            className="bg-background text-foreground hover:bg-background/85 focus-visible:outline-primary-foreground"
          >
            {t("primary")}
          </Button>
          <Button
            size="lg"
            variant="outline"
            nativeButton={false}
            render={<a href={site.githubUrl} target="_blank" rel="noopener noreferrer" />}
            className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground focus-visible:outline-primary-foreground"
          >
            {t("secondary")}
            <ArrowUpRight data-icon="inline-end" aria-hidden />
          </Button>
        </div>
      </Container>
    </section>
  );
}
