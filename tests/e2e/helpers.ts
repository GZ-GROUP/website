import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { expect, type Page } from "@playwright/test";

const MAILBOX = path.join(process.cwd(), ".e2e", "mailbox");

type Mail = { to: string; subject: string; text: string; html: string };

/** Waits for the newest email to `to` (optionally with this subject) — EMAIL_TRANSPORT=file. */
export async function latestMailTo(to: string, subject?: string, timeoutMs = 10_000): Promise<Mail> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const files = (await readdir(MAILBOX).catch(() => [] as string[])).sort().reverse();
    for (const file of files) {
      const mail = JSON.parse(await readFile(path.join(MAILBOX, file), "utf8")) as Mail;
      if (mail.to.toLowerCase() === to.toLowerCase() && (!subject || mail.subject === subject)) return mail;
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`No email to ${to} within ${timeoutMs}ms`);
}

export function linkIn(mail: Mail): string {
  const match = /https?:\/\/\S+/.exec(mail.text);
  if (!match) throw new Error(`No link in email "${mail.subject}"`);
  return match[0];
}

let counter = 0;
/** A fresh, valid user for each test. */
export function newUser() {
  const id = `${Date.now().toString(36)}${(counter++).toString(36)}`;
  return {
    name: `Ana Pérez ${id}`,
    username: `ana_${id}`,
    email: `ana.${id}@example.test`,
    password: `correct-horse-${id}`,
  };
}

export async function register(page: Page, user: ReturnType<typeof newUser>) {
  await page.goto("/register");
  await page.getByLabel("Nombre", { exact: true }).fill(user.name);
  await page.getByLabel("Nombre de usuario").fill(user.username);
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Contraseña").fill(user.password);
  await page.getByRole("main").getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page).toHaveURL(/\/account$/);
}

export async function signIn(page: Page, identifier: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email o nombre de usuario").fill(identifier);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("main").getByRole("button", { name: "Ingresar" }).click();
}
