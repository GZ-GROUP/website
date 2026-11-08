import { CircleAlert, CircleCheck } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

type FormMessageProps = {
  tone: "error" | "success";
  children: React.ReactNode;
};

// Form-level feedback, announced to screen readers when it appears.
export function FormMessage({ tone, children }: FormMessageProps) {
  return (
    <Alert variant={tone === "error" ? "destructive" : "default"} aria-live="polite">
      {tone === "error" ? <CircleAlert aria-hidden /> : <CircleCheck aria-hidden className="text-primary-ink" />}
      <AlertDescription className={tone === "error" ? undefined : "text-foreground"}>{children}</AlertDescription>
    </Alert>
  );
}
