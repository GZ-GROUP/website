import { expect, test, type Page } from "@playwright/test";

// Runs after community.spec.ts (alphabetical), which published "Notas de comunidad".

const SITE = "http://localhost:3200";

const canonical = (page: Page) => page.locator('link[rel="canonical"]').getAttribute("href");
const robotsMeta = (page: Page) => page.locator('meta[name="robots"]').getAttribute("content");
const alternate = (page: Page, lang: string) => page.locator(`link[rel="alternate"][hreflang="${lang}"]`).getAttribute("href");

async function publishedArticle(page: Page) {
  await page.goto(`/blog?q=${encodeURIComponent("Notas de comunidad")}`);
  const href = await page.getByRole("main").getByRole("heading", { level: 2 }).getByRole("link").first().getAttribute("href");
  if (!href) throw new Error("community article not found");
  return href;
}

test("robots.txt blocks training, points to the sitemap and reveals nothing private", async ({ request }) => {
  const response = await request.get("/robots.txt");
  expect(response.status()).toBe(200);
  const body = await response.text();
  expect(body).toMatch(/User-Agent: GPTBot/i);
  expect(body).toMatch(/User-Agent: ClaudeBot/i);
  expect(body).not.toMatch(/OAI-SearchBot|Claude-SearchBot/);
  expect(body).toContain(`Sitemap: ${SITE}/sitemap.xml`);
  expect(body).not.toMatch(/admin|studio|account/);
});

test("the sitemap lists public pages in both languages and nothing private", async ({ request, page }) => {
  const article = await publishedArticle(page);
  const response = await request.get("/sitemap.xml");
  expect(response.status()).toBe(200);
  const body = await response.text();
  for (const url of [`${SITE}/blog`, `${SITE}/en/blog`, `${SITE}/contact`, `${SITE}${article}`]) {
    expect(body).toContain(`<loc>${url}</loc>`);
  }
  expect(body).toContain('hreflang="x-default"');
  expect(body).not.toMatch(/\/admin|\/studio|\/account|\/login|\/register/);
});

test("llms.txt describes the site and lists only public content", async ({ request, page }) => {
  const article = await publishedArticle(page);
  const response = await request.get("/llms.txt");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("text/plain");
  const body = await response.text();
  expect(body.startsWith("# GZ Group\n\n> ")).toBe(true);
  expect(body).toContain(`${SITE}${article}`);
  expect(body).not.toMatch(/\/admin|\/studio|\/account|autor/i);
});

test("translated pages declare their canonical and every language", async ({ page }) => {
  await page.goto("/contact");
  expect(await canonical(page)).toBe(`${SITE}/contact`);
  expect(await alternate(page, "es")).toBe(`${SITE}/contact`);
  expect(await alternate(page, "en")).toBe(`${SITE}/en/contact`);
  expect(await alternate(page, "x-default")).toBe(`${SITE}/contact`);
  await expect(page).toHaveTitle("Contáctanos | GZ Group");

  await page.goto("/en/contact");
  expect(await canonical(page)).toBe(`${SITE}/en/contact`);
  await expect(page).toHaveTitle("Contact us | GZ Group");
});

test("hreflang is not duplicated in HTTP headers", async ({ request }) => {
  expect((await request.get("/blog")).headers().link ?? "").not.toContain("hreflang");
});

test("blog filters and searches do not compete with the blog", async ({ page }) => {
  await page.goto("/blog?category=software");
  expect(await canonical(page)).toBe(`${SITE}/blog`);
  await page.goto("/blog?q=rust");
  expect(await robotsMeta(page)).toContain("noindex");
});

test("account screens stay out of the index", async ({ page }) => {
  for (const path of ["/login", "/register", "/forgot-password"]) {
    await page.goto(path);
    expect(await robotsMeta(page)).toContain("noindex");
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  }
});

test("shared links get a title, a description and an image", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", /GZ Group/);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /og-default\.png/);
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
});

test("structured data describes the site and each article", async ({ page }) => {
  const read = async () => JSON.parse((await page.locator('script[type="application/ld+json"]').first().textContent())!);

  await page.goto("/");
  const site = await read();
  expect(site["@graph"].map((node: { "@type": string }) => node["@type"])).toEqual(["Organization", "WebSite"]);

  await page.goto(await publishedArticle(page));
  const article = await read();
  expect(article["@type"]).toBe("BlogPosting");
  expect(article.headline).toContain("Notas de comunidad");
  expect(article.author.length).toBeGreaterThan(0);
  expect(article.datePublished).toBeTruthy();
  expect(await canonical(page)).toBe(article.url);
});

test("every image on public pages has an alt attribute", async ({ page }) => {
  const article = await publishedArticle(page);
  for (const path of ["/", "/en", "/blog", article, "/team", "/contact", "/login", "/register"]) {
    await page.goto(path);
    await page.waitForLoadState("load");
    expect(await page.locator("img:not([alt])").count(), path).toBe(0);
  }
});
