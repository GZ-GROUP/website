import { expect, test, type Browser, type Page } from "@playwright/test";

// Budgets on the production build. JS limits are the measured baseline plus 10%:
// raise one only on purpose, in the same change that needs it.
// Runs after community.spec.ts (alphabetical), which published an article with a cover.

const BUDGETS = { lcpMs: 2500, cls: 0.1 };
const JS_KB = { "/": 285, "/blog": 291, article: 297 };

async function measure(page: Page, path: string) {
  await page.addInitScript(() => {
    const store = { lcp: 0, cls: 0 };
    (window as unknown as { __vitals: typeof store }).__vitals = store;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) store.lcp = entry.startTime;
    }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as unknown as { value: number; hadRecentInput: boolean }[]) {
        if (!entry.hadRecentInput) store.cls += entry.value;
      }
    }).observe({ type: "layout-shift", buffered: true });
  });
  await page.goto(path);
  await page.waitForLoadState("networkidle");
  return page.evaluate(() => {
    const scripts = performance
      .getEntriesByType("resource")
      .filter((entry) => (entry as PerformanceResourceTiming).initiatorType === "script");
    const bytes = scripts.reduce((sum, entry) => sum + (entry as PerformanceResourceTiming).transferSize, 0);
    return { ...(window as unknown as { __vitals: { lcp: number; cls: number } }).__vitals, jsKb: Math.round(bytes / 1024) };
  });
}

/** Found in a separate context, so the measured page starts with an empty cache. */
async function articlePath(browser: Browser): Promise<string> {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`/blog?q=${encodeURIComponent("Notas de comunidad")}`);
  const href = await page.getByRole("main").getByRole("heading", { level: 2 }).getByRole("link").first().getAttribute("href");
  await context.close();
  return href!;
}

for (const name of ["/", "/blog", "article"] as const) {
  test(`${name} stays within its performance budget`, async ({ page, browser }) => {
    const path = name === "article" ? await articlePath(browser) : name;
    const result = await measure(page, path);
    console.log(`[budget] ${name}: ${JSON.stringify(result)}`);
    expect(result.lcp).toBeLessThan(BUDGETS.lcpMs);
    expect(result.cls).toBeLessThan(BUDGETS.cls);
    expect(result.jsKb).toBeLessThanOrEqual(JS_KB[name]);
  });
}

test("cover images are resized for the screen instead of sent at full size", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/blog?q=${encodeURIComponent("Notas de comunidad")}`);
  const image = page.getByRole("main").locator("article img").first();
  await expect(image).toBeVisible();
  await image.scrollIntoViewIfNeeded();
  await expect.poll(() => image.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBeGreaterThan(0);

  const current = await image.evaluate((el: HTMLImageElement) => el.currentSrc);
  expect(current).toContain("/_next/image?url=%2Fmedia%2Farticles");
  const width = Number(new URL(current).searchParams.get("w"));
  expect(width).toBeGreaterThan(0);
  expect(width).toBeLessThan(1200);
});

test("the optimizer refuses anything outside our uploads", async ({ request }) => {
  const response = await request.get("/_next/image?url=%2Fbrand%2Fgz-logo.svg&w=640&q=75");
  expect(response.status()).toBe(400);
});
