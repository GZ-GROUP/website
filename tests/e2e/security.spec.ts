import sharp from "sharp";
import { expect, test, type Page } from "@playwright/test";
import { E2E_ADMIN } from "../../playwright.config";
import { newUser, register, signIn } from "./helpers";

// Runs after community.spec.ts (alphabetical), which published "Notas de comunidad".
test.describe.configure({ timeout: 120_000 });

async function communityArticle(page: Page): Promise<string> {
  await page.goto(`/blog?q=${encodeURIComponent("Notas de comunidad")}`);
  const href = await page.getByRole("main").getByRole("heading", { level: 2 }).getByRole("link").first().getAttribute("href");
  if (!href) throw new Error("community article not found");
  return href;
}

/** Collects every Content-Security-Policy violation, from before the page's first script. */
async function watchCsp(page: Page) {
  await page.addInitScript(() => {
    (window as unknown as { __csp: string[] }).__csp = [];
    document.addEventListener("securitypolicyviolation", (event) => {
      (window as unknown as { __csp: string[] }).__csp.push(`${event.violatedDirective} ${event.blockedURI}`);
    });
  });
}
const violations = (page: Page) => page.evaluate(() => (window as unknown as { __csp: string[] }).__csp);

async function promotedWriter(page: Page) {
  const writer = newUser();
  await page.context().clearCookies(); // including the language chosen by visiting /en
  await register(page, writer);
  await page.context().clearCookies();
  await signIn(page, E2E_ADMIN.email, E2E_ADMIN.password);
  await page.waitForURL(/\/account$/);
  await page.goto("/admin");
  await page.getByRole("button", { name: `Hacer autor: ${writer.name}` }).click();
  await expect(page.getByRole("row", { name: new RegExp(writer.username) })).toContainText("Autor");
  await page.context().clearCookies();
  await signIn(page, writer.email, writer.password);
  await page.waitForURL(/\/account$/);
  return writer;
}

const smallPng = () => sharp({ create: { width: 40, height: 40, channels: 3, background: "#12d0ed" } }).png().toBuffer();

test("responses carry the security headers", async ({ request }) => {
  const headers = (await request.get("/")).headers();
  expect(headers["content-security-policy"]).toContain("default-src 'self'");
  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(headers["strict-transport-security"]).toContain("max-age=");
  expect(headers["x-powered-by"]).toBeUndefined();
});

test("no page triggers a Content-Security-Policy violation", async ({ page }) => {
  await watchCsp(page);
  const article = await communityArticle(page);
  const found: Record<string, string[]> = {};
  const visit = async (path: string) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    const list = await violations(page);
    if (list.length) found[path] = list;
  };

  for (const path of ["/", "/en", "/blog", "/projects", "/team", "/privacy", "/terms", "/login", "/register", article]) await visit(path);

  await promotedWriter(page);
  for (const path of ["/account", "/dashboard", "/studio", article]) await visit(path);

  // The editor, with an image upload: the most script- and style-heavy screen.
  await page.goto("/studio");
  await page.getByRole("main").getByRole("button", { name: "Nuevo artículo" }).click();
  await expect(page).toHaveURL(/\/studio\/[a-z0-9]+$/);
  await page.getByRole("textbox", { name: "Contenido" }).click();
  await page.keyboard.type("Comprobando la política de seguridad del editor.");
  await page.getByTestId("cover-input").setInputFiles({ name: "c.png", mimeType: "image/png", buffer: await smallPng() });
  await expect(page.locator("img[src^='/media/articles/']").first()).toBeVisible();
  const editor = await violations(page);
  if (editor.length) found.editor = editor;

  expect(found).toEqual({});
});

test("the health check answers without details", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ status: "ok" });
});

test("a server failure shows our screen, with a reference and a way out", async ({ page }) => {
  await page.goto("/e2e-error");
  await expect(page.getByRole("heading", { name: "Algo salió mal", level: 1 })).toBeVisible();
  await expect(page.getByText(/Referencia del error: \S+/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Intentar de nuevo" })).toBeVisible();
  await expect(page.getByText("Deliberate failure")).toHaveCount(0);

  await page.getByRole("link", { name: "Volver al inicio" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Software");
});

test("liking too fast is refused with a clear message", async ({ page }) => {
  const article = await communityArticle(page);
  await register(page, newUser());
  await page.goto(article);
  const like = page.getByRole("button", { name: /^Me gusta/ });
  for (let i = 0; i < 30; i++) {
    const pressed = await like.getAttribute("aria-pressed");
    await like.click();
    await expect(like).not.toHaveAttribute("aria-pressed", pressed!);
    // Each toggle has to be confirmed before the next one, like a real double-check.
    await expect(page.getByText("Vas muy rápido")).toHaveCount(0);
    await page.waitForLoadState("networkidle");
  }
  await like.click();
  await expect(page.getByText("Vas muy rápido. Espera un momento.")).toBeVisible();
});

test("uploading too fast is refused", async ({ page }) => {
  await promotedWriter(page);
  const file = { name: "c.png", mimeType: "image/png", buffer: await smallPng() };
  const statuses: number[] = [];
  for (let i = 0; i < 21; i++) {
    statuses.push((await page.request.post("/api/uploads", { multipart: { file } })).status());
  }
  expect(statuses.slice(0, 20).every((status) => status === 201)).toBe(true);
  expect(statuses[20]).toBe(429);
});
