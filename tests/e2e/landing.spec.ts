import { expect, test } from "@playwright/test";

test.describe("landing", () => {
  test("renders in Spanish at / and English at /en", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "es");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Software hecho por talento emergente");

    await page.goto("/en");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Software built by emerging talent");
  });

  test("the language switcher keeps the current page", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: "Ver en English" }).click();
    await expect(page).toHaveURL(/\/en\/login$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Sign in");
  });

  test("never mentions becoming an author publicly", async ({ page }) => {
    for (const path of ["/", "/en", "/register"]) {
      await page.goto(path);
      await expect(page.locator("body")).not.toContainText(/invita a nuevos autores|invites new authors/i);
    }
  });
});
