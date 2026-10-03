import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("home page profile", () => {
  test("hero shows name, role, statement and contact actions", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { level: 1, name: "Jitin Gupta" }),
    ).toBeVisible();
    const hero = page.getByRole("region", { name: "Jitin Gupta" });
    await expect(hero).toContainText("Applied AI Architect");
    await expect(hero).toContainText("structural market shifts");
    await expect(hero.getByRole("link", { name: "Email me" })).toHaveAttribute(
      "href",
      /^mailto:/,
    );
    await expect(hero.getByRole("link", { name: /LinkedIn/ })).toHaveAttribute(
      "href",
      /linkedin\.com/,
    );
  });

  test("renders every section with its heading", async ({ page }) => {
    await page.goto("/");
    for (const name of [
      "What I work on",
      "Where I've worked",
      "Capabilities & credentials",
      "Get in touch",
    ]) {
      await expect(page.getByRole("heading", { level: 2, name })).toBeVisible();
    }
  });

  test("about lists what I do", async ({ page }) => {
    await page.goto("/");
    const about = page.getByRole("region", { name: "What I work on" });
    await expect(about.getByRole("listitem")).toHaveCount(4);
    await expect(about).toContainText("12+ sector forecasting models");
  });

  test("nav links jump to their sections", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("navigation", { name: "Main" })
      .getByRole("link", { name: "Experience" })
      .click();
    await expect(page).toHaveURL(/#experience$/);
    await expect(
      page.getByRole("heading", { level: 2, name: "Where I've worked" }),
    ).toBeInViewport();
  });

  test("experience shows roles newest first, with the promotion", async ({
    page,
  }) => {
    await page.goto("/");
    const experience = page.getByRole("region", { name: "Where I've worked" });
    const titles = await experience
      .getByRole("heading", { level: 4 })
      .allInnerTexts();
    expect(titles.slice(0, 2)).toEqual([
      "Applied AI Architect",
      "Senior Software Engineer – Applied AI",
    ]);
    await expect(experience.getByText("Jul 2025 – Present")).toBeVisible();
    await expect(
      experience.getByText("Promoted", { exact: true }),
    ).toBeVisible();
  });

  test("earlier roles are collapsed and open by keyboard", async ({ page }) => {
    await page.goto("/");
    const details = page.locator("details");
    await expect(details).not.toHaveAttribute("open");
    await expect(
      page.getByText("Co-founder & Business Development Manager"),
    ).toBeHidden();
    await details.locator("summary").focus();
    await page.keyboard.press("Enter");
    await expect(
      page.getByText("Co-founder & Business Development Manager"),
    ).toBeVisible();
  });

  test("certifications separate current from past", async ({ page }) => {
    await page.goto("/");
    const skills = page.getByRole("region", {
      name: "Capabilities & credentials",
    });
    await expect(
      skills.getByRole("heading", {
        name: "Claude Certified Architect – Foundations",
      }),
    ).toBeVisible();
    await expect(skills).toContainText(
      "Past certifications: Databricks Certified Machine Learning Professional (2024–2026)",
    );
  });

  for (const colorScheme of ["light", "dark"] as const) {
    test(`has no accessibility violations in ${colorScheme} mode (earlier roles open)`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme });
      await page.goto("/");
      await page.locator("details summary").click();
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations).toEqual([]);
    });
  }

  for (const width of [360, 768, 1280]) {
    test(`no horizontal scroll at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});
