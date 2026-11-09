import { expect, test, type Page } from "@playwright/test";
import { E2E_ADMIN } from "../../playwright.config";
import { latestMailTo } from "./helpers";

let ipCounter = 0;
/** Each test is its own visitor, so the per-address limit doesn't carry over. */
async function asNewVisitor(page: Page) {
  ipCounter += 1;
  await page.setExtraHTTPHeaders({ "x-forwarded-for": `203.0.113.${ipCounter}` });
}

async function fillForm(page: Page, subject: string, message = "Hola, quería hacer una consulta sobre el sitio.") {
  await page.getByLabel("Nombre", { exact: true }).fill("Ana Pérez");
  await page.getByLabel("Email").fill("ana@example.test");
  await page.getByLabel("Teléfono (opcional)").fill("+507 6000-0000");
  await page.getByLabel("Organización (opcional)").fill("ACME");
  await page.getByLabel("Motivo").selectOption("general");
  await page.getByLabel("Asunto").fill(subject);
  await page.getByLabel("Mensaje").fill(message);
  await page.getByRole("checkbox").check();
}

const send = (page: Page) => page.getByRole("button", { name: "Enviar mensaje" }).click();
const SENT = "Mensaje enviado.";

test("the navbar, the hero and the footer lead to the contact page", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("navigation", { name: "Explorar" }).getByRole("link")).toHaveText([
    "Blog",
    "Nosotros",
    "Contáctanos",
  ]);
  await expect(page.getByRole("main").getByRole("link", { name: "Leer el blog" })).toHaveCount(0);

  await page.getByRole("main").getByRole("link", { name: "Contáctanos" }).first().click();
  await expect(page).toHaveURL(/\/contact$/);
  await expect(page.getByRole("heading", { name: "Contáctanos", level: 1 })).toBeVisible();

  await page.goto("/");
  await page.getByRole("banner").getByRole("link", { name: "Contáctanos" }).click();
  await expect(page).toHaveURL(/\/contact$/);
  await expect(page.getByRole("banner").getByRole("link", { name: "Contáctanos" })).toHaveAttribute("aria-current", "page");
});

test("a message reaches the master admin from the no-reply sender, ready to answer", async ({ page }) => {
  await asNewVisitor(page);
  await page.goto("/contact");
  const subject = `Consulta ${Date.now().toString(36)}`;
  await fillForm(page, subject, "Primera línea\n<script>alert(1)</script>");
  await send(page);
  await expect(page.getByText(SENT)).toBeVisible();

  const mail = (await latestMailTo(E2E_ADMIN.email, `Contacto web: ${subject}`)) as Awaited<ReturnType<typeof latestMailTo>> & {
    replyTo: string;
  };
  expect(mail.replyTo).toBe("ana@example.test");
  for (const value of ["Ana Pérez", "ana@example.test", "+507 6000-0000", "ACME", "Consulta general", subject, "Primera línea"]) {
    expect(mail.text).toContain(value);
  }
  expect(mail.html).not.toContain("<script>alert(1)");

  await page.getByRole("button", { name: "Enviar otro mensaje" }).click();
  await expect(page.getByLabel("Asunto")).toHaveValue("");
});

test("mistakes are explained on each field and what was typed is kept", async ({ page }) => {
  await asNewVisitor(page);
  await page.goto("/contact");
  await page.getByLabel("Nombre", { exact: true }).fill("Ana");
  await page.getByLabel("Email").fill("no-es-un-email");
  await page.getByLabel("Mensaje").fill("corto");
  await send(page);

  await expect(page.getByText("Ese email no es válido.")).toBeVisible();
  await expect(page.getByText("Escribe al menos 10 caracteres.")).toBeVisible();
  await expect(page.getByText("Debes aceptar la Política de privacidad")).toBeVisible();
  await expect(page.getByLabel("Nombre", { exact: true })).toHaveValue("Ana");
  await expect(page.getByLabel("Email")).toHaveValue("no-es-un-email");
  await expect(page.getByText(SENT)).toHaveCount(0);
});

test("the hidden trap field sends nothing", async ({ page }) => {
  await asNewVisitor(page);
  await page.goto("/contact");
  const subject = `Bot ${Date.now().toString(36)}`;
  await fillForm(page, subject);
  await page.locator('input[name="website"]').fill("https://spam.test");
  await send(page);
  await expect(page.getByText(SENT)).toBeVisible();
  await expect(latestMailTo(E2E_ADMIN.email, `Contacto web: ${subject}`, 1_500)).rejects.toThrow();
});

test("the sixth message in a row from one address is refused", async ({ page }) => {
  await asNewVisitor(page);
  await page.goto("/contact");
  for (let i = 1; i <= 5; i++) {
    await fillForm(page, `Ráfaga ${i}`);
    await send(page);
    await expect(page.getByText(SENT)).toBeVisible();
    await page.getByRole("button", { name: "Enviar otro mensaje" }).click();
  }
  await fillForm(page, "Una de más");
  await send(page);
  await expect(page.getByText("Enviaste varios mensajes seguidos")).toBeVisible();
  await expect(page.getByLabel("Asunto")).toHaveValue("Una de más");
});

test("the FAQ works from the keyboard and never explains how to become an author", async ({ page }) => {
  await page.goto("/contact");
  const question = page.getByRole("button", { name: "¿Qué es GZ Group?" });
  await question.focus();
  await page.keyboard.press("Enter");
  await expect(question).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByText("Una comunidad de desarrolladores que publica")).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(question).toHaveAttribute("aria-expanded", "false");

  await expect(page.getByRole("main")).not.toContainText(/ser autor|convertirte en autor|publicar con nosotros/i);
});

test("the English page is translated", async ({ page }) => {
  await page.goto("/en/contact");
  await expect(page.getByRole("heading", { name: "Contact us", level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Frequently asked questions" })).toBeVisible();
});
