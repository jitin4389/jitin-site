import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { articles, getTags, tagSlug } from "../../src/content/writing";

test.describe("writing", () => {
  test("index lists every article and links the RSS feed", async ({ page }) => {
    const response = await page.goto("/writing");
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle("Writing · Jitin Gupta");
    for (const article of articles) {
      await expect(
        page.getByRole("link", { name: article.title, exact: true }),
      ).toHaveAttribute("href", `/writing/${article.slug}`);
    }
    await expect(
      page.locator('link[rel="alternate"][type="application/rss+xml"]'),
    ).toHaveAttribute("href", /\/rss\.xml$/);
  });

  for (const article of articles) {
    test(`${article.slug} renders with metadata, summary and key points`, async ({
      page,
    }) => {
      const response = await page.goto(`/writing/${article.slug}`);
      expect(response?.status()).toBe(200);
      await expect(page).toHaveTitle(`${article.title} · Jitin Gupta`);
      await expect(
        page.getByRole("heading", { level: 1, name: article.title }),
      ).toBeVisible();
      await expect(
        page.getByRole("complementary", { name: "In one minute" }),
      ).toContainText(article.summary);
      await expect(
        page.getByRole("heading", { name: "Key points" }),
      ).toBeVisible();
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        `https://jitin-site.vercel.app/writing/${article.slug}`,
      );
    });
  }

  test("tag pages list their articles", async ({ page }) => {
    for (const tag of getTags()) {
      const response = await page.goto(`/writing/tags/${tagSlug(tag)}`);
      expect(response?.status()).toBe(200);
      for (const article of articles.filter((a) => a.tags.includes(tag))) {
        await expect(
          page.getByRole("link", { name: article.title, exact: true }),
        ).toBeVisible();
      }
    }
  });

  test("RSS feed is served as XML with one item per article", async ({
    request,
  }) => {
    const response = await request.get("/rss.xml");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("application/rss+xml");
    const xml = await response.text();
    expect(xml.match(/<item>/g)?.length).toBe(articles.length);
  });

  test("unknown article returns 404", async ({ page }) => {
    expect((await page.goto("/writing/does-not-exist"))?.status()).toBe(404);
  });

  test("no horizontal scroll at 360 px on writing pages", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    for (const path of [
      "/writing",
      ...articles.map((a) => `/writing/${a.slug}`),
    ]) {
      await page.goto(path);
      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      );
      expect(overflow, path).toBeLessThanOrEqual(0);
    }
  });

  for (const colorScheme of ["light", "dark"] as const) {
    test(`writing pages have no accessibility violations (${colorScheme})`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme });
      for (const path of [
        "/writing",
        ...articles.map((a) => `/writing/${a.slug}`),
      ]) {
        await page.goto(path);
        const results = await new AxeBuilder({ page }).analyze();
        expect(results.violations, path).toEqual([]);
      }
    });
  }
});
