import { expect, test } from "@playwright/test";
import { newUser, register } from "./helpers";

const CONTACT = "privacidad@gzgroup.test";

test("the privacy policy states who is responsible and how to exercise your rights", async ({ page }) => {
  await page.goto("/privacy");
  await expect(page.getByRole("heading", { name: "Política de privacidad", level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: CONTACT }).first()).toHaveAttribute("href", `mailto:${CONTACT}`);
  await expect(page.getByText("Ley 81 de 2019")).toBeVisible();
  await expect(page.getByText("10 días hábiles", { exact: false })).toBeVisible();
  await expect(page.getByRole("link", { name: "ANTAI" })).toHaveAttribute("href", /antai\.gob\.pa/);

  await page.goto("/en/privacy");
  await expect(page.getByRole("heading", { name: "Privacy policy", level: 1 })).toBeVisible();
});

test("the terms are reachable from the footer and name Panamanian law", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("contentinfo").getByRole("link", { name: "Términos" }).click();
  await expect(page).toHaveURL(/\/terms$/);
  await expect(page.getByRole("heading", { name: "Términos y condiciones", level: 1 })).toBeVisible();
  await expect(page.getByText("República de Panamá")).toBeVisible();

  await page.goto("/en/terms");
  await expect(page.getByRole("heading", { name: "Terms and conditions", level: 1 })).toBeVisible();
});

test("legal pages never hint at how to become an author", async ({ page }) => {
  for (const path of ["/privacy", "/terms"]) {
    await page.goto(path);
    await expect(page.getByRole("main")).not.toContainText(/ser autor|convertirte en autor|promov/i);
  }
});

test("signing up shows the notice and records which version was accepted", async ({ page }) => {
  await page.goto("/register");
  const main = page.getByRole("main");
  await expect(main.getByRole("link", { name: "Términos" })).toHaveAttribute("href", "/terms");
  await expect(main.getByRole("link", { name: "Política de privacidad" })).toHaveAttribute("href", "/privacy");

  await register(page, newUser());
  const session = (await (await page.request.get("/api/auth/get-session")).json()) as {
    user: { termsAcceptedAt: string | null; termsVersion: string | null };
  };
  expect(session.user.termsVersion).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  expect(Date.now() - new Date(session.user.termsAcceptedAt!).getTime()).toBeLessThan(60_000);
});
