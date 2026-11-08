"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { setUserRole, type RoleActionState } from "@/app/[locale]/admin/actions";

const initial: RoleActionState = { status: "idle" };

// One fixed trailing action per row: promote a Reader, or return a Writer to Reader.
export function RoleToggle({ userId, isWriter, userName }: { userId: string; isWriter: boolean; userName: string }) {
  const t = useTranslations("Admin");
  const ta = useTranslations("Auth.common");
  const te = useTranslations("AuthErrors");
  const [state, action, pending] = useActionState(setUserRole, initial);
  const label = isWriter ? t("removeWriter") : t("makeWriter");

  return (
    <form action={action} className="flex flex-col items-end gap-1">
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="role" value={isWriter ? "reader" : "writer"} />
      <Button type="submit" size="sm" variant="outline" disabled={pending} aria-label={`${label}: ${userName}`}>
        {pending ? ta("submitting") : label}
      </Button>
      {state.status === "error" && (
        <p role="alert" className="text-sm text-destructive">
          {state.error === "forbidden" ? t("forbidden") : te("UNKNOWN")}
        </p>
      )}
    </form>
  );
}
