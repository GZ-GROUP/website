"use client";

import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth/client";

// Client-side so public pages stay static: the session is read in the browser.
// Showing "Admin" here is cosmetic; /admin authorizes on the server.
export function UserMenu() {
  const t = useTranslations("Header");
  const router = useRouter();
  const { data, isPending } = authClient.useSession();

  // Reserve the space of the signed-out buttons to avoid a layout jump.
  if (isPending) return <div aria-hidden className="h-10 w-56" />;

  if (!data) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="ghost" nativeButton={false} render={<Link href="/login" />}>
          {t("login")}
        </Button>
        <Button nativeButton={false} render={<Link href="/register" />}>
          {t("register")}
        </Button>
      </div>
    );
  }

  const { user } = data;
  const isAdmin = (user.role ?? "").split(",").includes("admin");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" className="h-10 gap-2 px-2 normal-case tracking-normal" />}
        aria-label={t("userMenu")}
      >
        <Avatar size="sm">
          {user.image && <AvatarImage src={user.image} alt="" />}
          <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <span className="max-w-40 truncate text-base font-bold">{user.name}</span>
        <ChevronDown className="size-4 text-muted-foreground" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem render={<Link href="/account" />}>{t("account")}</DropdownMenuItem>
        {user.username && <DropdownMenuItem render={<Link href={`/u/${user.username}`} />}>{t("profile")}</DropdownMenuItem>}
        {isAdmin && <DropdownMenuItem render={<Link href="/admin" />}>{t("admin")}</DropdownMenuItem>}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={async () => {
            await authClient.signOut();
            router.replace("/");
            router.refresh();
          }}
        >
          {t("signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
