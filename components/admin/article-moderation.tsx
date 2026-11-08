"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { archiveArticleAction, restoreArticleAction } from "@/app/[locale]/studio/actions";

// Admin moderation: archive a published article or restore an archived one.
// The server re-checks canArchive / canRestore on every call.
export function ArticleModeration({ id, status, title }: { id: string; status: string; title: string }) {
  const t = useTranslations("AdminArticles");
  const ta = useTranslations("Auth.common");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const archived = status === "ARCHIVED";
  const label = archived ? t("restore") : t("archive");

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending}
      aria-label={`${label}: ${title}`}
      onClick={() =>
        startTransition(async () => {
          const result = archived ? await restoreArticleAction(id) : await archiveArticleAction(id);
          if (result.ok) router.refresh();
        })
      }
    >
      {pending ? ta("submitting") : label}
    </Button>
  );
}
