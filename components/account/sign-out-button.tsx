"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";

type SignOutButtonProps = Omit<React.ComponentProps<typeof Button>, "onClick"> & { label: string };

export function SignOutButton({ label, ...props }: SignOutButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <Button
      {...props}
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await authClient.signOut();
        router.replace("/");
        router.refresh();
      }}
    >
      {label}
    </Button>
  );
}
