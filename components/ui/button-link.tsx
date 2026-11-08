import type { VariantProps } from "class-variance-authority";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Variants = VariantProps<typeof buttonVariants>;

// Navigation that looks like a button but is announced as a link. Base UI's
// Button renders role="button" on non-button elements, which is wrong for
// navigation, so links never go through <Button render={...}>.

/** Internal, locale-aware navigation styled as a button. */
export function ButtonLink({ variant, size, className, ...props }: React.ComponentProps<typeof Link> & Variants) {
  return <Link className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

/** External (or non-localized) URL styled as a button. */
export function ButtonAnchor({ variant, size, className, ...props }: React.ComponentProps<"a"> & Variants) {
  return <a className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
