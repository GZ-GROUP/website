"use client";

import { useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { deleteCommentAction } from "@/app/[locale]/blog/actions";

/** Secondary comment controls: quiet on desktop, a thumb-sized target on phones. */
export const QUIET_ACTION = "normal-case tracking-normal text-sm font-normal text-muted-foreground max-sm:h-10";

/** Two steps in place: a dialog would be more interruption than this deserves. */
export function DeleteComment({ id, authorName, onOpenChange }: { id: string; authorName: string; onOpenChange?: (open: boolean) => void }) {
  const t = useTranslations("Comments");
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const trigger = useRef<HTMLButtonElement>(null);

  function setOpen(open: boolean) {
    setConfirming(open);
    onOpenChange?.(open);
    // Cancelling returns keyboard users to the button they started from.
    if (!open) requestAnimationFrame(() => trigger.current?.focus());
  }

  if (!confirming) {
    return (
      <Button
        ref={trigger}
        variant="ghost"
        size="xs"
        className={QUIET_ACTION}
        aria-label={t("deleteFrom", { name: authorName })}
        onClick={() => setOpen(true)}
      >
        {t("delete")}
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 pl-3" role="group" aria-label={t("confirmDelete")}>
      <span className="text-sm">{t("confirmDelete")}</span>
      <Button
        variant="destructive"
        size="xs"
        autoFocus
        disabled={pending}
        className="text-sm tracking-normal normal-case max-sm:h-10"
        onClick={() =>
          startTransition(async () => {
            setError(null);
            // A network failure rejects: show it here instead of the error page.
            const result = await deleteCommentAction(id).catch(() => null);
            if (!result) setError(t("errors.UNKNOWN"));
            else if (!result.ok) setError(t(`errors.${result.error}`));
          })
        }
      >
        {pending ? t("deleting") : t("confirm")}
      </Button>
      <Button variant="ghost" size="xs" className={QUIET_ACTION} disabled={pending} onClick={() => setOpen(false)}>
        {t("cancel")}
      </Button>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
