import { expect, test, type Page } from "@playwright/test";
import { E2E_ADMIN } from "../../playwright.config";
import { newUser, register, signIn } from "./helpers";

// Runs after admin.spec.ts (alphabetical), which set the admin password.

const tabs = (page: Page) => page.getByRole("navigation", { name: "Secciones de ajustes" }).getByRole("link");

async function menuItems(page: Page) {
  await page.getByRole("banner").getByRole("button", { name: /Menú de tu cuenta/ }).click();
  const items = page.getByRole("menuitem");
  await expect(items.first()).toBeVisible();
  return items.allTextContents();
}

test("the navbar has no Blog and says Nosotros; the footer keeps Blog", async ({ page }) => {
  await page.goto("/");
  const banner = page.getByRole("banner");
  await expect(banner.getByRole("link", { name: "Blog", exact: true })).toHaveCount(0);
  await expect(banner.getByRole("link", { name: "Equipo" })).toHaveCount(0);
  await expect(banner.getByRole("link", { name: "Nosotros" })).toBeVisible();
  await expect(page.getByRole("contentinfo").getByRole("link", { name: "Blog", exact: true })).toBeVisible();

  await page.goto("/en");
  await expect(page.getByRole("banner").getByRole("link", { name: "About us" })).toBeVisible();
});

test("a Reader's menu holds only profile and settings, and Settings holds the activity", async ({ page }) => {
  const reader = newUser();
  await register(page, reader);
  await page.waitForLoadState("networkidle");

  expect(await menuItems(page)).toEqual(["Mi perfil", "Ajustes", "Cerrar sesión"]);
  await page.keyboard.press("Escape");

  await expect(tabs(page)).toHaveText(["Cuenta", "Mi actividad"]);
  await page.getByRole("link", { name: "Mi actividad" }).click();
  await expect(page).toHaveURL(/\/account\/activity$/);
  await expect(page.getByRole("heading", { name: "Mi actividad", level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: "Mi actividad" })).toHaveAttribute("aria-current", "page");

  expect((await page.goto("/admin"))?.status()).toBe(404);
  expect((await page.goto("/dashboard"))?.status()).toBe(404);
});

test("the master admin reaches Administration from Settings, not from the menu", async ({ page }) => {
  await signIn(page, E2E_ADMIN.email, E2E_ADMIN.password);
  await expect(page).toHaveURL(/\/account$/);
  await page.waitForLoadState("networkidle");

  const items = await menuItems(page);
  expect(items).not.toContain("Administración");
  expect(items).not.toContain("Mi actividad");
  expect(items.indexOf("Estudio")).toBeGreaterThanOrEqual(0);
  expect(items.indexOf("Estudio")).toBeLessThan(items.indexOf("Ajustes"));
  await page.keyboard.press("Escape");

  await expect(tabs(page)).toHaveText(["Cuenta", "Mi actividad", "Administración"]);
  await page.getByRole("link", { name: "Administración" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await page.getByRole("link", { name: "Volver a ajustes" }).click();
  await expect(page).toHaveURL(/\/account$/);
});

test("the phone menu follows the same order", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await register(page, newUser());
  await page.getByRole("button", { name: "Abrir menú" }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("link", { name: "Blog", exact: true })).toHaveCount(0);
  await expect(dialog.getByRole("link", { name: "Mi perfil" })).toBeVisible();
  await expect(dialog.getByRole("link", { name: "Ajustes" })).toBeVisible();
  await expect(dialog.getByRole("link", { name: "Mi actividad" })).toHaveCount(0);
  await expect(dialog.getByRole("link", { name: "Administración" })).toHaveCount(0);
  await page.screenshot({ path: ".e2e/screens/mobile-menu-390.png" });
});

test("the open menu and the tabs fit at every width", async ({ page }) => {
  await signIn(page, E2E_ADMIN.email, E2E_ADMIN.password);
  await expect(page).toHaveURL(/\/account$/);
  await page.waitForLoadState("networkidle");
  await menuItems(page);
  await page.screenshot({ path: ".e2e/screens/user-menu-1440.png" });
  await page.keyboard.press("Escape");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/account");
  await expect(tabs(page)).toHaveCount(3);
  await page.screenshot({ path: ".e2e/screens/account-tabs-390.png" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBe(0);
});
