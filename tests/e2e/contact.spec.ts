import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// Submissions only run against the local build, which uses the in-memory store.
test.skip(
  !!process.env.PLAYWRIGHT_BASE_URL,
  "Never submit the contact form against a deployed site",
);

let ipCounter = 0;
/** Give each test its own client IP so the per-IP rate limit doesn't leak between tests. */
async function useFreshIp(page: Page) {
  const ip = `198.51.100.${(ipCounter++ % 250) + 1}-${Date.now()}-${Math.random()}`;
  await page.setExtraHTTPHeaders({ "x-forwarded-for": ip });
}

async function fillValid(page: Page) {
  const form = page.getByRole("form", { name: "Contact form" });
  await form.getByLabel("Name").fill("Ada Lovelace");
  await form.getByLabel("Email").fill("ada@example.com");
  await form.getByLabel("Topic").selectOption("consulting");
  await form
    .getByLabel("Message")
    .fill("Hello Jitin, I'd like to talk about a forecasting project.");
  return form;
}

test.describe("contact form", () => {
  test.beforeEach(async ({ page }) => {
    await useFreshIp(page);
    await page.goto("/#contact");
  });

  test("a valid message shows a confirmation", async ({ page }) => {
    const form = await fillValid(page);
    await form.getByRole("button", { name: "Send message" }).click();
    await expect(
      page
        .getByRole("status")
        .filter({ hasText: "your message is on its way" }),
    ).toBeVisible();
  });

  test("an empty submit shows field errors and focuses the first invalid field", async ({
    page,
  }) => {
    const form = page.getByRole("form", { name: "Contact form" });
    await form.getByRole("button", { name: "Send message" }).click();
    await expect(form.getByRole("status")).toContainText(
      "Please fix the highlighted fields.",
    );
    await expect(form.getByLabel("Name")).toBeFocused();
    await expect(form.getByLabel("Name")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    await expect(form.getByLabel("Email")).toHaveAccessibleDescription(
      "Please enter your email address.",
    );
    await expect(form.getByLabel("Message")).toHaveAccessibleDescription(
      /at least 10 characters/,
    );
  });

  test("keeps what the visitor typed when one field is invalid", async ({
    page,
  }) => {
    const form = await fillValid(page);
    await form.getByLabel("Email").fill("not-an-email");
    await form.getByRole("button", { name: "Send message" }).click();
    await expect(form.getByLabel("Email")).toBeFocused();
    await expect(form.getByLabel("Name")).toHaveValue("Ada Lovelace");
    await expect(form.getByLabel("Message")).toHaveValue(/forecasting project/);
  });

  test("the sixth message in an hour from one address is refused", async ({
    page,
  }) => {
    for (let i = 0; i < 5; i++) {
      await page.goto("/");
      const form = await fillValid(page);
      await form.getByRole("button", { name: "Send message" }).click();
      await expect(page.getByText("your message is on its way")).toBeVisible();
    }
    // Full reload (a "#contact" hash change would keep the success panel on screen).
    await page.goto("/");
    const form = await fillValid(page);
    await form.getByRole("button", { name: "Send message" }).click();
    await expect(form.getByRole("status")).toContainText(
      "sent several messages recently",
    );
  });

  for (const colorScheme of ["light", "dark"] as const) {
    test(`has no accessibility violations with errors shown (${colorScheme})`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme });
      await page.goto("/#contact");
      const form = page.getByRole("form", { name: "Contact form" });
      await form.getByRole("button", { name: "Send message" }).click();
      await expect(form.getByRole("status")).toContainText("Please fix");
      const results = await new AxeBuilder({ page })
        .include("#contact")
        .analyze();
      expect(results.violations).toEqual([]);
    });
  }
});

test.describe("contact form without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("still submits and confirms", async ({ page }) => {
    await useFreshIp(page);
    await page.goto("/");
    const form = await fillValid(page);
    await form.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByText("your message is on its way")).toBeVisible();
  });
});
