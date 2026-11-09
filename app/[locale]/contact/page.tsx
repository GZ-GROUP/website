import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import type { AppLocale } from "@/i18n/routing";
import { pageMetadata } from "@/lib/seo/metadata";
import { Container } from "@/components/layout/container";
import { SiteShell } from "@/components/layout/site-shell";
import { ContactFaq } from "@/components/contact/contact-faq";
import { ContactForm } from "@/components/contact/contact-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Contact");
  return pageMetadata({ title: t("metaTitle"), description: t("metaDescription"), path: "/contact", locale: (await getLocale()) as AppLocale });
}

export default async function ContactPage() {
  const t = await getTranslations("Contact");

  return (
    <SiteShell mainClassName="py-16 md:py-24">
      <Container size="reading">
        <h1 className="text-3xl font-bold leading-display tracking-display text-balance md:text-4xl">{t("title")}</h1>
        <p className="mt-6 text-xl leading-8 text-pretty">{t("lead")}</p>
        <div className="mt-12">
          <ContactForm />
        </div>
        <div className="mt-24">
          <ContactFaq />
        </div>
      </Container>
    </SiteShell>
  );
}
