import sharp from "sharp";
import { expect, test, type Page } from "@playwright/test";
import { newUser, register } from "./helpers";

test.describe.configure({ timeout: 60_000 });

// The limit is 5 s of wall-clock time; the margin absorbs clock corrections in WSL.
const COOLDOWN = 7_000;

async function photo(background: string) {
  const buffer = await sharp({ create: { width: 1200, height: 600, channels: 3, background } }).png().toBuffer();
  return { name: "foto.png", mimeType: "image/png", buffer };
}

const preview = (page: Page) => page.getByTestId("avatar-preview").locator("img");
const choose = (page: Page, file: { name: string; mimeType: string; buffer: Buffer }) =>
  page.getByTestId("avatar-input").setInputFiles(file);

test("a Reader uploads, replaces and removes a profile photo", async ({ page }) => {
  const user = newUser();
  await register(page, user);
  await expect(page.getByRole("button", { name: "Subir foto" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Quitar foto" })).toHaveCount(0);

  await choose(page, await photo("#12d0ed"));
  await expect(page.getByText("Foto actualizada.")).toBeVisible();
  await expect(preview(page)).toHaveAttribute("src", /^\/media\/avatars\//);
  const first = (await preview(page).getAttribute("src"))!;

  const served = await page.request.get(first);
  expect(served.status()).toBe(200);
  expect(served.headers()["content-type"]).toBe("image/webp");
  const meta = await sharp(await served.body()).metadata();
  expect([meta.width, meta.height]).toEqual([512, 512]);

  // The header updates without a reload; the public profile shows it too.
  await expect(page.getByRole("banner").locator(`img[src="${first}"]`)).toBeVisible();
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.screenshot({ path: `.e2e/screens/account-avatar-${width}.png` });
  }
  await page.goto(`/u/${user.username}`);
  await expect(page.getByRole("main").locator(`img[src="${first}"]`)).toBeVisible();

  await page.goto("/account");
  await page.waitForTimeout(COOLDOWN);
  await choose(page, await photo("#2563eb"));
  await expect(page.getByText("Foto actualizada.")).toBeVisible();
  await expect(preview(page)).not.toHaveAttribute("src", first);
  // Replacing deletes the previous file.
  expect((await page.request.get(first)).status()).toBe(404);

  // Too soon after the last change.
  await page.getByRole("button", { name: "Quitar foto" }).click();
  await expect(page.getByText("Espera unos segundos")).toBeVisible();

  await page.waitForTimeout(COOLDOWN);
  const second = (await preview(page).getAttribute("src"))!;
  await page.getByRole("button", { name: "Quitar foto" }).click();
  await expect(page.getByText("Foto eliminada.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Subir foto" })).toBeVisible();
  await expect(preview(page)).toHaveCount(0);
  expect((await page.request.get(second)).status()).toBe(404);
});

test("the photo is already on screen when the upload is confirmed, even if it loads slowly", async ({ page }) => {
  await register(page, newUser());

  // Like a slow connection, or a route compiling for the first time in `next dev`.
  const seen = new Set<string>();
  await page.route("**/media/avatars/**", async (route) => {
    const url = route.request().url();
    if (!seen.has(url)) {
      seen.add(url);
      await new Promise((resolve) => setTimeout(resolve, 2_000));
    }
    await route.continue();
  });

  await choose(page, await photo("#12d0ed"));
  await expect(page.getByRole("button", { name: "Subiendo…" })).toBeVisible();
  await expect(page.getByText("Foto actualizada.")).toBeVisible({ timeout: 10_000 });
  await expect(preview(page)).toBeVisible({ timeout: 500 });
  await expect(page.getByRole("banner").locator('img[src^="/media/avatars/"]')).toBeVisible({ timeout: 500 });
});

test("files that are not valid photos are refused with a clear message", async ({ page }) => {
  await register(page, newUser());

  await choose(page, { name: "foto.png", mimeType: "image/png", buffer: Buffer.from("esto no es una imagen") });
  await expect(page.getByText("No se pudo leer esa imagen")).toBeVisible();

  await choose(page, { name: "grande.png", mimeType: "image/png", buffer: Buffer.alloc(5 * 1024 * 1024 + 1) });
  await expect(page.getByText("La imagen pesa más de 5 MB")).toBeVisible();
  await expect(preview(page)).toHaveCount(0);
});

test("the API requires a session and cannot point a photo at an outside URL", async ({ page, baseURL }) => {
  const anonymous = await page.request.post("/api/account/avatar", {
    multipart: { file: await photo("#12d0ed") },
  });
  expect(anonymous.status()).toBe(401);
  expect((await page.request.delete("/api/account/avatar")).status()).toBe(401);

  await register(page, newUser());
  const update = await page.request.post("/api/auth/update-user", {
    headers: { origin: baseURL! },
    data: { image: "https://evil.test/pixel.png" },
  });
  expect(update.ok()).toBe(true);
  const session = (await (await page.request.get("/api/auth/get-session")).json()) as { user: { image: string | null } };
  expect(session.user.image ?? null).toBeNull();
});
