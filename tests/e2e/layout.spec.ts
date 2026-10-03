import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const LIVE_ROUTES = ["/", "/this-page-does-not-exist"];

test("unknown URLs show the custom 404 page with a way home", async ({
  page,
}) => {
  const response = await page.goto("/this-page-does-not-exist");
  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { level: 1, name: "Page not found" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Back to home" }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("404 page has no accessibility violations", async ({ page }) => {
  await page.goto("/this-page-does-not-exist");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test.describe("at 360 px wide", () => {
  test.use({ viewport: { width: 360, height: 740 } });

  for (const route of LIVE_ROUTES) {
    test(`${route} has no horizontal scroll`, async ({ page }) => {
      await page.goto(route);
      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});

test("transitions are disabled when reduced motion is requested", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const duration = await page
    .getByRole("button", { name: "Toggle theme" })
    .evaluate((el) => parseFloat(getComputedStyle(el).transitionDuration));
  expect(duration).toBeLessThan(0.01);
});
