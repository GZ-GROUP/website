import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import type { AppLocale } from "@/i18n/routing";
import { pageMetadata } from "@/lib/seo/metadata";
import { Link } from "@/i18n/navigation";
import { LEGAL_LINK, LegalContact, LegalPage, LegalSection } from "@/components/legal/legal-page";
import { serverEnv } from "@/lib/env";

// The contact address is a runtime variable, unavailable when the image is built.
export const dynamic = "force-dynamic";

const PLAIN = ["service", "account", "conduct", "moderation", "intellectual", "links", "liability"] as const;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Legal.terms");
  return pageMetadata({ title: t("metaTitle"), description: t("metaDescription"), path: "/terms", locale: (await getLocale()) as AppLocale });
}

export default async function TermsPage() {
  const t = await getTranslations("Legal.terms");
  const tl = await getTranslations("Legal");
  const contact = <LegalContact email={serverEnv().LEGAL_CONTACT_EMAIL} fallback={tl("noContact")} />;

  return (
    <LegalPage title={t("title")} lead={t("lead")}>
      <LegalSection title={t("content.title")}>
        <p>{t("content.body")}</p>
        <p>{t("content.body2")}</p>
      </LegalSection>

      {PLAIN.map((id) => (
        <LegalSection key={id} title={t(`${id}.title`)}>
          <p>{t(`${id}.body`)}</p>
        </LegalSection>
      ))}

      <LegalSection title={t("privacy.title")}>
        <p>
          {t.rich("privacy.body", {
            link: (text) => (
              <Link href="/privacy" className={LEGAL_LINK}>
                {text}
              </Link>
            ),
          })}
        </p>
      </LegalSection>

      <LegalSection title={t("changes.title")}>
        <p>{t("changes.body")}</p>
      </LegalSection>

      <LegalSection title={t("law.title")}>
        <p>{t.rich("law.body", { contact: () => contact })}</p>
      </LegalSection>
    </LegalPage>
  );
}
