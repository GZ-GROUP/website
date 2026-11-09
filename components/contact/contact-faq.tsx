import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { site } from "@/lib/site";

const QUESTIONS = ["what", "account", "participate", "photo", "github", "code", "data"] as const;

export function ContactFaq() {
  const t = useTranslations("Contact.faq");

  return (
    <section aria-labelledby="faq-title">
      <h2 id="faq-title" className="text-2xl font-bold leading-display tracking-display">
        {t("title")}
      </h2>
      <Accordion className="mt-6">
        {QUESTIONS.map((id) => (
          <AccordionItem key={id} value={id} className="border-border">
            <AccordionTrigger className="text-base font-bold">{t(`${id}.q`)}</AccordionTrigger>
            <AccordionContent className="text-base leading-7">
              {t.rich(`${id}.a`, {
                privacy: (text) => <Link href="/privacy">{text}</Link>,
                github: (text) => (
                  <a href={site.githubUrl} target="_blank" rel="noopener noreferrer">
                    {text}
                  </a>
                ),
              })}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
