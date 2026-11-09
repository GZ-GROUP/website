"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { FormField } from "@/components/forms/form-field";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { updateProfile, type FormState } from "@/app/[locale]/account/actions";
import { OCCUPATIONS } from "@/lib/validation/limits";
import { USERNAME_MAX, USERNAME_MIN } from "@/lib/auth/usernames";

type ProfileFormProps = {
  defaults: {
    name: string;
    username: string;
    bio: string;
    description: string;
    occupation: string;
  };
};

const initial: FormState = { status: "idle" };

export function ProfileForm({ defaults }: ProfileFormProps) {
  const t = useTranslations("Account.profile");
  const ta = useTranslations("Auth.common");
  const te = useTranslations("AuthErrors");
  const to = useTranslations("Occupation");
  const [state, action, pending] = useActionState(updateProfile, initial);
  const fieldError = (name: string) => {
    const key = state.fieldErrors?.[name];
    return key ? te(key) : undefined;
  };

  return (
    <form action={action} className="flex flex-col gap-6">
      {state.status === "success" && <FormMessage tone="success">{t("saved")}</FormMessage>}
      {state.error && <FormMessage tone="error">{te(state.error)}</FormMessage>}

      <FormField id="name" label={t("name")} error={fieldError("name")}>
        {(a11y) => <Input {...a11y} name="name" defaultValue={defaults.name} autoComplete="name" required maxLength={80} />}
      </FormField>

      <FormField
        id="username"
        label={t("username")}
        hint={t("usernameHint", { username: defaults.username || "…" })}
        error={fieldError("username")}
      >
        {(a11y) => (
          <Input
            {...a11y}
            name="username"
            defaultValue={defaults.username}
            required
            minLength={USERNAME_MIN}
            maxLength={USERNAME_MAX}
            autoCapitalize="none"
            spellCheck={false}
          />
        )}
      </FormField>

      <FormField id="occupation" label={t("occupation")} error={fieldError("occupation")}>
        {(a11y) => (
          <NativeSelect {...a11y} name="occupation" defaultValue={defaults.occupation}>
            <NativeSelectOption value="">{t("occupationNone")}</NativeSelectOption>
            {OCCUPATIONS.map((value) => (
              <NativeSelectOption key={value} value={value}>
                {to(value)}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        )}
      </FormField>

      <FormField id="bio" label={t("bio")} hint={t("bioHint")} error={fieldError("bio")}>
        {(a11y) => <Input {...a11y} name="bio" defaultValue={defaults.bio} maxLength={280} />}
      </FormField>

      <FormField id="description" label={t("description")} hint={t("descriptionHint")} error={fieldError("description")}>
        {(a11y) => <Textarea {...a11y} name="description" defaultValue={defaults.description} maxLength={2000} rows={5} />}
      </FormField>

      <SubmitButton pending={pending} pendingLabel={ta("submitting")} className="self-start">
        {t("save")}
      </SubmitButton>
    </form>
  );
}
