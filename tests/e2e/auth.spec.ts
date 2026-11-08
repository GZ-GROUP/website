import { expect, test } from "@playwright/test";
import { latestMailTo, linkIn, newUser, register, signIn } from "./helpers";

test.describe("reader account", () => {
  test("register → edit profile → public profile → sign out → sign in with username", async ({ page }) => {
    const user = newUser();
    await register(page, user);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Mi cuenta");

    // Edit the profile (server action with server-side validation).
    await page.getByLabel("Ocupación").selectOption("STUDENT");
    await page.getByLabel("Bio").fill("Construyo herramientas para la comunidad.");
    await page.getByRole("main").getByRole("button", { name: "Guardar cambios" }).click();
    await expect(page.getByText("Cambios guardados.")).toBeVisible();

    // Public profile
    await page.goto(`/u/${user.username}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(user.name);
    await expect(page.getByText("Construyo herramientas para la comunidad.")).toBeVisible();
    await expect(page.getByText("Estudiante")).toBeVisible();

    // Sign out from the header menu
    await page.getByRole("banner").getByRole("button", { name: "Menú de tu cuenta" }).click();
    await page.getByRole("menuitem", { name: "Cerrar sesión" }).click();
    await expect(page.getByRole("link", { name: "Ingresar" }).first()).toBeVisible();

    // Sign in again with the username instead of the email
    await signIn(page, user.username, user.password);
    await expect(page).toHaveURL(/\/account$/);
  });

  test("wrong password shows a translated error", async ({ page }) => {
    const user = newUser();
    await register(page, user);
    await page.context().clearCookies();
    await signIn(page, user.email, "not-the-password");
    await expect(page.getByRole("main").getByRole("alert")).toContainText("El email o la contraseña no son correctos.");
  });

  test("forgot password → email link → reset → sign in", async ({ page }) => {
    const user = newUser();
    await register(page, user);
    await page.context().clearCookies();

    await page.goto("/forgot-password");
    await page.getByLabel("Email").fill(user.email);
    await page.getByRole("main").getByRole("button", { name: "Enviar enlace" }).click();
    await expect(page.getByText(/te enviamos un enlace/)).toBeVisible();

    const mail = await latestMailTo(user.email, "Restablece tu contraseña de GZ Group");
    await page.goto(linkIn(mail));
    await expect(page).toHaveURL(/\/reset-password\?token=/);

    const newPassword = `${user.password}-new`;
    await page.getByLabel("Nueva contraseña").fill(newPassword);
    await page.getByLabel("Repite la contraseña").fill(newPassword);
    await page.getByRole("main").getByRole("button", { name: "Guardar contraseña" }).click();
    await expect(page.getByText("Tu contraseña cambió.", { exact: false })).toBeVisible();

    await signIn(page, user.email, newPassword);
    await expect(page).toHaveURL(/\/account$/);
  });

  test("nobody can sign up with the master admin email", async ({ page }) => {
    const user = { ...newUser(), email: "admin@gzgroup.dev" };
    await page.goto("/register");
    await page.getByLabel("Nombre", { exact: true }).fill(user.name);
    await page.getByLabel("Nombre de usuario").fill(user.username);
    await page.getByLabel("Email").fill(user.email);
    await page.getByLabel("Contraseña").fill(user.password);
    await page.getByRole("main").getByRole("button", { name: "Crear cuenta" }).click();
    await expect(page.getByRole("main").getByRole("alert")).toBeVisible();
    await expect(page).toHaveURL(/\/register$/);
  });

  test("reserved usernames are rejected", async ({ page }) => {
    const user = { ...newUser(), username: "gzgroup" };
    await page.goto("/register");
    await page.getByLabel("Nombre", { exact: true }).fill(user.name);
    await page.getByLabel("Nombre de usuario").fill(user.username);
    await page.getByLabel("Email").fill(user.email);
    await page.getByLabel("Contraseña").fill(user.password);
    await page.getByRole("main").getByRole("button", { name: "Crear cuenta" }).click();
    await expect(page.getByRole("main").getByRole("alert")).toContainText("Ese nombre de usuario no es válido.");
  });

  test("private pages require a session", async ({ page }) => {
    await page.goto("/account");
    await expect(page).toHaveURL(/\/login$/);
  });
});
