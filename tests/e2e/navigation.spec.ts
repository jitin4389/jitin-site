import { expect, test } from "@playwright/test";

test("every header nav link resolves", async ({ page, request }) => {
  await page.goto("/");
  const hrefs = await page
    .getByRole("navigation", { name: "Main" })
    .getByRole("link")
    .evaluateAll((links) =>
      links.map((link) => link.getAttribute("href") ?? ""),
    );

  expect(hrefs.length).toBeGreaterThan(0);
  for (const href of hrefs) {
    const response = await request.get(href);
    expect(response.status(), href).toBe(200);
  }
});

test("footer shows LinkedIn and email, and the page has no phone number", async ({
  page,
}) => {
  await page.goto("/");
  const footer = page.getByRole("contentinfo");
  await expect(footer.getByRole("link", { name: "LinkedIn" })).toHaveAttribute(
    "href",
    /linkedin\.com\/in\//,
  );
  await expect(footer.getByRole("link", { name: "Email" })).toHaveAttribute(
    "href",
    /^mailto:/,
  );

  const text = await page.locator("body").innerText();
  expect(text).not.toMatch(/\b\d{10}\b/);
});
