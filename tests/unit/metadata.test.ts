import { describe, expect, it } from "vitest";

import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { siteConfig } from "@/config/site";
import { buildMetadata } from "@/lib/metadata";

describe("buildMetadata", () => {
  it("uses the site name and default description on the home page", () => {
    const meta = buildMetadata({ path: "/" });
    expect(meta.title).toEqual({ absolute: siteConfig.name });
    expect(meta.description).toBe(siteConfig.description);
    expect(meta.alternates?.canonical).toBe("/");
  });

  it("gives other pages their own title, description and canonical URL", () => {
    const meta = buildMetadata({
      title: "Writing",
      description: "Notes.",
      path: "/writing",
    });
    expect(meta.title).toBe("Writing");
    expect(meta.description).toBe("Notes.");
    expect(meta.alternates?.canonical).toBe("/writing");
    expect(meta.openGraph).toMatchObject({
      title: `Writing · ${siteConfig.name}`,
      url: "/writing",
    });
    expect(meta.twitter).toMatchObject({ card: "summary_large_image" });
  });
});

describe("sitemap and robots", () => {
  it("lists only enabled routes as absolute URLs", () => {
    const urls = sitemap().map((entry) => entry.url);
    const expected = siteConfig.nav
      .filter((item) => item.enabled)
      .map((item) => new URL(item.href, siteConfig.url).toString());
    expect(urls).toEqual(expected);
  });

  it("allows indexing and points to the sitemap", () => {
    expect(robots()).toMatchObject({
      rules: { userAgent: "*", allow: "/" },
      sitemap: `${siteConfig.url}/sitemap.xml`,
    });
  });
});
