"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { CommentForm } from "@/components/community/comment-form";
import { DeleteComment, QUIET_ACTION } from "@/components/community/delete-comment";

/** The controls under a comment. The server re-checks everything they do. */
export function CommentActions({
  articleId,
  commentId,
  authorName,
  canReply,
  canDelete,
}: {
  articleId: string;
  commentId: string;
  authorName: string;
  canReply: boolean;
  canDelete: boolean;
}) {
  const t = useTranslations("Comments");
  const [replying, setReplying] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const replyButton = useRef<HTMLButtonElement>(null);

  function closeReply() {
    setReplying(false);
    // Keyboard users land back where they started.
    requestAnimationFrame(() => replyButton.current?.focus());
  }

  if (!canReply && !canDelete) return null;

  return (
    <div className="mt-2 flex flex-col gap-4">
      <div className="-ml-3 flex flex-wrap items-center gap-1">
        {canReply && !confirmingDelete && (
          <Button
            ref={replyButton}
            variant="ghost"
            size="xs"
            className={QUIET_ACTION}
            aria-expanded={replying}
            aria-label={t("replyTo", { name: authorName })}
            onClick={() => setReplying((open) => !open)}
          >
            {t("reply")}
          </Button>
        )}
        {canDelete && <DeleteComment id={commentId} authorName={authorName} onOpenChange={setConfirmingDelete} />}
      </div>
      {replying && (
        <CommentForm
          id={`reply-${commentId}`}
          articleId={articleId}
          parentId={commentId}
          label={t("replyLabel", { name: authorName })}
          submitLabel={t("reply")}
          autoFocus
          onCancel={closeReply}
          onDone={closeReply}
        />
      )}
    </div>
  );
}
