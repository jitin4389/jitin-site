import type { MetadataRoute } from "next";

import { getEnabledNav, siteConfig } from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return getEnabledNav().map((item) => ({
    url: new URL(item.href, siteConfig.url).toString(),
    lastModified: new Date(),
  }));
}
