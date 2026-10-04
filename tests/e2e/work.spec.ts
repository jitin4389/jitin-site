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

  test("the platform case study shows every chapter and its diagram", async ({
    page,
  }) => {
    await page.goto("/work/agentic-research-platform");
    for (const name of [
      "Context",
      "The problem",
      "Architecture at a glance",
      "1. Tools and MCP: governed access to data",
      "2. Skills as context: methodology the agent carries with it",
      "3. Structured handoffs between agents",
      "4. Evaluations: measuring instead of guessing",
      "5. Automation: keeping it fresh, safe and observable",
      "Outcome",
      "What I'd do differently",
      "Stack",
    ]) {
      await expect(
        page.getByRole("heading", { level: 2, name, exact: true }),
      ).toBeVisible();
    }
    const figure = page.locator("figure").first();
    await expect(
      figure.getByRole("listitem").filter({ hasText: "Run models" }),
    ).toBeVisible();
    await expect(figure.locator("figcaption")).toContainText(
      "traceable answer",
    );
  });

  test("Work nav link opens the index", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("navigation", { name: "Main" })
      .getByRole("link", { name: "Work" })
      .click();
    await expect(page).toHaveURL(/\/work$/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Case studies" }),
    ).toBeVisible();
  });

  test("no horizontal scroll at 360 px on work pages", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    for (const path of [
      "/work",
      ...caseStudies.map((study) => `/work/${study.slug}`),
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
