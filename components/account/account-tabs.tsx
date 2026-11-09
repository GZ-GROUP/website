import { AccountNav } from "@/components/account/account-nav";
import { getSession } from "@/lib/auth/session";

/** Administration is only offered to the master admin; /admin also enforces it on the server. */
export async function AccountTabs() {
  const session = await getSession();
  return <AccountNav showAdmin={session?.user.isSuperAdmin === true} />;
}
