import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ButtonLink } from "@/components/ui/button-link";
import { CommentCard, RemovedComment } from "@/components/community/comment-card";
import { CommentForm } from "@/components/community/comment-form";
import { loginHref } from "@/lib/auth/next-path";
import { canDeleteComment, canComment, type CommunityActor } from "@/lib/community/permissions";
import type { ArticleComments } from "@/lib/community/queries";

// The conversation under an article. Read mode: no boxes around comments, just
// hierarchy and space, so it never competes with the text above it.
export async function CommentSection({
  articleId,
  slug,
  comments,
  actor,
}: {
  articleId: string;
  slug: string;
  comments: ArticleComments;
  actor: CommunityActor | null;
}) {
  const t = await getTranslations("Comments");
  const canPost = actor !== null && canComment(actor, "PUBLISHED");
  const articlePath = `/blog/${slug}`;
  const canDelete = (authorId: string) => actor !== null && canDeleteComment(actor, { authorId });

  return (
    <section id="comments" aria-labelledby="comments-title" className="scroll-mt-24">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h2 id="comments-title" className="text-2xl font-bold leading-display tracking-display">
          {t("title")}
        </h2>
        <p className="text-base text-muted-foreground tabular-nums">{t("count", { count: comments.total })}</p>
      </div>

      <div className="mt-8">
        {canPost ? (
          <CommentForm id="new-comment" articleId={articleId} label={t("label")} submitLabel={t("submit")} />
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-4 bg-muted p-6">
            <p className="text-base">{t("signInLead")}</p>
            <ButtonLink variant="outline" size="sm" href={loginHref(`${articlePath}#comments`)}>
              {t("signIn")}
            </ButtonLink>
          </div>
        )}
      </div>

      {comments.threads.length === 0 ? (
        <p className="mt-10 text-base text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="mt-12 flex flex-col gap-10">
          {comments.threads.map((thread) => (
            <li key={thread.id}>
              {thread.removed ? (
                <RemovedComment />
              ) : (
                <CommentCard
                  comment={thread}
                  articleId={articleId}
                  canReply={canPost}
                  canDelete={canDelete(thread.authorId)}
                />
              )}
              {thread.replies.length > 0 && (
                <ul aria-label={t("replies")} className="mt-6 flex flex-col gap-6 pl-6 sm:pl-13">
                  {thread.replies.map((reply) => (
                    <li key={reply.id}>
                      <CommentCard comment={reply} articleId={articleId} canReply={false} canDelete={canDelete(reply.authorId)} />
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}

      {comments.hasMore && (
        <p className="mt-10">
          <Link
            href={`${articlePath}?comments=${comments.page + 1}#comments`}
            className="text-base font-bold text-primary-ink underline-offset-4 hover:underline"
          >
            {t("loadMore")}
          </Link>
        </p>
      )}
    </section>
  );
}
