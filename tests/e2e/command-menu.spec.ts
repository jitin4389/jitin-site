import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const menu = (page: import("@playwright/test").Page) =>
  page.getByRole("dialog", { name: "Command menu" });

test.describe("command menu", () => {
  test("keyboard shortcut opens it and Escape closes it", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("ControlOrMeta+k");
    await expect(menu(page)).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(menu(page)).toBeHidden();
  });

  test("closing returns focus to the trigger button", async ({ page }) => {
    await page.goto("/");
    const trigger = page.getByRole("button", { name: "Open command menu" });
    await trigger.click();
    await expect(menu(page)).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
  });

  test("selecting a page navigates to it", async ({ page }) => {
    await page.goto("/this-page-does-not-exist");
    await page.keyboard.press("ControlOrMeta+k");
    await page.getByPlaceholder("Type a command or search…").fill("Home");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/$/);
    await expect(menu(page)).toBeHidden();
  });

  test("toggle theme command switches the theme", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    await page.keyboard.press("ControlOrMeta+k");
    await page.getByRole("option", { name: "Toggle theme" }).click();
    await expect(page.locator("html")).toHaveClass(/\bdark\b/);
  });

  test("open menu has no accessibility violations", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("ControlOrMeta+k");
    await expect(menu(page)).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});
