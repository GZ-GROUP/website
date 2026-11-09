import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const LINK = "font-bold text-primary-ink underline underline-offset-4";

/** Tells people what they accept at the moment their account is created. */
export function LegalNotice({ messageKey }: { messageKey: "register.legal" | "login.legal" }) {
  const t = useTranslations("Auth");

  return (
    <p className="text-sm leading-6 text-muted-foreground">
      {t.rich(messageKey, {
        terms: (text) => (
          <Link href="/terms" className={LINK}>
            {text}
          </Link>
        ),
        privacy: (text) => (
          <Link href="/privacy" className={LINK}>
            {text}
          </Link>
        ),
      })}
    </p>
  );
}
