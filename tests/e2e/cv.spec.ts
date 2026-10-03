import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("/cv page", () => {
  test("renders the CV sections without a phone number", async ({ page }) => {
    const response = await page.goto("/cv");
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle("CV · Jitin Gupta");
    await expect(
      page.getByRole("heading", { level: 1, name: "Jitin Gupta" }),
    ).toBeVisible();
    for (const name of [
      "Summary",
      "Core capabilities",
      "Experience",
      "Education & certifications",
    ]) {
      await expect(page.getByRole("heading", { level: 2, name })).toBeVisible();
    }
    const text = await page.locator("article").innerText();
    expect(text).toContain("Applied AI Architect");
    expect(text).not.toMatch(/\d{10}/);
  });

  for (const colorScheme of ["light", "dark"] as const) {
    test(`has no accessibility violations in ${colorScheme} mode`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme });
      await page.goto("/cv");
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations).toEqual([]);
    });
  }

  test("prints to at most two A4 pages", async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "PDF printing needs Chromium");
    await page.goto("/cv");
    await page.emulateMedia({ media: "print" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
    });
    const pages = pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) ?? [];
    expect(pages.length).toBeGreaterThan(0);
    expect(pages.length).toBeLessThanOrEqual(2);
  });
});

test.describe("CV PDF download", () => {
  test("is served as a PDF of at most two pages", async ({ request }) => {
    const response = await request.get("/jitin-gupta-cv.pdf");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toBe("application/pdf");
    const pages =
      (await response.body())
        .toString("latin1")
        .match(/\/Type\s*\/Page[^s]/g) ?? [];
    expect(pages.length).toBeGreaterThan(0);
    expect(pages.length).toBeLessThanOrEqual(2);
  });

  test("Download CV buttons and the CV nav link point to the right places", async ({
    page,
  }) => {
    await page.goto("/");
    const hero = page.getByRole("region", { name: "Jitin Gupta" });
    await expect(
      hero.getByRole("link", { name: "Download CV" }),
    ).toHaveAttribute("href", "/jitin-gupta-cv.pdf");
    await expect(
      page.getByRole("link", { name: "Download CV (PDF)" }),
    ).toHaveAttribute("href", "/jitin-gupta-cv.pdf");
    await page
      .getByRole("navigation", { name: "Main" })
      .getByRole("link", { name: "CV" })
      .click();
    await expect(page).toHaveURL(/\/cv$/);
    await expect(
      page.getByRole("link", { name: "Download PDF" }),
    ).toHaveAttribute("href", "/jitin-gupta-cv.pdf");
  });
});
