import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LEGAL_LINK, LegalContact, LegalPage, LegalSection } from "@/components/legal/legal-page";
import { serverEnv } from "@/lib/env";

// The contact address is a runtime variable, unavailable when the image is built.
export const dynamic = "force-dynamic";

const TREATMENTS = ["account", "profile", "activity", "reading", "linked", "technical"] as const;
const FIELDS = ["data", "purpose", "basis", "retention"] as const;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Legal.privacy");
  return { title: t("metaTitle"), description: t("lead") };
}

export default async function PrivacyPage() {
  const t = await getTranslations("Legal.privacy");
  const tl = await getTranslations("Legal");
  const contact = <LegalContact email={serverEnv().LEGAL_CONTACT_EMAIL} fallback={tl("noContact")} />;

  return (
    <LegalPage title={t("title")} lead={t("lead")}>
      <LegalSection title={t("controller.title")}>
        <p>{t.rich("controller.body", { contact: () => contact })}</p>
      </LegalSection>

      <LegalSection title={t("treatments.title")}>
        <div className="flex flex-col gap-8">
          {TREATMENTS.map((id) => (
            <div key={id}>
              <h3 className="text-xl font-bold">{t(`treatments.${id}.name`)}</h3>
              <dl className="mt-3 flex flex-col gap-3">
                {FIELDS.map((field) => (
                  <div key={field} className="grid gap-1 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-4">
                    <dt className="text-base text-muted-foreground">{t(`treatments.labels.${field}`)}</dt>
                    <dd>{t(`treatments.${id}.${field}`)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </LegalSection>

      <LegalSection title={t("recipients.title")}>
        <p>{t("recipients.body")}</p>
        <p>{t("recipients.body2")}</p>
      </LegalSection>

      <LegalSection title={t("cookies.title")}>
        <p>{t("cookies.body")}</p>
      </LegalSection>

      <LegalSection title={t("rights.title")}>
        <p>{t("rights.body")}</p>
        <p>{t.rich("rights.body2", { contact: () => contact })}</p>
        <p>
          {t.rich("rights.body3", {
            antai: (text) => (
              <a
                href="https://www.antai.gob.pa/direccion-de-proteccion-de-datos-personales/"
                target="_blank"
                rel="noopener noreferrer"
                className={LEGAL_LINK}
              >
                {text}
              </a>
            ),
          })}
        </p>
      </LegalSection>

      {(["automated", "minors", "security", "changes"] as const).map((id) => (
        <LegalSection key={id} title={t(`${id}.title`)}>
          <p>{t(`${id}.body`)}</p>
        </LegalSection>
      ))}
    </LegalPage>
  );
}
