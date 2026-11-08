import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Section } from "@/components/marketing/section";
import { SHOWCASE_CATEGORIES, categoryHref } from "@/components/layout/nav-config";

// The three showcase categories are real product structure, so this section
// has true content even before anything is published.
export function WhatWePublish() {
  const t = useTranslations("Home.publish");
  const tc = useTranslations("Categories");

  return (
    <Section id="publish" title={t("title")} aside>
      <ul className="flex flex-col gap-2">
        {SHOWCASE_CATEGORIES.map(({ slug, icon: Icon }) => (
          <li key={slug} className="reveal">
            <Link
              href={categoryHref(slug)}
              className="group grid grid-cols-[auto_1fr_auto] items-start gap-x-6 gap-y-2 py-6 transition-colors duration-150 md:py-8"
            >
              <Icon className="mt-1.5 size-6 text-primary-ink md:size-7" aria-hidden />
              <span className="text-2xl font-bold transition-colors duration-150 group-hover:text-primary-ink md:text-3xl">
                {tc(`${slug}.title`)}
              </span>
              <ArrowRight
                className="mt-2 size-6 text-muted-foreground transition-transform duration-150 ease-out group-hover:translate-x-1 group-hover:text-primary-ink"
                aria-hidden
              />
              <span className="col-start-2 max-w-xl text-base leading-7 text-muted-foreground">
                {tc(`${slug}.description`)}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <p className="reveal mt-10 flex flex-wrap items-baseline gap-x-3 gap-y-2 text-base leading-7 text-muted-foreground">
        {t("editorial")}
        <Link href="/blog" className="font-bold text-primary-ink underline underline-offset-4 hover:no-underline">
          {t("editorialCta")}
        </Link>
      </p>
    </Section>
  );
}
