"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { mediaUrl } from "@/lib/editor/links";
import { ACCEPTED_IMAGE_TYPES, uploadImage, type UploadError } from "@/lib/editor/upload";

type CoverFieldProps = {
  value: string | null;
  onChange: (key: string | null) => void;
  onError: (error: UploadError | null) => void;
  disabled?: boolean;
};

export function CoverField({ value, onChange, onError, disabled }: CoverFieldProps) {
  const t = useTranslations("Editor.panel");
  const tt = useTranslations("Editor.toolbar");
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function upload(file: File) {
    setUploading(true);
    onError(null);
    const result = await uploadImage(file);
    setUploading(false);
    if ("error" in result) onError(result.error);
    else onChange(result.key);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="aspect-16/10 overflow-hidden bg-muted">
        {value && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mediaUrl(value)} alt="" className="size-full object-cover" />
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled || uploading}
          onClick={() => input.current?.click()}
        >
          {uploading ? tt("uploading") : value ? t("coverReplace") : t("coverUpload")}
        </Button>
        {value && (
          <Button type="button" size="sm" variant="ghost" disabled={disabled} onClick={() => onChange(null)}>
            {t("coverRemove")}
          </Button>
        )}
      </div>
      <p className="text-sm text-muted-foreground">{t("coverHint")}</p>
      <input
        ref={input}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        data-testid="cover-input"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void upload(file);
        }}
      />
    </div>
  );
}
