"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useEditorState, type Editor } from "@tiptap/react";
import {
  Bold,
  Code,
  CodeXml,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { CODE_LANGUAGES } from "@/lib/editor/lowlight";
import { isSafeHref } from "@/lib/editor/links";
import { ACCEPTED_IMAGE_TYPES, uploadImage, type UploadError } from "@/lib/editor/upload";
import { cn } from "@/lib/utils";

type ToolbarProps = {
  editor: Editor;
  onError: (error: UploadError | null) => void;
};

// Formatting toolbar. Context fields appear under it for the selected link,
// image (alt text) or code block (language). No animation: it is used constantly.
export function EditorToolbar({ editor, onError }: ToolbarProps) {
  const t = useTranslations("Editor.toolbar");
  const fileInput = useRef<HTMLInputElement>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkValue, setLinkValue] = useState("");
  const [uploading, setUploading] = useState(false);

  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      h2: e.isActive("heading", { level: 2 }),
      h3: e.isActive("heading", { level: 3 }),
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      code: e.isActive("code"),
      link: e.isActive("link"),
      href: (e.getAttributes("link").href as string | undefined) ?? "",
      bulletList: e.isActive("bulletList"),
      orderedList: e.isActive("orderedList"),
      blockquote: e.isActive("blockquote"),
      codeBlock: e.isActive("codeBlock"),
      language: (e.getAttributes("codeBlock").language as string | undefined) ?? "plaintext",
      image: e.isActive("image"),
      alt: (e.getAttributes("image").alt as string | undefined) ?? "",
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });

  const chain = () => editor.chain().focus();

  async function insertImage(file: File) {
    setUploading(true);
    onError(null);
    const result = await uploadImage(file);
    setUploading(false);
    if ("error" in result) return onError(result.error);
    chain()
      .setImage({ src: result.url, alt: "" })
      .updateAttributes("image", { width: result.width, height: result.height })
      .run();
  }

  function applyLink() {
    const href = linkValue.trim();
    if (!href) chain().extendMarkRange("link").unsetLink().run();
    else if (isSafeHref(href)) chain().extendMarkRange("link").setLink({ href }).run();
    setLinkOpen(false);
  }

  const showLinkField = linkOpen || state.link;

  return (
    <div className="sticky top-0 z-10 border-b border-border bg-background">
      <div role="toolbar" aria-label={t("label")} className="flex flex-wrap items-center gap-1 py-2">
        <ToolButton label={t("heading2")} icon={Heading2} active={state.h2} onClick={() => chain().toggleHeading({ level: 2 }).run()} />
        <ToolButton label={t("heading3")} icon={Heading3} active={state.h3} onClick={() => chain().toggleHeading({ level: 3 }).run()} />
        <span aria-hidden className="mx-1 h-5 w-px bg-border" />
        <ToolButton label={t("bold")} icon={Bold} active={state.bold} onClick={() => chain().toggleBold().run()} />
        <ToolButton label={t("italic")} icon={Italic} active={state.italic} onClick={() => chain().toggleItalic().run()} />
        <ToolButton label={t("code")} icon={Code} active={state.code} onClick={() => chain().toggleCode().run()} />
        <ToolButton
          label={t("link")}
          icon={Link2}
          active={state.link || linkOpen}
          onClick={() => {
            setLinkValue(state.href);
            setLinkOpen((open) => !open);
          }}
        />
        <span aria-hidden className="mx-1 h-5 w-px bg-border" />
        <ToolButton label={t("bulletList")} icon={List} active={state.bulletList} onClick={() => chain().toggleBulletList().run()} />
        <ToolButton label={t("orderedList")} icon={ListOrdered} active={state.orderedList} onClick={() => chain().toggleOrderedList().run()} />
        <ToolButton label={t("blockquote")} icon={Quote} active={state.blockquote} onClick={() => chain().toggleBlockquote().run()} />
        <ToolButton label={t("codeBlock")} icon={CodeXml} active={state.codeBlock} onClick={() => chain().toggleCodeBlock().run()} />
        <ToolButton label={t("image")} icon={ImagePlus} active={false} onClick={() => fileInput.current?.click()} disabled={uploading} />
        <ToolButton label={t("rule")} icon={Minus} active={false} onClick={() => chain().setHorizontalRule().run()} />
        <span aria-hidden className="mx-1 h-5 w-px bg-border" />
        <ToolButton label={t("undo")} icon={Undo2} active={false} onClick={() => chain().undo().run()} disabled={!state.canUndo} />
        <ToolButton label={t("redo")} icon={Redo2} active={false} onClick={() => chain().redo().run()} disabled={!state.canRedo} />
        {uploading && (
          <span role="status" className="ml-2 text-sm text-muted-foreground">
            {t("uploading")}
          </span>
        )}
        <input
          ref={fileInput}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES}
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) void insertImage(file);
          }}
        />
      </div>

      {(showLinkField || state.image || state.codeBlock) && (
        <div className="flex flex-wrap items-end gap-3 pb-3">
          {showLinkField && (
            <form
              className="flex flex-1 items-end gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                applyLink();
              }}
            >
              <label className="flex flex-1 flex-col gap-1">
                <span className="text-sm text-muted-foreground">{t("linkUrl")}</span>
                <Input
                  autoFocus={linkOpen}
                  value={linkOpen ? linkValue : state.href}
                  onFocus={() => {
                    if (!linkOpen) {
                      setLinkValue(state.href);
                      setLinkOpen(true);
                    }
                  }}
                  onChange={(e) => setLinkValue(e.target.value)}
                  placeholder="https://"
                  inputMode="url"
                />
              </label>
              <Button type="submit" size="sm" variant="outline">
                {t("linkApply")}
              </Button>
              {state.link && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    chain().extendMarkRange("link").unsetLink().run();
                    setLinkOpen(false);
                  }}
                >
                  {t("linkRemove")}
                </Button>
              )}
            </form>
          )}
          {state.image && (
            <label className="flex flex-1 flex-col gap-1">
              <span className="text-sm text-muted-foreground">{t("imageAlt")}</span>
              <Input
                value={state.alt}
                maxLength={200}
                onChange={(e) => editor.chain().updateAttributes("image", { alt: e.target.value }).run()}
              />
            </label>
          )}
          {state.codeBlock && (
            <label className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">{t("codeLanguage")}</span>
              <NativeSelect
                value={state.language}
                onChange={(e) => chain().updateAttributes("codeBlock", { language: e.target.value }).run()}
              >
                {CODE_LANGUAGES.map((lang) => (
                  <NativeSelectOption key={lang} value={lang}>
                    {lang}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </label>
          )}
        </div>
      )}
    </div>
  );
}

type ToolButtonProps = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
};

function ToolButton({ label, icon: Icon, active, onClick, disabled }: ToolButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      title={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()} // keep the editor selection
      onClick={onClick}
      className={cn(active && "bg-muted text-primary-ink")}
    >
      <Icon className="size-4" />
    </Button>
  );
}
