import { cn } from "@/lib/utils";

// The only page widths in the app (tokens in app/globals.css).
// form: auth forms · reading: article body, long forms · content: landing, blog, profiles · wide: header/footer, dashboards
const SIZES = {
  form: "max-w-form",
  reading: "max-w-reading",
  content: "max-w-content",
  wide: "max-w-wide",
} as const;

type ContainerProps = React.ComponentProps<"div"> & {
  size?: keyof typeof SIZES;
};

export function Container({ size = "content", className, ...props }: ContainerProps) {
  return <div className={cn("mx-auto w-full px-4 sm:px-6 lg:px-8", SIZES[size], className)} {...props} />;
}
