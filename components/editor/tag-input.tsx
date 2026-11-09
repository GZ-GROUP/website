"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { MAX_TAGS } from "@/lib/articles/limits";

type TagInputProps = {
  id: string;
  value: string[];
  onChange: (tags: string[]) => void;
  disabled?: boolean;
  describedBy?: string;
};

export function TagInput({ id, value, onChange, disabled, describedBy }: TagInputProps) {
  const t = useTranslations("Editor.panel");
  const [draft, setDraft] = useState("");

  function add() {
    const tag = draft.trim().replace(/\s+/g, " ").slice(0, 40);
    if (tag && value.length < MAX_TAGS && !value.some((v) => v.toLowerCase() === tag.toLowerCase())) {
      onChange([...value, tag]);
    }
    setDraft("");
  }

  return (
    <div className="flex flex-col gap-3">
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {value.map((tag) => (
            <li key={tag} className="inline-flex items-center gap-1 bg-muted py-1 pr-1 pl-3 text-sm">
              #{tag}
              <button
                type="button"
                disabled={disabled}
                aria-label={t("removeTag", { tag })}
                onClick={() => onChange(value.filter((v) => v !== tag))}
                className="inline-flex size-6 items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
      <Input
        id={id}
        value={draft}
        disabled={disabled || value.length >= MAX_TAGS}
        placeholder={t("tagsPlaceholder")}
        aria-describedby={describedBy}
        maxLength={40}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add();
          }
        }}
        onBlur={add}
      />
    </div>
  );
}
