import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VerifiedBadge } from "@/components/shared/verified-badge";
import { CommentActions } from "@/components/community/comment-actions";
import type { VisibleComment } from "@/lib/community/threads";
import { cn } from "@/lib/utils";

/** A comment as plain text: `body` is never interpreted as HTML. */
export function CommentCard({
  comment,
  articleId,
  canReply,
  canDelete,
}: {
  comment: VisibleComment;
  articleId: string;
  canReply: boolean;
  canDelete: boolean;
}) {
  const format = useFormatter();
  const { author } = comment;

  return (
    <article
      id={`comment-${comment.id}`}
      className={cn(
        "flex scroll-mt-24 gap-3",
        comment.fresh && "transition-[opacity,translate] duration-200 ease-out-strong starting:translate-y-1 starting:opacity-0",
      )}
    >
      <Avatar aria-hidden>
        {author.avatarUrl && <AvatarImage src={author.avatarUrl} alt="" />}
        <AvatarFallback>{author.displayName.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <header className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {author.username ? (
            <Link href={`/u/${author.username}`} className="font-bold hover:text-primary-ink">
              {author.displayName}
            </Link>
          ) : (
            <span className="font-bold">{author.displayName}</span>
          )}
          {author.verifications.map((provider) => (
            <VerifiedBadge key={provider} provider={provider} />
          ))}
          <time dateTime={comment.createdAt.toISOString()} className="text-sm text-muted-foreground tabular-nums">
            {format.dateTime(comment.createdAt, { dateStyle: "medium" })}
          </time>
        </header>
        <p className="mt-2 text-base leading-7 wrap-anywhere whitespace-pre-line">{comment.body}</p>
        <CommentActions
          articleId={articleId}
          commentId={comment.id}
          authorName={author.displayName}
          canReply={canReply}
          canDelete={canDelete}
        />
      </div>
    </article>
  );
}

export function RemovedComment() {
  const t = useTranslations("Comments");
  return <p className="text-base text-muted-foreground">{t("removed")}</p>;
}
