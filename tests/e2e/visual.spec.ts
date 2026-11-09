import { test } from "@playwright/test";
import { E2E_ADMIN } from "../../playwright.config";
import { newUser, register, signIn } from "./helpers";

// Screenshots for design review (not pixel assertions), at phone, tablet and
// desktop widths. Runs after admin.spec.ts, which sets the admin password below.
// Screenshot tests visit many pages; give them room beyond the 30s default.
test.describe.configure({ timeout: 120_000 });

const VIEWPORTS = [
  { name: "390", width: 390, height: 844 },
  { name: "768", width: 768, height: 1024 },
  { name: "1440", width: 1440, height: 900 },
];
const PUBLIC_PAGES = ["/login", "/register", "/forgot-password", "/en/login"];
const ADMIN_PASSWORD = "e2e-changed-master-password";

const shot = (path: string, width: string) =>
  `.e2e/screens/${path.replaceAll("/", "_").replace(/^_/, "") || "home"}-${width}.png`;

for (const viewport of VIEWPORTS) {
  test(`auth screens at ${viewport.name}px`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    for (const path of PUBLIC_PAGES) {
      await page.goto(path);
      await page.waitForLoadState("load");
      await page.screenshot({ path: shot(path, viewport.name), fullPage: true });
    }
  });

  test(`signed-in screens at ${viewport.name}px`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    const user = newUser();
    await register(page, user);
    for (const path of ["/account", "/dashboard", "/team", `/u/${user.username}`]) {
      await page.goto(path);
      await page.waitForLoadState("load");
      await page.screenshot({ path: shot(path.startsWith("/u/") ? "/profile" : path, viewport.name), fullPage: true });
    }

    await page.goto(`/blog?q=${encodeURIComponent("Notas de comunidad")}`);
    await page.getByRole("main").getByRole("heading", { level: 2 }).getByRole("link").first().click();
    await page.waitForURL(/\/blog\/.+/);
    await page.locator("#comments").scrollIntoViewIfNeeded();
    await page.screenshot({ path: shot("/article-comments", viewport.name), fullPage: true });

    await page.context().clearCookies();
    await signIn(page, E2E_ADMIN.email, ADMIN_PASSWORD);
    await page.waitForURL(/\/account$/);
    await page.goto("/admin");
    await page.waitForLoadState("load");
    await page.screenshot({ path: shot("/admin", viewport.name), fullPage: true });
    await page.goto("/admin/comments");
    await page.waitForLoadState("load");
    await page.screenshot({ path: shot("/admin/comments", viewport.name), fullPage: true });
  });
}
