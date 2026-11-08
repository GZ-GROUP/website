import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

type Status = "DRAFT" | "PUBLISHED" | "ARCHIVED";

// One status mark per row: published carries the brand hue, the rest stay quiet.
export function StatusPill({ status, className }: { status: Status; className?: string }) {
  const t = useTranslations("Studio.status");
  return (
    <span
      className={cn(
        "inline-flex flex-none items-center gap-2 whitespace-nowrap text-sm font-bold",
        status === "PUBLISHED" ? "text-primary-ink" : "text-muted-foreground",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "size-2 rounded-full",
          status === "PUBLISHED" ? "bg-primary" : status === "DRAFT" ? "bg-muted-foreground" : "border border-muted-foreground",
        )}
      />
      {t(status)}
    </span>
  );
}
