"use client";

import { startTransition, useOptimistic, useState } from "react";
import { useTranslations } from "next-intl";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { setLikeAction } from "@/app/[locale]/blog/actions";
import { loginHref } from "@/lib/auth/next-path";
import { ripple } from "@/lib/ui/ripple";
import { cn } from "@/lib/utils";

type LikeState = { liked: boolean; count: number };

const CONTENT = "normal-case tracking-normal text-base font-bold";

function Count({ value }: { value: number }) {
  return <span className="tabular-nums">{value}</span>;
}

/** The article's single call to react. Responds instantly; the server confirms. */
export function ArticleReaction({
  articleId,
  initial,
  signedIn,
  returnTo,
}: {
  articleId: string;
  initial: LikeState;
  signedIn: boolean;
  returnTo: string;
}) {
  const t = useTranslations("Reactions");
  const tc = useTranslations("Comments.errors");
  const [confirmed, setConfirmed] = useState(initial);
  const [optimistic, setOptimistic] = useOptimistic(confirmed);
  const [failed, setFailed] = useState(false);

  if (!signedIn) {
    return (
      <ButtonLink variant="outline" href={loginHref(returnTo)} className={CONTENT}>
        <Heart className="size-4" aria-hidden />
        {t("like")}
        <Count value={initial.count} />
        <span className="sr-only">, {t("signIn")}</span>
      </ButtonLink>
    );
  }

  function toggle() {
    const liked = !optimistic.liked;
    setFailed(false);
    startTransition(async () => {
      setOptimistic({ liked, count: Math.max(0, optimistic.count + (liked ? 1 : -1)) });
      const result = await setLikeAction(articleId, liked).catch(() => null);
      if (result?.ok) setConfirmed({ liked: result.liked, count: result.count });
      else setFailed(true); // the optimistic value reverts when the transition ends
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      <Button
        variant="outline"
        aria-pressed={optimistic.liked}
        onClick={toggle}
        onPointerDown={ripple}
        className={cn(CONTENT, "relative overflow-hidden", optimistic.liked && "border-primary-ink text-primary-ink")}
      >
        <Heart
          className={cn(
            "size-4 fill-transparent transition-[fill,scale] duration-150 ease-out-strong group-active/button:scale-90",
            optimistic.liked && "fill-current",
          )}
          aria-hidden
        />
        {t("like")}
        <Count value={optimistic.count} />
      </Button>
      <p role="status" className="text-sm text-destructive">
        {failed ? tc("UNKNOWN") : ""}
      </p>
    </div>
  );
}
