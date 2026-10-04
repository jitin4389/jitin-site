import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { caseStudies } from "../../src/content/case-studies";

test.describe("work", () => {
  test("index lists every case study", async ({ page }) => {
    const response = await page.goto("/work");
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle("Work · Jitin Gupta");
    for (const study of caseStudies) {
      await expect(
        page.getByRole("link", { name: new RegExp(study.title) }),
      ).toHaveAttribute("href", `/work/${study.slug}`);
    }
  });

  for (const study of caseStudies) {
    test(`${study.slug} renders with its own metadata`, async ({ page }) => {
      const response = await page.goto(`/work/${study.slug}`);
      expect(response?.status()).toBe(200);
      await expect(page).toHaveTitle(`${study.title} · Jitin Gupta`);
      await expect(
        page.getByRole("heading", { level: 1, name: study.title }),
      ).toBeVisible();
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        `https://jitin-site.vercel.app/work/${study.slug}`,
      );
    });
  }

  test("unknown case study returns 404", async ({ page }) => {
    const response = await page.goto("/work/does-not-exist");
    expect(response?.status()).toBe(404);
  });

  for (const colorScheme of ["light", "dark"] as const) {
    test(`index and case studies have no accessibility violations (${colorScheme})`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme });
      for (const path of [
        "/work",
        ...caseStudies.map((study) => `/work/${study.slug}`),
      ]) {
        await page.goto(path);
        const results = await new AxeBuilder({ page }).analyze();
        expect(results.violations, path).toEqual([]);
      }
    });
  }
});
