import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import nodemailer, { type Transporter } from "nodemailer";
import { serverEnv } from "@/lib/env";

export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  html: string;
  /** Where a reply goes when it should not reach the no-reply sender. */
  replyTo?: string;
};

type TransportKind = "smtp" | "console" | "file";

// smtp: the self-hosted mail server (production, or dev when SMTP_HOST is set)
// console: development without SMTP — prints the message (and its links)
// file: end-to-end tests — writes JSON into .e2e/mailbox for Playwright to read
function transportKind(): TransportKind {
  const env = serverEnv();
  if (env.EMAIL_TRANSPORT) return env.EMAIL_TRANSPORT;
  if (env.SMTP_HOST) return "smtp";
  if (env.NODE_ENV === "production") {
    throw new Error("Email is not configured: set SMTP_HOST (and the other SMTP_* variables).");
  }
  return "console";
}

let transporter: Transporter | undefined;

function smtpTransport(): Transporter {
  if (transporter) return transporter;
  const env = serverEnv();
  if (!env.SMTP_HOST || !env.EMAIL_FROM) {
    throw new Error("SMTP transport needs SMTP_HOST and EMAIL_FROM.");
  }
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE, // true for implicit TLS (465); STARTTLS is negotiated otherwise
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } : undefined,
  });
  return transporter;
}

export const MAILBOX_DIR = path.join(process.cwd(), ".e2e", "mailbox");

export async function sendEmail(message: EmailMessage): Promise<void> {
  const kind = transportKind();

  if (kind === "smtp") {
    await smtpTransport().sendMail({ from: serverEnv().EMAIL_FROM, ...message });
    return;
  }

  if (kind === "file") {
    await mkdir(MAILBOX_DIR, { recursive: true });
    const file = `${Date.now()}-${message.to.replace(/[^a-z0-9@._-]/gi, "_")}.json`;
    await writeFile(path.join(MAILBOX_DIR, file), JSON.stringify(message, null, 2));
    return;
  }

  console.info(`\n[email] to: ${message.to}\n[email] subject: ${message.subject}\n${message.text}\n`);
}
