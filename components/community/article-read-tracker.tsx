"use client";

import { useEffect } from "react";
import { recordReadAction } from "@/app/[locale]/blog/actions";

// Records the visit from the browser rather than during render, so prefetches
// and crawlers never count as reads. Rendered for signed-in users only.
export function ArticleReadTracker({ articleId }: { articleId: string }) {
  useEffect(() => {
    void recordReadAction(articleId);
  }, [articleId]);
  return null;
}
