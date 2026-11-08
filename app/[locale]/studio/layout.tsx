import type { Metadata } from "next";
import { SiteShell } from "@/components/layout/site-shell";
import { requireStudio } from "@/lib/auth/session";

// Writers' area. Not linked publicly and answers 404 to everyone else.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  await requireStudio();
  return <SiteShell mainClassName="py-12 md:py-16">{children}</SiteShell>;
}
