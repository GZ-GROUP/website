"use client";

import { ButtonLink } from "@/components/ui/button-link";

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
import { ripple } from "@/lib/ui/ripple";

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
        <ButtonLink variant="ghost" href="/login">
          {t("login")}
        </ButtonLink>
        <ButtonLink href="/register">
          {t("register")}
        </ButtonLink>
      </div>
    );
  }

  const { user } = data;
  const roles = (user.role ?? "").split(",");
  const isAdmin = roles.includes("admin");
  const isWriter = isAdmin || roles.includes("writer");

  return (
    <DropdownMenu>
      {/* The accessible name starts with the visible name (WCAG 2.5.3 Label in Name). */}
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            className="group/user-menu relative h-10 gap-2 overflow-hidden px-2 normal-case tracking-normal"
            onPointerDown={ripple}
          />
        }
      >
        <Avatar size="sm" aria-hidden>
          {user.image && <AvatarImage src={user.image} alt="" />}
          <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <span className="max-w-40 truncate text-base font-bold">{user.name}</span>
        <span className="sr-only">, {t("userMenu")}</span>
        {/* Same motion as the Projects chevron in the nav: 300ms rotation while open. */}
        <ChevronDown
          className="size-4 text-muted-foreground transition duration-300 group-data-popup-open/user-menu:rotate-180"
          aria-hidden
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem render={<Link href="/account" />}>{t("account")}</DropdownMenuItem>
        {user.username && <DropdownMenuItem render={<Link href={`/u/${user.username}`} />}>{t("profile")}</DropdownMenuItem>}
        {isWriter && <DropdownMenuItem render={<Link href="/studio" />}>{t("studio")}</DropdownMenuItem>}
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
