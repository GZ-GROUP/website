import sharp from "sharp";
import { expect, test, type Browser, type Page, type Request } from "@playwright/test";
import { E2E_ADMIN } from "../../playwright.config";
import { newUser, register, signIn } from "./helpers";

// Runs after admin.spec.ts (alphabetical, one worker), which set the admin password.

async function promote(browser: Browser, ...users: ReturnType<typeof newUser>[]) {
  const page = await (await browser.newContext()).newPage();
  await signIn(page, E2E_ADMIN.email, E2E_ADMIN.password);
  await expect(page).toHaveURL(/\/account$/);
  await page.goto("/admin");
  for (const user of users) {
    const row = page.getByRole("row", { name: new RegExp(user.username) });
    await row.getByRole("button", { name: `Hacer autor: ${user.name}` }).click();
    await expect(row).toContainText("Autor");
  }
  await page.context().close();
}

async function signedIn(browser: Browser, user: ReturnType<typeof newUser>): Promise<Page> {
  const page = await (await browser.newContext()).newPage();
  await signIn(page, user.email, user.password);
  await expect(page).toHaveURL(/\/account$/);
  return page;
}

function captureNextAction(page: Page): Promise<Request> {
  return new Promise((resolve) =>
    page.on("request", (req) => {
      if (req.method() === "POST" && req.headers()["next-action"]) resolve(req);
    }),
  );
}

async function replay(page: Page, request: { url: string; headers: Record<string, string>; body: Buffer }) {
  const headers = Object.fromEntries(
    Object.entries(request.headers).filter(([k]) => ["next-action", "content-type", "accept", "next-router-state-tree"].includes(k)),
  );
  return page.context().request.post(request.url, { headers, data: request.body });
}

