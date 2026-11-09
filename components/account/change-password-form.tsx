"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/forms/form-field";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { changePassword, type FormState } from "@/app/[locale]/account/actions";
import { PASSWORD_MAX, PASSWORD_MIN } from "@/lib/validation/limits";

const initial: FormState = { status: "idle" };

export function ChangePasswordForm() {
  const t = useTranslations("Password");
  const ta = useTranslations("Auth.common");
  const te = useTranslations("AuthErrors");
  const [state, action, pending] = useActionState(changePassword, initial);
  const fieldError = (name: string) => {
    const key = state.fieldErrors?.[name];
    return key ? te(key) : undefined;
  };

  return (
    <form action={action} className="flex flex-col gap-6">
      {state.error && <FormMessage tone="error">{te(state.error)}</FormMessage>}

      <FormField id="currentPassword" label={t("current")} error={fieldError("currentPassword")}>
        {(a11y) => (
          <Input {...a11y} name="currentPassword" type="password" autoComplete="current-password" required />
        )}
      </FormField>

      <FormField id="newPassword" label={t("next")} hint={t("hint")} error={fieldError("newPassword")}>
        {(a11y) => (
          <Input
            {...a11y}
            name="newPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={PASSWORD_MIN}
            maxLength={PASSWORD_MAX}
          />
        )}
      </FormField>

      <FormField id="confirmPassword" label={t("confirm")} error={fieldError("confirmPassword")}>
        {(a11y) => <Input {...a11y} name="confirmPassword" type="password" autoComplete="new-password" required />}
      </FormField>

      <SubmitButton pending={pending} pendingLabel={ta("submitting")} className="self-start">
        {t("submit")}
      </SubmitButton>
    </form>
  );
}
