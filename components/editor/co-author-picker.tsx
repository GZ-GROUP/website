"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { searchWritersAction } from "@/app/[locale]/studio/actions";
import { MAX_CO_AUTHORS } from "@/lib/articles/limits";

export type CoAuthor = { username: string; name: string };

type PickerProps = {
  id: string;
  value: CoAuthor[];
  onChange: (value: CoAuthor[]) => void;
  disabled?: boolean;
  describedBy?: string;
};

// Search writers by username and add them as co-authors (author only).
export function CoAuthorPicker({ id, value, onChange, disabled, describedBy }: PickerProps) {
  const t = useTranslations("Editor.panel");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CoAuthor[]>([]);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (query.trim().length < 2) return;
    const timer = setTimeout(() => {
      startTransition(async () => {
        const found = await searchWritersAction(query);
        setResults(found.filter((r) => !value.some((v) => v.username === r.username)));
      });
    }, 200);
    return () => clearTimeout(timer);
  }, [query, value]);

  const showResults = query.trim().length >= 2 && !disabled;

  return (
    <div className="flex flex-col gap-3">
      {value.length > 0 && (
        <ul className="flex flex-col gap-2">
          {value.map((person) => (
            <li key={person.username} className="flex items-center justify-between gap-2 bg-muted py-1 pr-1 pl-3 text-base">
              <span className="min-w-0 truncate">
                {person.name} <span className="text-sm text-muted-foreground">@{person.username}</span>
              </span>
              {!disabled && (
                <button
                  type="button"
                  aria-label={t("removeCoAuthor", { name: person.name })}
                  onClick={() => onChange(value.filter((v) => v.username !== person.username))}
                  className="inline-flex size-8 flex-none items-center justify-center text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" aria-hidden />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {!disabled && value.length < MAX_CO_AUTHORS && (
        <div className="flex flex-col gap-1">
          <Input
            id={id}
            value={query}
            placeholder={t("coAuthorsSearch")}
            aria-describedby={describedBy}
            autoComplete="off"
            onChange={(e) => {
              setQuery(e.target.value);
              if (e.target.value.trim().length < 2) setResults([]);
            }}
          />
          {showResults && (
            <ul aria-busy={pending} aria-live="polite" className="flex flex-col">
              {results.length === 0 && !pending ? (
                <li className="py-2 text-sm text-muted-foreground">{t("noResults")}</li>
              ) : (
                results.map((person) => (
                  <li key={person.username}>
                    <button
                      type="button"
                      className="w-full py-2 text-left text-base hover:text-primary-ink"
                      onClick={() => {
                        onChange([...value, person]);
                        setQuery("");
                        setResults([]);
                      }}
                    >
                      {person.name} <span className="text-sm text-muted-foreground">@{person.username}</span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
