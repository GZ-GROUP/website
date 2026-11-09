"use client";

import { ButtonLink } from "@/components/ui/button-link";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { EditorContent, useEditor, type JSONContent } from "@tiptap/react";
import { ArrowLeft, Eye, MoreHorizontal } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FormField } from "@/components/forms/form-field";
import { FormMessage } from "@/components/forms/form-message";
import { StatusPill } from "@/components/studio/status-pill";
import { EditorToolbar } from "@/components/editor/editor-toolbar";
import { TagInput } from "@/components/editor/tag-input";
import { CoverField } from "@/components/editor/cover-field";
import { CoAuthorPicker, type CoAuthor } from "@/components/editor/co-author-picker";
import { articleExtensions } from "@/lib/editor/extensions";
import { CATEGORY_SLUGS, type CategorySlug } from "@/lib/articles/limits";
import type { MutationResult } from "@/lib/articles/mutations";
import {
  archiveArticleAction,
  deleteArticleAction,
  publishArticleAction,
  restoreArticleAction,
  saveArticleAction,
  unpublishArticleAction,
} from "@/app/[locale]/studio/actions";

export type EditorArticle = {
  id: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  title: string;
  excerpt: string;
  content: JSONContent;
  category: CategorySlug;
  language: "ES" | "EN";
  tags: string[];
  coverImageKey: string | null;
  coverAlt: string;
  repositoryUrl: string;
  externalUrl: string;
  coAuthors: CoAuthor[];
};

export type EditorPermissions = {
  edit: boolean;
  manageCoAuthors: boolean;
  publish: boolean;
  unpublish: boolean;
  archive: boolean;
  restore: boolean;
  delete: boolean;
};

type Feedback = { tone: "error" | "success"; message: string; items?: string[] } | null;

