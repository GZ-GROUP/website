import type { Metadata } from "next";
import { SiteShell } from "@/components/layout/site-shell";
import { Container } from "@/components/layout/container";
import { AdminNav } from "@/components/admin/admin-nav";
import { requireAdmin } from "@/lib/auth/session";

// Not linked from any public page and answers 404 to non-admins (requireAdmin).
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <SiteShell mainClassName="py-12 md:py-16">
      <Container size="wide" className="mb-10">
        <AdminNav />
      </Container>
      {children}
    </SiteShell>
  );
}
