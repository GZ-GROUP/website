import sharp from "sharp";
import { expect, test, type Browser, type Page } from "@playwright/test";
import { E2E_ADMIN } from "../../playwright.config";
import { newUser, register, signIn } from "./helpers";

// Runs before editorial.spec.ts (alphabetical, one worker) and after admin.spec.ts,
// which set the admin password. Creates its own Writer and published article.

type User = ReturnType<typeof newUser>;

async function signedIn(browser: Browser, identifier: string, password: string): Promise<Page> {
  const page = await (await browser.newContext()).newPage();
  await signIn(page, identifier, password);
  await expect(page).toHaveURL(/\/account$/);
  return page;
}

async function publishArticle(page: Page, title: string): Promise<string> {
  await page.goto("/studio");
  await page.getByRole("main").getByRole("button", { name: "Nuevo artículo" }).click();
  await expect(page).toHaveURL(/\/studio\/[a-z0-9]+$/);
  await page.getByLabel("Título", { exact: true }).fill(title);
  await page.getByLabel("Resumen").fill("Un artículo para probar comentarios y likes.");
  await page.getByRole("textbox", { name: "Contenido" }).click();
  await page.keyboard.type("Contenido suficiente para publicar este artículo de prueba.");
  const png = await sharp({ create: { width: 1200, height: 750, channels: 3, background: "#12d0ed" } }).png().toBuffer();
  await page.getByTestId("cover-input").setInputFiles({ name: "cover.png", mimeType: "image/png", buffer: png });
  await page.getByLabel("Texto alternativo de la portada").fill("Portada de prueba");
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Guardado" })).toBeVisible();
  await page.getByRole("button", { name: "Publicar", exact: true }).click();
  const published = page.getByRole("link", { name: "Ver publicado" });
  await expect(published).toBeVisible();
  const href = await published.getAttribute("href");
  if (!href) throw new Error("article link without href");
  return href;
}

const likeButton = (page: Page) => page.getByRole("button", { name: /^Me gusta/ });
const metric = (page: Page, label: string) =>
  page.locator("dl > div").filter({ hasText: label }).locator("dd");

