import type { Metadata } from "next";

import { siteConfig } from "@/config/site";

type PageMetadataInput = {
  /** Page title; omitted on the home page, which uses the site name. */
  title?: string;
  description?: string;
  /** Path of the page, e.g. "/writing". Used for the canonical URL. */
  path: string;
};

export function buildMetadata({
  title,
  description,
  path,
}: PageMetadataInput): Metadata {
  const pageDescription = description ?? siteConfig.description;
  const fullTitle = title ? `${title} · ${siteConfig.name}` : siteConfig.name;

  return {
    title: title ?? { absolute: siteConfig.name },
    description: pageDescription,
    // Page-level alternates replace the layout's, so the RSS link is repeated here.
    alternates: {
      canonical: path,
      types: { "application/rss+xml": "/rss.xml" },
    },
    openGraph: {
      type: "website",
      locale: "en_GB",
      siteName: siteConfig.name,
      url: path,
      title: fullTitle,
      description: pageDescription,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: pageDescription,
    },
  };
}