// The writing tool (Operate surface): usability over decoration. Explicit save
// (button or Ctrl/Cmd+S) with a visible saved state; autosave is post-MVP.
export function ArticleEditor({ article, can }: { article: EditorArticle; can: EditorPermissions }) {
  const t = useTranslations("Editor");
  const tp = useTranslations("Editor.panel");
  const te = useTranslations("Editor.errors");
  const tc = useTranslations("Categories");
  const tl = useTranslations("Languages");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [meta, setMeta] = useState({
    title: article.title,
    excerpt: article.excerpt,
    category: article.category,
    language: article.language,
    tags: article.tags,
    coverImageKey: article.coverImageKey,
    coverAlt: article.coverAlt,
    repositoryUrl: article.repositoryUrl,
    externalUrl: article.externalUrl,
    coAuthors: article.coAuthors,
  });
  const [dirty, setDirty] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const editor = useEditor({
    extensions: articleExtensions,
    content: article.content,
    editable: can.edit,
    immediatelyRender: false, // avoid SSR hydration mismatches
    editorProps: {
      attributes: {
        class: "article-prose min-h-96 py-8 outline-none",
        "aria-label": t("contentLabel"),
        "aria-multiline": "true",
        role: "textbox",
      },
    },
    onUpdate: () => setDirty(true),
  });

  const update = <K extends keyof typeof meta>(key: K, value: (typeof meta)[K]) => {
    setMeta((m) => ({ ...m, [key]: value }));
    setDirty(true);
  };

  const errorText = (key: string) => (te.has(key as never) ? te(key as never) : te("UNKNOWN"));

  const report = useCallback(
    (result: MutationResult) => {
      if (result.ok) return true;
      setFieldErrors(result.fieldErrors ?? {});
      setFeedback({
        tone: "error",
        message: errorText(result.error),
        items: result.problems?.map((p) => errorText(p)),
      });
      return false;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const save = useCallback(async (): Promise<boolean> => {
    if (!editor || !can.edit) return false;
    setFeedback(null);
    setFieldErrors({});
    const result = await saveArticleAction(article.id, {
      meta: { ...meta, coAuthors: meta.coAuthors.map((c) => c.username) },
      content: editor.getJSON(),
    });
    if (report(result)) {
      setDirty(false);
      return true;
    }
    return false;
  }, [editor, can.edit, article.id, meta, report]);

  const run = (action: () => Promise<MutationResult>, success?: string) =>
    startTransition(async () => {
      if (dirty && can.edit && !(await save())) return;
      const result = await action();
      if (report(result)) {
        if (success) setFeedback({ tone: "success", message: success });
        router.refresh();
      }
    });

  // Ctrl/Cmd+S saves; leaving with unsaved changes asks first.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        startTransition(async () => void (await save()));
      }
    };
    const onLeave = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("beforeunload", onLeave);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("beforeunload", onLeave);
    };
  }, [dirty, save]);

  const disabled = !can.edit || pending;
  const fieldError = (name: string) => (fieldErrors[name] ? errorText(fieldErrors[name]) : undefined);
  const saveState = pending ? t("saving") : dirty ? t("unsaved") : t("saved");
  const hasMenu = can.archive || can.restore || can.delete;

  return (
    <div className="flex flex-col gap-8">
      <h1 className="sr-only">{t("metaTitle")}</h1>

      {/* Top bar: where I am, what state the document is in, the main actions. */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/studio" className="inline-flex items-center gap-1 text-base text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" aria-hidden />
            {t("back")}
          </Link>
          <StatusPill status={article.status} />
          <span role="status" className="text-sm text-muted-foreground">
            {saveState}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ButtonLink variant="ghost" href={article.status === "PUBLISHED" ? `/blog/${article.slug}` : `/studio/${article.id}/preview`}>
            <Eye data-icon="inline-start" aria-hidden />
            {article.status === "PUBLISHED" ? t("viewPublished") : t("preview")}
          </ButtonLink>
          {can.edit && (
            <Button
              variant={can.publish ? "outline" : "default"}
              disabled={pending || !dirty}
              onClick={() => startTransition(async () => void (await save()))}
            >
              {t("save")}
            </Button>
          )}
          {can.publish && (
            <Button disabled={pending} onClick={() => run(() => publishArticleAction(article.id), t("published"))}>
              {t("publish")}
            </Button>
          )}
          {can.unpublish && (
            <Button variant="outline" disabled={pending} onClick={() => run(() => unpublishArticleAction(article.id))}>
              {t("unpublish")}
            </Button>
          )}
          {hasMenu && (
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label={t("panel.title")} />}>
                <MoreHorizontal className="size-5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {can.archive && (
                  <DropdownMenuItem onClick={() => run(() => archiveArticleAction(article.id))}>{t("archive")}</DropdownMenuItem>
                )}
                {can.restore && (
                  <DropdownMenuItem onClick={() => run(() => restoreArticleAction(article.id))}>{t("restore")}</DropdownMenuItem>
                )}
                {can.delete && (
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => {
                      if (window.confirm(t("confirmDelete"))) run(() => deleteArticleAction(article.id));
                    }}
                  >
                    {t("delete")}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {!can.edit && article.status === "ARCHIVED" && <FormMessage tone="error">{t("readOnly")}</FormMessage>}
      {can.edit && !can.manageCoAuthors && <FormMessage tone="success">{t("coAuthorNotice")}</FormMessage>}
      {feedback && (
        <FormMessage tone={feedback.tone}>
          {feedback.message}
          {feedback.items && feedback.items.length > 0 && (
            <ul className="mt-2 list-disc pl-5">
              {feedback.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </FormMessage>
      )}

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_20rem]">
        {/* Writing column */}
        <div className="min-w-0">
          <div className="mx-auto max-w-reading">
            <Label htmlFor="title" className="sr-only">
              {t("titleLabel")}
            </Label>
            <Textarea
              id="title"
              value={meta.title}
              onChange={(e) => update("title", e.target.value.replace(/\n/g, ""))}
              placeholder={t("titlePlaceholder")}
              maxLength={160}
              rows={1}
              disabled={disabled}
              aria-invalid={fieldErrors.title ? true : undefined}
              className="w-full max-w-full field-sizing-content min-h-0 resize-none border-0 px-0 text-3xl leading-display font-bold tracking-display shadow-none focus-visible:ring-0 md:text-4xl"
            />
            <Label htmlFor="excerpt" className="sr-only">
              {t("excerptLabel")}
            </Label>
            <Textarea
              id="excerpt"
              value={meta.excerpt}
              onChange={(e) => update("excerpt", e.target.value)}
              placeholder={t("excerptPlaceholder")}
              maxLength={300}
              rows={2}
              disabled={disabled}
              className="mt-4 w-full max-w-full field-sizing-content min-h-0 resize-none border-0 px-0 text-xl leading-8 text-muted-foreground shadow-none focus-visible:ring-0"
            />
          </div>
          {editor && can.edit && (
            <div className="mx-auto mt-8 max-w-reading">
              <EditorToolbar
                editor={editor}
                onError={(error) => setFeedback(error ? { tone: "error", message: errorText(error) } : null)}
              />
            </div>
          )}
          <div className="mx-auto max-w-reading">
            <EditorContent editor={editor} />
          </div>
        </div>

        {/* Details panel */}
        <aside aria-label={tp("title")} className="flex min-w-0 flex-col gap-6 self-start bg-card p-6">
          <h2 className="text-xl font-bold">{tp("title")}</h2>

          <FormField id="category" label={tp("category")}>
            {(a11y) => (
              <NativeSelect
                {...a11y}
                value={meta.category}
                disabled={disabled}
                onChange={(e) => update("category", e.target.value as CategorySlug)}
              >
                {CATEGORY_SLUGS.map((slug) => (
                  <NativeSelectOption key={slug} value={slug}>
                    {tc(`${slug}.title` as "software.title")}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            )}
          </FormField>

          <FormField id="language" label={tp("language")}>
            {(a11y) => (
              <NativeSelect
                {...a11y}
                value={meta.language}
                disabled={disabled}
                onChange={(e) => update("language", e.target.value as "ES" | "EN")}
              >
                <NativeSelectOption value="ES">{tl("ES")}</NativeSelectOption>
                <NativeSelectOption value="EN">{tl("EN")}</NativeSelectOption>
              </NativeSelect>
            )}
          </FormField>

          <FormField id="tags" label={tp("tags")} hint={tp("tagsHint")} error={fieldError("tags")}>
            {(a11y) => (
              <TagInput
                id={a11y.id}
                describedBy={a11y["aria-describedby"]}
                value={meta.tags}
                disabled={disabled}
                onChange={(tags) => update("tags", tags)}
              />
            )}
          </FormField>

          <div className="flex flex-col gap-2">
            <span className="text-base font-bold">{tp("cover")}</span>
            <CoverField
              value={meta.coverImageKey}
              disabled={disabled}
              onChange={(key) => update("coverImageKey", key)}
              onError={(error) => setFeedback(error ? { tone: "error", message: errorText(error) } : null)}
            />
          </div>

          {meta.coverImageKey && (
            <FormField id="coverAlt" label={tp("coverAlt")} hint={tp("coverAltHint")} error={fieldError("coverAlt")}>
              {(a11y) => (
                <Input
                  {...a11y}
                  value={meta.coverAlt}
                  maxLength={200}
                  disabled={disabled}
                  onChange={(e) => update("coverAlt", e.target.value)}
                />
              )}
            </FormField>
          )}

          <FormField id="repositoryUrl" label={tp("repository")} hint={tp("repositoryHint")} error={fieldError("repositoryUrl")}>
            {(a11y) => (
              <Input
                {...a11y}
                type="url"
                inputMode="url"
                placeholder="https://github.com/…"
                value={meta.repositoryUrl}
                maxLength={500}
                disabled={disabled}
                onChange={(e) => update("repositoryUrl", e.target.value)}
              />
            )}
          </FormField>

          <FormField id="externalUrl" label={tp("demo")} error={fieldError("externalUrl")}>
            {(a11y) => (
              <Input
                {...a11y}
                type="url"
                inputMode="url"
                placeholder="https://"
                value={meta.externalUrl}
                maxLength={500}
                disabled={disabled}
                onChange={(e) => update("externalUrl", e.target.value)}
              />
            )}
          </FormField>

          <FormField id="coAuthors" label={tp("coAuthors")} hint={can.manageCoAuthors ? tp("coAuthorsHint") : undefined}>
            {(a11y) => (
              <CoAuthorPicker
                id={a11y.id}
                describedBy={a11y["aria-describedby"]}
                value={meta.coAuthors}
                disabled={disabled || !can.manageCoAuthors}
                onChange={(value) => update("coAuthors", value)}
              />
            )}
          </FormField>
        </aside>
      </div>
    </div>
  );
}
