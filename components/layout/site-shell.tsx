import { useTranslations } from "next-intl";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { cn } from "@/lib/utils";

type SiteShellProps = {
  children: React.ReactNode;
  mainClassName?: string;
};

// Public page frame: skip link, header, <main id="main">, footer.
export function SiteShell({ children, mainClassName }: SiteShellProps) {
  const t = useTranslations("Common");

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        {t("skipToContent")}
      </a>
      <Header />
      <main id="main" className={cn("flex-1", mainClassName)}>
        {children}
      </main>
      <Footer />
    </div>
  );
}
