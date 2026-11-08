import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  /** Heading level for the title, to fit the surrounding outline. */
  as?: "h2" | "h3" | "p";
};

// Shown wherever a data-driven list has no items. Never leave an empty gap.
export function EmptyState({ title, description, action, className, as: Title = "h3" }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-8 bg-muted p-8 md:flex-row md:items-end md:justify-between md:gap-12 md:p-12",
        className,
      )}
    >
      <div>
        <Title className="text-xl font-bold text-foreground md:text-2xl">{title}</Title>
        {description && <p className="mt-3 max-w-prose text-base leading-7 text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
