import { Button } from "@/components/ui/button";

type SubmitButtonProps = Omit<React.ComponentProps<typeof Button>, "type"> & {
  pending: boolean;
  pendingLabel: string;
};

// Keeps its width while pending so the layout doesn't jump.
export function SubmitButton({ pending, pendingLabel, children, ...props }: SubmitButtonProps) {
  return (
    <Button type="submit" disabled={pending} aria-busy={pending || undefined} {...props}>
      {pending ? pendingLabel : children}
    </Button>
  );
}
