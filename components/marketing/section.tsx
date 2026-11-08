import { cn } from "@/lib/utils";
import { Container } from "@/components/layout/container";

type SectionProps = {
  id: string;
  title: string;
  children: React.ReactNode;
  /** Field colour for the whole band. Surfaces change by tone, never by lines. */
  tone?: "background" | "card";
  className?: string;
  /** Lay the heading in a left column (lg+) instead of above the content. */
  aside?: boolean;
};

// Landing section frame: one heading per section, consistent rhythm and width.
export function Section({ id, title, children, tone = "background", className, aside = false }: SectionProps) {
  const headingId = `${id}-title`;

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn("py-24 md:py-32", tone === "card" && "bg-card text-card-foreground", className)}
    >
      <Container size="wide" className={cn(aside && "grid gap-12 lg:grid-cols-[1fr_2fr] lg:gap-16")}>
        <h2 id={headingId} className="reveal text-2xl font-bold leading-display tracking-display text-balance md:text-3xl">
          {title}
        </h2>
        <div className={cn(!aside && "mt-12 md:mt-16")}>{children}</div>
      </Container>
    </section>
  );
}
