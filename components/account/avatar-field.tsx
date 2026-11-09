"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/forms/form-message";
import { authClient } from "@/lib/auth/client";
import { ACCEPTED_IMAGE_TYPES, MAX_UPLOAD_BYTES } from "@/lib/editor/upload";

type ErrorKey = "TOO_LARGE" | "UNSUPPORTED_TYPE" | "INVALID_IMAGE" | "RATE_LIMITED" | "UNAUTHORIZED" | "UNKNOWN";
type Message = { tone: "success"; key: "uploaded" | "removed" } | { tone: "error"; key: ErrorKey };

const KNOWN_ERRORS: ErrorKey[] = ["TOO_LARGE", "UNSUPPORTED_TYPE", "INVALID_IMAGE", "RATE_LIMITED", "UNAUTHORIZED"];

async function errorOf(response: Response): Promise<ErrorKey> {
  const body = (await response.json().catch(() => null)) as { error?: ErrorKey } | null;
  return body?.error && KNOWN_ERRORS.includes(body.error) ? body.error : "UNKNOWN";
}

const PRELOAD_TIMEOUT_MS = 30_000;

/** Resolves once the browser holds the image, or gives up (a failed load must not hang the form). */
function preload(src: string): Promise<void> {
  return new Promise((resolve) => {
    const image = new window.Image();
    image.onload = image.onerror = () => resolve();
    setTimeout(resolve, PRELOAD_TIMEOUT_MS);
    image.src = src;
  });
}

/** Saves on its own as soon as a file is chosen, separately from the profile form. */
export function AvatarField({ name, image }: { name: string; image: string | null }) {
  const t = useTranslations("Account.avatar");
  const router = useRouter();
  const { refetch } = authClient.useSession();
  const input = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(image);
  const [busy, setBusy] = useState<"upload" | "remove" | null>(null);
  const [message, setMessage] = useState<Message | null>(null);

  // Avatars show the initial until their image has loaded. Waiting for it here
  // means "Photo updated" only appears once every copy of the photo can show it.
  async function applied(next: string | null, key: "uploaded" | "removed") {
    if (next) await preload(next);
    await refetch(); // the photo in the header
    setUrl(next);
    setMessage({ tone: "success", key });
    router.refresh();
  }

  async function send(kind: "upload" | "remove", init: RequestInit, onOk: (response: Response) => Promise<void>) {
    setBusy(kind);
    setMessage(null);
    try {
      const response = await fetch("/api/account/avatar", init);
      if (response.ok) await onOk(response);
      else setMessage({ tone: "error", key: await errorOf(response) });
    } catch {
      setMessage({ tone: "error", key: "UNKNOWN" });
    } finally {
      setBusy(null);
    }
  }

  function upload(file: File) {
    if (file.size > MAX_UPLOAD_BYTES) {
      setMessage({ tone: "error", key: "TOO_LARGE" });
      return;
    }
    const body = new FormData();
    body.append("file", file);
    void send("upload", { method: "POST", body }, async (response) => {
      const { url: uploaded } = (await response.json()) as { url: string };
      await applied(uploaded, "uploaded");
    });
  }

  function remove() {
    void send("remove", { method: "DELETE" }, () => applied(null, "removed"));
  }

  return (
    <div className="mb-8 flex flex-col gap-4">
      {message && (
        <FormMessage tone={message.tone}>{message.tone === "error" ? t(`errors.${message.key}`) : t(message.key)}</FormMessage>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        <Avatar className="size-24" data-testid="avatar-preview" aria-hidden>
          {url && <AvatarImage key={url} src={url} alt="" />}
          <AvatarFallback className="text-3xl font-bold">{name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" disabled={busy !== null} onClick={() => input.current?.click()}>
              {busy === "upload" ? t("uploading") : url ? t("replace") : t("upload")}
            </Button>
            {url && (
              <Button type="button" size="sm" variant="ghost" disabled={busy !== null} onClick={remove}>
                {busy === "remove" ? t("removing") : t("remove")}
              </Button>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{t("hint")}</p>
        </div>
      </div>
      <input
        ref={input}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        data-testid="avatar-input"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = ""; // choosing the same file again must still fire
          if (file) upload(file);
        }}
      />
    </div>
  );
}
