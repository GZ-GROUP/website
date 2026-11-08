import { expect, test, type Request } from "@playwright/test";
import { E2E_ADMIN } from "../../playwright.config";
import { newUser, register, signIn } from "./helpers";

test.describe.serial("master admin and RBAC", () => {
  const readerA = newUser();
  const readerB = newUser();
  const adminPassword = "e2e-changed-master-password";
  let promoteRequest: { url: string; headers: Record<string, string>; body: Buffer } | undefined;

  test("readers get a 404 on /admin", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await register(page, readerA);
    const response = await page.goto("/admin");
    expect(response?.status()).toBe(404);
    await context.close();

    const other = await browser.newContext();
    await register(await other.newPage(), readerB);
    await other.close();
  });

  test("first sign-in forces the master admin to change the initial password", async ({ page }) => {
    await signIn(page, E2E_ADMIN.email, E2E_ADMIN.initialPassword);
    await expect(page).toHaveURL(/\/account\/password$/);
    await expect(page.getByRole("main").getByRole("alert")).toContainText("cambia la contraseña inicial");

    // Every other private page sends it back here until the password changes.
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/account\/password$/);

    await page.getByLabel("Contraseña actual").fill(E2E_ADMIN.initialPassword);
    await page.getByLabel("Nueva contraseña", { exact: true }).fill(adminPassword);
    await page.getByLabel("Repite la nueva contraseña").fill(adminPassword);
    await page.getByRole("main").getByRole("button", { name: "Cambiar contraseña" }).click();
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Usuarios");
  });

  test("the master admin promotes a Reader to Writer and back", async ({ page }) => {
    await signIn(page, E2E_ADMIN.email, adminPassword);
    await expect(page).toHaveURL(/\/account$/);
    await page.goto("/admin");

    const row = page.getByRole("row", { name: new RegExp(readerA.username) });
    await expect(row).toContainText("Lector");

    // Capture the server action request so another user can replay it later.
    const captured = new Promise<Request>((resolve) =>
      page.on("request", (req) => {
        if (req.method() === "POST" && req.headers()["next-action"]) resolve(req);
      }),
    );
    await row.getByRole("button", { name: `Hacer autor: ${readerA.name}` }).click();
    await expect(row).toContainText("Autor");
    const request = await captured;
    promoteRequest = { url: request.url(), headers: await request.allHeaders(), body: request.postDataBuffer()! };

    // The public profile shows the author badge.
    await page.goto(`/u/${readerA.username}`);
    await expect(page.getByText("Autor", { exact: true })).toBeVisible();

    // Back to Reader.
    await page.goto("/admin");
    await row.getByRole("button", { name: `Quitar autor: ${readerA.name}` }).click();
    await expect(row).toContainText("Lector");
  });

  test("a Reader replaying the admin's server action is rejected on the server", async ({ browser }) => {
    expect(promoteRequest).toBeDefined();
    const context = await browser.newContext();
    const page = await context.newPage();
    await signIn(page, readerB.email, readerB.password);
    await expect(page).toHaveURL(/\/account$/);

    const { url, headers, body } = promoteRequest!;
    const forwarded = Object.fromEntries(
      Object.entries(headers).filter(([key]) => ["next-action", "content-type", "accept", "next-router-state-tree"].includes(key)),
    );
    const response = await context.request.post(url, { headers: forwarded, data: body });
    expect(response.status()).not.toBe(200);
    await context.close();

    // Verify as the admin that nothing changed.
    const adminPage = await (await browser.newContext()).newPage();
    await signIn(adminPage, E2E_ADMIN.email, adminPassword);
    await expect(adminPage).toHaveURL(/\/account$/);
    await adminPage.goto("/admin");
    await expect(adminPage.getByRole("row", { name: new RegExp(readerA.username) })).toContainText("Lector");
  });
});
