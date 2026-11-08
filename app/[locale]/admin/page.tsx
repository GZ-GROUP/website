import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/layout/container";
import { EmptyState } from "@/components/shared/empty-state";
import { RoleToggle } from "@/components/admin/role-toggle";
import { hasRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin");
  return { title: t("metaTitle") };
}

const PAGE_SIZE = 200;

// Access is enforced by the layout (requireAdmin) and again by every action.
export default async function AdminUsersPage() {
  const t = await getTranslations("Admin");
  const format = await getFormatter();

  const [total, users] = await Promise.all([
    prisma.user.count(),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        emailVerified: true,
        role: true,
        isSuperAdmin: true,
        createdAt: true,
      },
    }),
  ]);

  return (
    <Container size="wide">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="text-2xl font-bold leading-display tracking-display">{t("title")}</h1>
        <p className="text-base text-muted-foreground tabular-nums">{t("total", { count: total })}</p>
      </div>

      {users.length === 0 ? (
        <EmptyState className="mt-10" as="p" title={t("empty")} />
      ) : (
        <div className="mt-10">
          <table className="w-full table-fixed border-collapse text-left">
            <thead>
              <tr className="text-sm text-muted-foreground">
                <th scope="col" className="py-3 pr-4 font-normal md:w-1/3">{t("columns.user")}</th>
                <th scope="col" className="hidden py-3 pr-6 font-normal md:table-cell">{t("columns.email")}</th>
                <th scope="col" className="hidden w-44 py-3 pr-4 font-normal sm:table-cell">{t("columns.role")}</th>
                <th scope="col" className="hidden w-32 py-3 pr-6 text-right font-normal lg:table-cell">{t("columns.joined")}</th>
                <th scope="col" className="w-36 py-3 text-right font-normal">
                  <span className="sr-only">{t("columns.actions")}</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => {
                const isAdmin = hasRole(user, "admin");
                const isWriter = hasRole(user, "writer");
                const roleKey = isAdmin ? "admin" : isWriter ? "writer" : "reader";
                return (
                  <tr key={user.id} className="align-middle">
                    <td className="py-4 pr-4">
                      <div className="flex min-w-0 flex-col">
                        {user.username ? (
                          <Link href={`/u/${user.username}`} className="truncate font-bold hover:text-primary-ink">
                            {user.name}
                          </Link>
                        ) : (
                          <span className="truncate font-bold">{user.name}</span>
                        )}
                        <span className="truncate text-sm text-muted-foreground">
                          {user.username ? `@${user.username}` : "—"}
                        </span>
                        {/* Phones: role and email columns are hidden, so they sit under the name. */}
                        <span className="text-sm sm:hidden">
                          {t(`roles.${roleKey}`)}
                          {user.isSuperAdmin && ` · ${t("master")}`}
                        </span>
                        <span className="truncate text-sm text-muted-foreground md:hidden" title={user.email}>
                          {user.email}
                        </span>
                      </div>
                    </td>
                    <td className="hidden py-4 pr-6 md:table-cell">
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate" title={user.email}>
                          {user.email}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {user.emailVerified ? t("verified") : t("unverified")}
                        </span>
                      </div>
                    </td>
                    <td className="hidden py-4 pr-4 sm:table-cell">
                      <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span
                          className={
                            roleKey === "reader"
                              ? "text-muted-foreground"
                              : "bg-accent px-2 py-0.5 text-sm font-bold text-accent-foreground"
                          }
                        >
                          {t(`roles.${roleKey}`)}
                        </span>
                        {user.isSuperAdmin && <span className="text-sm text-muted-foreground">{t("master")}</span>}
                      </span>
                    </td>
                    <td className="hidden py-4 pr-6 text-right tabular-nums text-muted-foreground lg:table-cell">
                      {format.dateTime(user.createdAt, { year: "numeric", month: "2-digit", day: "2-digit" })}
                    </td>
                    <td className="py-4 text-right">
                      {!isAdmin && <RoleToggle userId={user.id} isWriter={isWriter} userName={user.name} />}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Container>
  );
}
