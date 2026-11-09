import { createTranslator } from "next-intl";
import { hasLocale } from "next-intl";
import { routing, type AppLocale } from "@/i18n/routing";
import type { EmailMessage } from "@/lib/email";
import type { ContactReason } from "@/lib/contact/limits";
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

export type ContactEmailInput = {
  to: string;
  name: string;
  email: string;
  phone: string | null;
  organization: string | null;
  reason: ContactReason;
  subject: string;
  message: string;
};

/** A message from the contact form. Replies go to whoever wrote it, not to the no-reply sender. */
export function contactMessageEmail(input: ContactEmailInput): EmailMessage {
  const locale = routing.defaultLocale;
  const t = createTranslator({ locale, messages: catalogs[locale], namespace: "Email.contact" });
  const reasons = createTranslator({ locale, messages: catalogs[locale], namespace: "Contact.form.reasons" });
  const c = EMAIL_COLORS;

  const rows: [string, string][] = [
    [t("name"), input.name],
    [t("email"), input.email],
    ...(input.phone ? [[t("phone"), input.phone] as [string, string]] : []),
    ...(input.organization ? [[t("organization"), input.organization] as [string, string]] : []),
    [t("reason"), reasons(input.reason)],
    [t("subject"), input.subject],
  ];

  const htmlRows = rows
    .map(
      ([label, value]) =>
        `<tr><td style="font-size:13px;line-height:20px;color:${c.muted};padding:0 16px 8px 0;vertical-align:top">${escapeHtml(label)}</td><td style="font-size:16px;line-height:24px;padding-bottom:8px">${escapeHtml(value)}</td></tr>`,
    )
    .join("");

  const html = `<!doctype html>
<html lang="${locale}">
<body style="margin:0;padding:0;background:${c.background};font-family:Poppins,Arial,sans-serif;color:${c.text}">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${c.background};padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:${c.surface};padding:32px">
        <tr><td style="font-size:20px;font-weight:700;padding-bottom:16px">GZ Group</td></tr>
        <tr><td style="font-size:16px;line-height:26px;padding-bottom:24px">${escapeHtml(t("intro"))}</td></tr>
        <tr><td style="padding-bottom:16px"><table role="presentation" cellpadding="0" cellspacing="0">${htmlRows}</table></td></tr>
        <tr><td style="font-size:13px;line-height:20px;color:${c.muted};padding-bottom:8px">${escapeHtml(t("message"))}</td></tr>
        <tr><td style="font-size:16px;line-height:26px;white-space:pre-wrap">${escapeHtml(input.message)}</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `${t("intro")}\n\n${rows.map(([label, value]) => `${label}: ${value}`).join("\n")}\n\n${t("message")}:\n${input.message}\n`;

  return { to: input.to, replyTo: input.email, subject: t("mailSubject", { subject: input.subject }), text, html };
}
