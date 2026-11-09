import { writeFile, mkdir } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { E2E_ADMIN } from "../../playwright.config";
import { newUser, register, signIn } from "./helpers";

// WCAG 2.2 AA gate with axe-core over the real pages, at phone and desktop
// widths. Runs after admin.spec.ts and editorial.spec.ts (alphabetical order),
// so there is a changed admin password and at least one published article.
test.describe.configure({ timeout: 180_000 });
// Measure the settled page: entrance animations fade content in, and axe would
// otherwise sample colours mid-fade. Reduced motion renders the final state.
test.use({ reducedMotion: "reduce" });

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function scan(page: Page, name: string) {
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  const summary = results.violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    help: v.help,
    nodes: v.nodes.slice(0, 5).map((n) => ({ target: n.target.join(" "), summary: n.failureSummary })),
  }));
  await mkdir(".e2e/axe", { recursive: true });
  await writeFile(`.e2e/axe/${name}.json`, JSON.stringify(summary, null, 2));
  return summary;
}

/** The article community.spec.ts left with a live conversation. */
async function articleWithComments(page: Page): Promise<string> {
  await page.goto(`/blog?q=${encodeURIComponent("Notas de comunidad")}`);
  const href = await page.getByRole("main").getByRole("heading", { level: 2 }).getByRole("link").first().getAttribute("href");
  if (!href) throw new Error("community article not found");
  return href;
}

for (const width of [390, 1440]) {
  test(`public pages pass WCAG 2.2 AA at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/blog");
    const firstArticle = await page.getByRole("main").getByRole("heading", { level: 2 }).getByRole("link").first().getAttribute("href");
    const discussed = await articleWithComments(page);
    const pages = ["/", "/en", "/blog", "/projects", "/team", "/contact", "/privacy", "/terms", "/en/privacy", "/e2e-error", "/login", "/register", "/forgot-password", ...(firstArticle ? [firstArticle] : []), discussed];
    const failures: Record<string, unknown> = {};
    for (const path of pages) {
      await page.goto(path);
      await page.waitForLoadState("load");
      const violations = await scan(page, `public-${width}${path.replaceAll("/", "_")}`);
      if (violations.length) failures[path] = violations;
    }
    expect(failures).toEqual({});
  });

  test(`signed-in pages pass WCAG 2.2 AA at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const failures: Record<string, unknown> = {};
    const user = newUser();
    await register(page, user);
    const discussed = await articleWithComments(page);
    for (const path of ["/account", "/account/password", "/account/activity", `/u/${user.username}`, discussed]) {
      await page.goto(path);
      await page.waitForLoadState("load");
      const violations = await scan(page, `reader-${width}${path.replaceAll("/", "_")}`);
      if (violations.length) failures[path] = violations;
    }

    await page.context().clearCookies();
    await signIn(page, E2E_ADMIN.email, E2E_ADMIN.password);
    await page.waitForURL(/\/account$/);
    for (const path of ["/admin", "/admin/articles", "/admin/comments", "/studio"]) {
      await page.goto(path);
      await page.waitForLoadState("load");
      const violations = await scan(page, `admin-${width}${path.replaceAll("/", "_")}`);
      if (violations.length) failures[path] = violations;
    }
    expect(failures).toEqual({});
  });
}
