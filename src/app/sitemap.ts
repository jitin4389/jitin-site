import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";
import { caseStudies } from "@/content/case-studies";
import { articles } from "@/content/writing";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    ...siteConfig.routes,
    ...caseStudies.map((study) => `/work/${study.slug}`),
    ...articles.map((article) => `/writing/${article.slug}`),
  ];
  return routes.map((route) => ({
    url: new URL(route, siteConfig.url).toString(),
    lastModified: new Date(),
  }));
}
