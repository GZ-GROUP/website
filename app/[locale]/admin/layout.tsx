import type { Metadata } from "next";
import { SiteShell } from "@/components/layout/site-shell";
import { requireAdmin } from "@/lib/auth/session";

// Not linked from any public page and answers 404 to non-admins (requireAdmin).
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <SiteShell mainClassName="py-16 md:py-24">{children}</SiteShell>;
}
