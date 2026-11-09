import { useFormatter, useTranslations } from "next-intl";
import { Container } from "@/components/layout/container";
import { SiteShell } from "@/components/layout/site-shell";
import { LEGAL_VERSION } from "@/lib/legal/version";

export const LEGAL_LINK = "font-bold text-primary-ink underline underline-offset-4";

/** Legal text in the reading measure. Running text stays in full ink: people need to read this. */
export function LegalPage({ title, lead, children }: { title: string; lead: string; children: React.ReactNode }) {
  const t = useTranslations("Legal");
  const format = useFormatter();
  const updated = new Date(`${LEGAL_VERSION}T12:00:00Z`);

  return (
    <SiteShell mainClassName="py-16 md:py-24">
      <Container size="reading">
        <h1 className="text-3xl font-bold leading-display tracking-display text-balance md:text-4xl">{title}</h1>
        <p className="mt-6 text-xl leading-8 text-pretty">{lead}</p>
        <p className="mt-4 text-base text-muted-foreground">
          {t("updated", { date: format.dateTime(updated, { dateStyle: "long", timeZone: "UTC" }) })}
        </p>
        <div className="mt-12 flex flex-col gap-12">{children}</div>
      </Container>
    </SiteShell>
  );
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-2xl font-bold leading-display tracking-display text-balance">{title}</h2>
      <div className="mt-4 flex flex-col gap-4 text-base leading-7 text-pretty">{children}</div>
    </section>
  );
}

/** The contact address, or a plain phrase when the deployment has not set one yet. */
export function LegalContact({ email, fallback }: { email: string | undefined; fallback: string }) {
  if (!email) return fallback;
  return (
    <a href={`mailto:${email}`} className={LEGAL_LINK}>
      {email}
    </a>
  );
}
