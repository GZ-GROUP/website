import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { GZLogo } from "@/components/brand/logo";
import { Container } from "@/components/layout/container";

// Entrance: content is visible by default; @starting-style (Tailwind `starting:`)
// only adds the rise on first paint, and reduced-motion collapses it (globals.css).
const RISE =
  "transition-[opacity,translate] duration-500 ease-out-strong starting:translate-y-4 starting:opacity-0";

export function Hero() {
  const t = useTranslations("Hero");

  return (
    <section aria-labelledby="hero-title" className="overflow-hidden">
      <Container
        size="wide"
        className="grid items-center gap-12 py-16 md:py-24 lg:min-h-[36rem] lg:grid-cols-[1.4fr_1fr] lg:py-32"
      >
        <div className="max-w-2xl">
          <h1
            id="hero-title"
            className={`text-3xl font-bold leading-display tracking-display text-balance sm:text-4xl lg:text-5xl ${RISE}`}
          >
            {t("title")}
          </h1>
          <p className={`mt-6 max-w-xl text-base leading-7 text-muted-foreground md:text-xl md:leading-8 delay-75 ${RISE}`}>
            {t("lead")}
          </p>
          <div className={`mt-10 flex flex-col gap-3 sm:flex-row delay-150 ${RISE}`}>
            <Button size="lg" nativeButton={false} render={<Link href="/projects" />}>
              {t("primaryCta")}
            </Button>
            <Button size="lg" variant="outline" nativeButton={false} render={<Link href="/blog" />}>
              {t("secondaryCta")}
            </Button>
          </div>
        </div>

        {/* The brand mark is the hero image: the trail draws itself, then the ship flies in. */}
        <div className="order-first flex justify-start lg:order-none lg:justify-end">
          <GZLogo animated className="h-20 sm:h-28 lg:h-[28rem]" />
        </div>
      </Container>
    </section>
  );
}
