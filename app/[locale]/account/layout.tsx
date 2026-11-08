import type { Metadata } from "next";
import { SiteShell } from "@/components/layout/site-shell";

// Private area: never indexed. Each page enforces its own access server-side.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <SiteShell mainClassName="py-16 md:py-24">{children}</SiteShell>;
}
