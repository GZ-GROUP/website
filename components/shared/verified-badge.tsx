import { useTranslations } from "next-intl";
import { BadgeCheck } from "lucide-react";
import type { AuthProvider } from "@/lib/generated/prisma/enums";
import { cn } from "@/lib/utils";

// Brand names are proper nouns: not translated.
const PROVIDER_LABEL: Record<AuthProvider, string> = {
  GITHUB: "GitHub",
  LINKEDIN: "LinkedIn",
};

type VerifiedBadgeProps = {
  provider: AuthProvider;
  className?: string;
};

/**
 * States that an external provider confirmed this person's identity.
 * Verification ≠ authentication ≠ role: this badge never implies permissions.
 */
export function VerifiedBadge({ provider, className }: VerifiedBadgeProps) {
  const t = useTranslations("Verification");
  const label = PROVIDER_LABEL[provider];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 bg-secondary px-2 py-1 text-sm font-bold text-secondary-foreground",
        className,
      )}
    >
      <BadgeCheck className="size-3.5 text-primary-ink" aria-hidden />
      {label}
      <span className="sr-only">: {t("verifiedWith", { provider: label })}</span>
    </span>
  );
}
