import Image from "next/image";
import { useTranslations } from "next-intl";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/layout/container";
import mascot from "@/public/brand/mascot-community.png";

// An invitation to meet the members, led by the GZ Group mascot.
export function FeaturedMembers() {
  const t = useTranslations("Home.members");

  return (
    <section id="members" aria-labelledby="members-title" className="py-24 md:py-32">
      <Container size="wide" className="grid items-center gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
        <div className="reveal">
          <h2 id="members-title" className="text-2xl font-bold leading-display tracking-display text-balance md:text-3xl">
            {t("title")}
          </h2>
          <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground md:text-xl md:leading-8">{t("body")}</p>
          <ButtonLink size="lg" className="mt-10" href="/team">
            {t("cta")}
          </ButtonLink>
        </div>
        <div className="reveal flex justify-center lg:justify-end">
          {/* The source is 298px wide: never shown larger than that. */}
          <Image src={mascot} alt={t("mascotAlt")} sizes="(min-width: 768px) 288px, 224px" className="h-auto w-56 md:w-72" />
        </div>
      </Container>
    </section>
  );
}
