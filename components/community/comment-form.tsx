"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/forms/form-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { addCommentAction } from "@/app/[locale]/blog/actions";
import { MAX_COMMENT_LENGTH } from "@/lib/community/validation";

/** The limit only appears once it is relevant. */
const SHOW_COUNTER_AT = MAX_COMMENT_LENGTH - 200;

export function CommentForm({
  id,
  articleId,
  parentId = null,
  label,
  submitLabel,
  autoFocus,
  onCancel,
  onDone,
}: {
  id: string;
  articleId: string;
  parentId?: string | null;
  label: string;
  submitLabel: string;
  autoFocus?: boolean;
  onCancel?: () => void;
  onDone?: () => void;
}) {
  const t = useTranslations("Comments");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const sent = body;
    startTransition(async () => {
      // A network failure rejects: show it here instead of the error page.
      const result = await addCommentAction(articleId, sent, parentId).catch(() => null);
      if (!result) {
        setError(t("errors.UNKNOWN"));
      } else if (result.ok) {
        // Anything typed while this was sending belongs to the next comment.
        setBody((current) => (current === sent ? "" : current));
        onDone?.();
      } else {
        setError(t(`errors.${result.error}`));
      }
    });
  }

  const hint =
    body.length >= SHOW_COUNTER_AT ? t("remaining", { count: Math.max(0, MAX_COMMENT_LENGTH - body.length) }) : undefined;

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <FormField id={id} label={label} error={error ?? undefined} hint={hint}>
        {(a11y) => (
          <Textarea
            {...a11y}
            name="body"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            maxLength={MAX_COMMENT_LENGTH}
            required
            autoFocus={autoFocus}
          />
        )}
      </FormField>
      <div className="flex flex-wrap gap-3">
        <SubmitButton pending={pending} pendingLabel={t("submitting")} size="sm">
          {submitLabel}
        </SubmitButton>
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            {t("cancel")}
          </Button>
        )}
      </div>
    </form>
  );
}
