import { expect, test } from "@playwright/test";

test("home page exposes title, description, canonical and social tags", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Jitin Gupta");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    /Applied AI Architect/,
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://jitin-site.vercel.app",
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    /opengraph-image/,
  );
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    "content",
    "summary_large_image",
  );
});

test("sitemap lists only live routes", async ({ request }) => {
  const response = await request.get("/sitemap.xml");
  expect(response.status()).toBe(200);
  const xml = await response.text();
  expect(xml).toContain("<loc>https://jitin-site.vercel.app/</loc>");
  expect(xml).not.toContain("/work");
});

test("robots.txt allows indexing and points to the sitemap", async ({
  request,
}) => {
  const body = await (await request.get("/robots.txt")).text();
  expect(body).toMatch(/Allow: \//);
  expect(body).toContain("Sitemap: https://jitin-site.vercel.app/sitemap.xml");
});

test("Open Graph image is a 1200×630 PNG", async ({ request }) => {
  const response = await request.get("/opengraph-image");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toBe("image/png");
  const png = await response.body();
  // PNG IHDR chunk: width and height are big-endian uint32 at byte offsets 16 and 20.
  expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1200, 630]);
});