test.describe.serial("editorial workflow", () => {
  const author = newUser();
  const coAuthor = newUser();
  const reader = newUser();
  const marker = `zircon${Date.now().toString(36)}`;
  const title = `Compilador de juguete en Rust ${marker}`;
  let articleUrl = "";
  let archiveRequest: { url: string; headers: Record<string, string>; body: Buffer } | undefined;

  test("setup: three accounts, two promoted to Writer", async ({ browser }) => {
    for (const user of [author, coAuthor, reader]) {
      const context = await browser.newContext();
      await register(await context.newPage(), user);
      await context.close();
    }
    await promote(browser, author, coAuthor);
  });

  test("a writer writes, illustrates and publishes an article", async ({ browser }) => {
    const page = await signedIn(browser, author);
    await page.goto("/studio");
    await page.getByRole("main").getByRole("button", { name: "Nuevo artículo" }).click();
    await expect(page).toHaveURL(/\/studio\/[a-z0-9]+$/);

    await page.getByLabel("Título", { exact: true }).fill(title);
    await page.getByLabel("Resumen").fill("Un intérprete pequeño para aprender cómo funciona un compilador por dentro.");

    const content = page.getByRole("textbox", { name: "Contenido" });
    await content.click();
    await page.keyboard.type("Este proyecto implementa un lexer, un parser y un evaluador. ");
    await page.keyboard.type("Todo el código está pensado para leerse de principio a fin en una tarde.");

    await page.getByLabel("Categoría").selectOption("software");
    await page.getByLabel("Etiquetas").fill("rust");
    await page.keyboard.press("Enter");

    const png = await sharp({ create: { width: 1200, height: 750, channels: 3, background: "#12d0ed" } }).png().toBuffer();
    await page.getByTestId("cover-input").setInputFiles({ name: "cover.png", mimeType: "image/png", buffer: png });
    await page.getByLabel("Texto alternativo de la portada").fill("Diagrama del pipeline del compilador");

    await page.getByLabel("Coautores").fill(coAuthor.username.slice(0, 8));
    await page.getByRole("button", { name: new RegExp(coAuthor.username) }).click();

    await page.getByRole("button", { name: "Guardar", exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: "Guardado" })).toBeVisible();

    await page.getByRole("button", { name: "Publicar", exact: true }).click();
    await expect(page.getByText("Artículo publicado.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Ver publicado" })).toBeVisible();
    articleUrl = (await page.getByRole("link", { name: "Ver publicado" }).getAttribute("href"))!;
    expect(articleUrl).toMatch(/^\/blog\/compilador-de-juguete-en-rust-/);

    // Capture an archive request for the replay test, then restore and republish.
    const captured = captureNextAction(page);
    await page.getByRole("button", { name: "Detalles" }).click();
    await page.getByRole("menuitem", { name: "Archivar" }).click();
    const request = await captured;
    archiveRequest = { url: request.url(), headers: await request.allHeaders(), body: request.postDataBuffer()! };
    await expect(page.getByText("Este artículo está archivado")).toBeVisible();

    const archived = await page.request.get(articleUrl);
    expect(archived.status()).toBe(404); // archived articles are not public

    await page.getByRole("button", { name: "Detalles" }).click();
    await page.getByRole("menuitem", { name: "Restaurar" }).click();
    await page.getByRole("button", { name: "Publicar", exact: true }).click();
    await expect(page.getByRole("link", { name: "Ver publicado" })).toHaveAttribute("href", articleUrl); // slug is frozen
    await page.context().close();
  });

  test("the article appears on the blog, projects, landing and the author's profile", async ({ page }) => {
    await page.goto(articleUrl);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
    await expect(page.getByText("Este proyecto implementa un lexer")).toBeVisible();
    await expect(page.getByRole("link", { name: coAuthor.name })).toBeVisible();

    const cover = page.getByRole("img", { name: "Diagrama del pipeline del compilador" });
    await expect(cover).toBeVisible();
    const src = await cover.getAttribute("src");
    expect(src).toContain("/_next/image?url=");
    expect((await page.request.get(src!)).status()).toBe(200);
    const original = new URL(src!, "http://localhost").searchParams.get("url")!;
    expect(original).toMatch(/^\/media\/articles\/[0-9a-f-]{36}\.webp$/);
    const media = await page.request.get(original);
    expect(media.status()).toBe(200);
    expect(media.headers()["content-type"]).toBe("image/webp");
    expect(media.headers()["cache-control"]).toContain("immutable");

    for (const path of ["/blog", "/projects", "/", `/u/${author.username}`, `/u/${coAuthor.username}`]) {
      await page.goto(path);
      await expect(page.getByRole("link", { name: title })).toBeVisible();
    }
  });

  test("search, category and tag filters", async ({ page }) => {
    await page.goto(`/blog?q=${marker}`);
    await expect(page.getByRole("link", { name: title })).toBeVisible();
    await expect(page.getByText("1 artículo")).toBeVisible();

    await page.goto(`/blog?q=${marker}&category=tutorial`);
    await expect(page.getByText("No hay artículos que coincidan con estos filtros.")).toBeVisible();

    await page.goto(`/blog?tag=rust&q=${marker}`);
    await expect(page.getByRole("link", { name: title })).toBeVisible();
  });

  test("a co-author edits but cannot publish or archive", async ({ browser }) => {
    const page = await signedIn(browser, coAuthor);
    await page.goto("/studio");
    const row = page.getByRole("row", { name: new RegExp(marker) });
    await expect(row).toContainText("Coautor");
    await row.getByRole("link").first().click();
    await expect(page.getByText("Eres coautor")).toBeVisible();
    await expect(page.getByRole("button", { name: "Despublicar" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Detalles" })).toHaveCount(0);

    // Replaying the author's archive action is rejected by the per-article check.
    const response = await replay(page, archiveRequest!);
    expect(response.status()).toBe(200);
    expect(await response.text()).toContain("FORBIDDEN");
    expect((await page.request.get(articleUrl)).status()).toBe(200);
    await page.context().close();
  });

  test("readers can't reach the studio, upload, or replay studio actions", async ({ browser }) => {
    const page = await signedIn(browser, reader);
    expect((await page.goto("/studio"))?.status()).toBe(404);
    expect((await page.goto("/studio/whatever"))?.status()).toBe(404);

    const upload = await page.request.post("/api/uploads", {
      multipart: { file: { name: "x.png", mimeType: "image/png", buffer: Buffer.from("not an image") } },
    });
    expect(upload.status()).toBe(404);

    const response = await replay(page, archiveRequest!);
    expect(response.status()).not.toBe(200);
    expect((await page.request.get(articleUrl)).status()).toBe(200);
    await page.context().close();
  });

  test("anonymous visitors get 404 for the studio and media that doesn't exist", async ({ page }) => {
    expect((await page.goto("/studio"))?.status()).toBe(404);
    expect((await page.request.get("/media/articles/00000000-0000-0000-0000-000000000000.webp")).status()).toBe(404);
    expect((await page.request.get("/media/../../etc/passwd")).status()).toBe(404);
  });

  test("screenshots for design review", async ({ browser }) => {
    test.setTimeout(120_000);
    const page = await signedIn(browser, author);
    for (const width of [390, 768, 1440]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      for (const [name, path] of [
        ["blog", "/blog"],
        ["article", articleUrl],
        ["studio", "/studio"],
      ] as const) {
        await page.goto(path);
        await page.waitForLoadState("load");
        await page.screenshot({ path: `.e2e/screens/${name}-${width}.png`, fullPage: true });
      }
      await page.goto("/studio");
      await page.getByRole("row", { name: new RegExp(marker) }).getByRole("link").first().click();
      await page.waitForURL(/\/studio\/[a-z0-9]+$/);
      await page.getByRole("textbox", { name: "Contenido" }).waitFor();
      await page.screenshot({ path: `.e2e/screens/editor-${width}.png`, fullPage: true });
    }
    await page.context().close();
  });
});
