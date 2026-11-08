import { createTranslator } from "next-intl";
import { hasLocale } from "next-intl";
import { routing, type AppLocale } from "@/i18n/routing";
import type { EmailMessage } from "@/lib/email";
import es from "@/messages/es.json";
import en from "@/messages/en.json";

const catalogs = { es, en } as const;

// Email clients ignore CSS variables, so the email layout carries its own
// literal colours. They mirror the brand tokens in app/globals.css (dark theme).
const EMAIL_COLORS = {
  background: "#031316",
  surface: "#07252c",
  text: "#d4f0f7",
  muted: "#54c5de",
  button: "#12d0ed",
  buttonText: "#041215",
} as const;

/** Picks the visitor's UI language for an email triggered by their request. */
export function resolveEmailLocale(request?: Request): AppLocale {
  const cookie = request?.headers.get("cookie") ?? "";
  const fromCookie = /(?:^|;\s*)NEXT_LOCALE=([a-z-]+)/i.exec(cookie)?.[1];
  if (hasLocale(routing.locales, fromCookie)) return fromCookie;

  const referer = request?.headers.get("referer");
  if (referer) {
    const first = new URL(referer).pathname.split("/")[1];
    if (hasLocale(routing.locales, first)) return first;
  }
  return routing.defaultLocale;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

function layout(locale: AppLocale, parts: { greeting: string; body: string; cta: string; url: string; footnote: string }) {
  const c = EMAIL_COLORS;
  const html = `<!doctype html>
<html lang="${locale}">
<body style="margin:0;padding:0;background:${c.background};font-family:Poppins,Arial,sans-serif;color:${c.text}">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${c.background};padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:${c.surface};padding:32px">
        <tr><td style="font-size:20px;font-weight:700;padding-bottom:24px">GZ Group</td></tr>
        <tr><td style="font-size:16px;line-height:26px;padding-bottom:8px">${escapeHtml(parts.greeting)}</td></tr>
        <tr><td style="font-size:16px;line-height:26px;padding-bottom:24px">${escapeHtml(parts.body)}</td></tr>
        <tr><td style="padding-bottom:24px">
          <a href="${escapeHtml(parts.url)}" style="display:inline-block;background:${c.button};color:${c.buttonText};font-weight:700;text-decoration:none;padding:12px 24px">${escapeHtml(parts.cta)}</a>
        </td></tr>
        <tr><td style="font-size:13px;line-height:20px;color:${c.muted}">${escapeHtml(parts.footnote)}</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  const text = `${parts.greeting}\n\n${parts.body}\n\n${parts.cta}: ${parts.url}\n\n${parts.footnote}`;
  return { html, text };
}

type TemplateInput = { to: string; name: string; url: string; locale: AppLocale };

export function passwordResetEmail({ to, name, url, locale }: TemplateInput): EmailMessage {
  const t = createTranslator({ locale, messages: catalogs[locale], namespace: "Email" });
  return {
    to,
    subject: t("reset.subject"),
    ...layout(locale, {
      greeting: t("greeting", { name }),
      body: t("reset.body"),
      cta: t("reset.cta"),
      url,
      footnote: t("reset.footnote"),
    }),
  };
}

export function verifyEmailEmail({ to, name, url, locale }: TemplateInput): EmailMessage {
  const t = createTranslator({ locale, messages: catalogs[locale], namespace: "Email" });
  return {
    to,
    subject: t("verify.subject"),
    ...layout(locale, {
      greeting: t("greeting", { name }),
      body: t("verify.body"),
      cta: t("verify.cta"),
      url,
      footnote: t("verify.footnote"),
    }),
  };
}
