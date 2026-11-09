"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/forms/form-field";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { sendContactMessage, type ContactState } from "@/app/[locale]/contact/actions";
import { CONTACT_LIMITS as L, CONTACT_REASONS } from "@/lib/contact/limits";

const initial: ContactState = { status: "idle" };

/** Remounting the form is what clears it for another message. */
export function ContactForm() {
  const [attempt, setAttempt] = useState(0);
  return <Form key={attempt} onSendAnother={() => setAttempt((n) => n + 1)} />;
}

function Form({ onSendAnother }: { onSendAnother: () => void }) {
  const t = useTranslations("Contact.form");
  const [state, action, pending] = useActionState(sendContactMessage, initial);
  const typed = (name: string) => state.values?.[name] ?? "";
  const fieldError = (name: string) => {
    const key = state.fieldErrors?.[name];
    return key ? t(`errors.${key}`) : undefined;
  };

  if (state.status === "success") {
    return (
      <div className="flex flex-col items-start gap-6">
        <FormMessage tone="success">{t("success")}</FormMessage>
        <Button variant="outline" onClick={onSendAnother}>
          {t("sendAnother")}
        </Button>
      </div>
    );
  }

  const consentError = fieldError("consent");

  return (
    <form action={action} noValidate className="flex flex-col gap-6">
      {state.error && <FormMessage tone="error">{t(`errors.${state.error}`)}</FormMessage>}

      <div className="grid gap-6 sm:grid-cols-2">
        <FormField id="name" label={t("name")} error={fieldError("name")}>
          {(a11y) => <Input {...a11y} name="name" defaultValue={typed("name")} autoComplete="name" required maxLength={L.name} />}
        </FormField>
        <FormField id="email" label={t("email")} error={fieldError("email")}>
          {(a11y) => (
            <Input {...a11y} name="email" type="email" defaultValue={typed("email")} autoComplete="email" required maxLength={L.email} />
          )}
        </FormField>
        <FormField id="phone" label={t("phone")} error={fieldError("phone")}>
          {(a11y) => <Input {...a11y} name="phone" type="tel" defaultValue={typed("phone")} autoComplete="tel" maxLength={L.phone} />}
        </FormField>
        <FormField id="organization" label={t("organization")} error={fieldError("organization")}>
          {(a11y) => (
            <Input
              {...a11y}
              name="organization"
              defaultValue={typed("organization")}
              autoComplete="organization"
              maxLength={L.organization}
            />
          )}
        </FormField>
      </div>

      <FormField id="reason" label={t("reason")} error={fieldError("reason")}>
        {(a11y) => (
          <NativeSelect {...a11y} name="reason" defaultValue={typed("reason")} required>
            <NativeSelectOption value="" disabled>
              {t("reasonPlaceholder")}
            </NativeSelectOption>
            {CONTACT_REASONS.map((reason) => (
              <NativeSelectOption key={reason} value={reason}>
                {t(`reasons.${reason}`)}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        )}
      </FormField>

      <FormField id="subject" label={t("subject")} error={fieldError("subject")}>
        {(a11y) => <Input {...a11y} name="subject" defaultValue={typed("subject")} required maxLength={L.subject} />}
      </FormField>

      <FormField id="message" label={t("message")} error={fieldError("message")}>
        {(a11y) => <Textarea {...a11y} name="message" defaultValue={typed("message")} required maxLength={L.message} rows={6} />}
      </FormField>

      {/* Invisible to people; bots that fill every field reveal themselves here. */}
      <div aria-hidden className="absolute -left-[9999px]">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="flex flex-col gap-2">
        <label className="flex items-start gap-3 text-base leading-6">
          <input
            type="checkbox"
            name="consent"
            defaultChecked={typed("consent") === "on"}
            aria-invalid={consentError ? true : undefined}
            aria-describedby={consentError ? "consent-error" : undefined}
            className="mt-1 size-4 shrink-0 accent-primary"
          />
          <span>
            {t.rich("consent", {
              privacy: (text) => (
                <Link href="/privacy" className="font-bold text-primary-ink underline underline-offset-4">
                  {text}
                </Link>
              ),
            })}
          </span>
        </label>
        {consentError && (
          <p id="consent-error" className="text-sm text-destructive">
            {consentError}
          </p>
        )}
      </div>

      <SubmitButton pending={pending} pendingLabel={t("submitting")} className="self-start">
        {t("submit")}
      </SubmitButton>
    </form>
  );
}