test.describe.serial("community", () => {
  const writer: User = newUser();
  const reader: User = newUser();
  const other: User = newUser();
  const marker = `basalt${Date.now().toString(36)}`;
  const title = `Notas de comunidad ${marker}`;
  let articlePath = "";

  test("setup: a Writer publishes an article, two Readers sign up", async ({ browser }) => {
    for (const user of [writer, reader, other]) {
      const context = await browser.newContext();
      await register(await context.newPage(), user);
      await context.close();
    }
    const admin = await signedIn(browser, E2E_ADMIN.email, E2E_ADMIN.password);
    await admin.goto("/admin");
    const row = admin.getByRole("row", { name: new RegExp(writer.username) });
    await row.getByRole("button", { name: `Hacer autor: ${writer.name}` }).click();
    await expect(row).toContainText("Autor");
    await admin.context().close();

    const page = await signedIn(browser, writer.email, writer.password);
    articlePath = await publishArticle(page, title);
    await page.context().close();
  });

  test("signed out: sees the conversation and returns to the article after login", async ({ page }) => {
    await page.goto(articlePath);
    await expect(page.getByRole("heading", { name: "Comentarios" })).toBeVisible();
    await expect(page.getByText("Sin comentarios")).toBeVisible();
    await expect(page.getByLabel("Escribe un comentario")).toHaveCount(0);

    await page.locator("#comments").getByRole("link", { name: "Ingresar" }).click();
    await expect(page).toHaveURL(/\/login\?next=/);
    await page.getByLabel("Email o nombre de usuario").fill(reader.email);
    await page.getByLabel("Contraseña").fill(reader.password);
    await page.getByRole("main").getByRole("button", { name: "Ingresar" }).click();
    await expect(page).toHaveURL(new RegExp(`${articlePath}`));
    await expect(page.getByLabel("Escribe un comentario")).toBeVisible();
  });

  test("login ignores an external next", async ({ page }) => {
    await page.goto(`/login?next=${encodeURIComponent("//evil.test/x")}`);
    await page.getByLabel("Email o nombre de usuario").fill(reader.email);
    await page.getByLabel("Contraseña").fill(reader.password);
    await page.getByRole("main").getByRole("button", { name: "Ingresar" }).click();
    await expect(page).toHaveURL(/\/account$/);
  });

  test("a Reader likes, unlikes, comments and replies; replies stay one level", async ({ browser }) => {
    const page = await signedIn(browser, reader.email, reader.password);
    await page.goto(articlePath);

    await expect(likeButton(page)).toHaveAttribute("aria-pressed", "false");
    await likeButton(page).click();
    await expect(likeButton(page)).toHaveAttribute("aria-pressed", "true");
    await expect(likeButton(page)).toContainText("1");
    await page.reload();
    await expect(likeButton(page)).toHaveAttribute("aria-pressed", "true");
    await expect(likeButton(page)).toContainText("1");

    await likeButton(page).click();
    await expect(likeButton(page)).toContainText("0");
    await page.reload();
    await expect(likeButton(page)).toHaveAttribute("aria-pressed", "false");
    await likeButton(page).click();
    await expect(likeButton(page)).toContainText("1");

    await page.getByLabel("Escribe un comentario").fill("<b>Primer</b> comentario");
    await page.getByRole("button", { name: "Comentar", exact: true }).click();
    // Rendered as text, never as markup.
    await expect(page.getByText("<b>Primer</b> comentario")).toBeVisible();
    await expect(page.getByText("1 comentario", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Escribe un comentario")).toHaveValue("");

    await page.getByRole("button", { name: `Responder a ${reader.name}` }).click();
    await page.getByLabel(`Tu respuesta a ${reader.name}`).fill("Una respuesta");
    await page.getByRole("button", { name: "Responder", exact: true }).click();
    const replies = page.getByRole("list", { name: "Respuestas" });
    await expect(replies.getByText("Una respuesta")).toBeVisible();
    await expect(replies.getByRole("button", { name: /^Responder a/ })).toHaveCount(0);
    await page.context().close();
  });

  test("the dashboard reports exactly what the Reader did", async ({ browser }) => {
    const page = await signedIn(browser, reader.email, reader.password);
    await page.goto("/dashboard");
    await expect(metric(page, "Artículos vistos")).toHaveText("1");
    await expect(metric(page, "Likes dados")).toHaveText("1");
    await expect(metric(page, "Comentarios hechos")).toHaveText("2");
    await expect(page.getByRole("region", { name: "Leído recientemente" }).getByRole("link", { name: title })).toBeVisible();
    await expect(page.getByRole("region", { name: "Te gustaron" }).getByRole("link", { name: title })).toBeVisible();
    await page.context().close();
  });

  test("a new account starts at zero, with honest empty states", async ({ browser }) => {
    const page = await signedIn(browser, other.email, other.password);
    await page.goto("/dashboard");
    await expect(metric(page, "Artículos vistos")).toHaveText("0");
    await expect(page.getByText("Los artículos que abras aparecerán aquí.")).toBeVisible();
    await page.context().close();
  });

  test("the profile shows real statistics and keeps private activity private", async ({ browser, page }) => {
    await page.goto(`/u/${reader.username}`);
    await expect(metric(page, "Comentarios")).toHaveText("2");
    await expect(page.getByText("<b>Primer</b> comentario")).toBeVisible();
    await expect(page.getByText("Likes dados")).toHaveCount(0);
    await expect(page.getByText("Artículos vistos")).toHaveCount(0);

    const writerPage = await (await browser.newContext()).newPage();
    await writerPage.goto(`/u/${writer.username}`);
    await expect(metric(writerPage, "Publicaciones")).toHaveText("1");
    await expect(metric(writerPage, "Likes recibidos")).toHaveText("1");
    await writerPage.context().close();
  });

  test("another user cannot delete a comment; the server refuses a replayed call", async ({ browser }) => {
    const owner = await signedIn(browser, reader.email, reader.password);
    await owner.goto(articlePath);
    await owner.getByRole("button", { name: `Eliminar comentario de ${reader.name}` }).first().click();
    const actionRequest = owner.waitForRequest((req) => req.method() === "POST" && !!req.headers()["next-action"]);

    const intruder = await signedIn(browser, other.email, other.password);
    await intruder.goto(articlePath);
    await expect(intruder.getByText("<b>Primer</b> comentario")).toBeVisible();
    await expect(intruder.getByRole("button", { name: /^Eliminar comentario/ })).toHaveCount(0);

    // Capture the owner's real delete call without letting it run, then replay it as the intruder.
    await owner.route("**/*", (route) =>
      route.request().method() === "POST" && route.request().headers()["next-action"] ? route.abort() : route.continue(),
    );
    await owner.getByRole("button", { name: "Sí, eliminar" }).click();
    const request = await actionRequest;
    const headers = Object.fromEntries(
      Object.entries(request.headers()).filter(([k]) => ["next-action", "content-type", "accept"].includes(k)),
    );
    const replay = await intruder.context().request.post(request.url(), { headers, data: request.postDataBuffer() ?? undefined });
    expect(await replay.text()).toContain("FORBIDDEN");

    await intruder.reload();
    await expect(intruder.getByText("<b>Primer</b> comentario")).toBeVisible();
    await owner.context().close();
    await intruder.context().close();
  });

  test("deleting a parent with replies leaves a tombstone", async ({ browser }) => {
    const page = await signedIn(browser, reader.email, reader.password);
    await page.goto(articlePath);
    const parent = page.locator("article[id^=comment-]").filter({ hasText: "<b>Primer</b> comentario" });
    await parent.getByRole("button", { name: `Eliminar comentario de ${reader.name}` }).click();
    await page.getByRole("button", { name: "Sí, eliminar" }).click();
    await expect(page.getByText("Comentario eliminado")).toBeVisible();
    await expect(page.getByText("<b>Primer</b> comentario")).toHaveCount(0);
    await expect(page.getByText("Una respuesta")).toBeVisible();
    await page.context().close();
  });

  test("the admin moderates from /admin/comments; a Reader gets 404 there", async ({ browser }) => {
    const readerPage = await signedIn(browser, other.email, other.password);
    const denied = await readerPage.goto("/admin/comments");
    expect(denied?.status()).toBe(404);
    await readerPage.context().close();

    const admin = await signedIn(browser, E2E_ADMIN.email, E2E_ADMIN.password);
    await admin.goto("/admin/comments");
    const row = admin.getByRole("row").filter({ hasText: "Una respuesta" });
    await row.getByRole("button", { name: `Eliminar comentario de ${reader.name}` }).click();
    await row.getByRole("button", { name: "Sí, eliminar" }).click();
    await expect(admin.getByRole("row").filter({ hasText: "Una respuesta" })).toHaveCount(0);

    await admin.goto(articlePath);
    // Last reply of a tombstoned parent: nothing is left to show.
    await expect(admin.getByText("Comentario eliminado")).toHaveCount(0);
    await expect(admin.getByText("Sin comentarios")).toBeVisible();
    await admin.context().close();
  });

  test("/team lists people with published work", async ({ page }) => {
    // ISR: the first visit after publishing may still get the previous copy.
    await expect(async () => {
      await page.goto("/team");
      await expect(page.getByRole("link", { name: writer.name })).toBeVisible({ timeout: 1_000 });
    }).toPass({ timeout: 20_000 });
    await expect(page.getByRole("heading", { name: "Equipo", level: 1 })).toBeVisible();
    await expect(page.getByText("1 publicación").first()).toBeVisible();
  });

  test("commenting too fast is refused with a clear message", async ({ browser }) => {
    const page = await signedIn(browser, other.email, other.password);
    await page.goto(articlePath);
    const field = page.getByLabel("Escribe un comentario");
    for (let i = 1; i <= 5; i++) {
      await field.fill(`Ráfaga ${i}`);
      await page.getByRole("button", { name: "Comentar", exact: true }).click();
      await expect(page.getByText(`Ráfaga ${i}`, { exact: true })).toBeVisible();
    }
    await field.fill("Una de más");
    await page.getByRole("button", { name: "Comentar", exact: true }).click();
    await expect(page.getByText("Estás comentando muy seguido", { exact: false })).toBeVisible();
    await page.context().close();
  });
});
