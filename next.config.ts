import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Case studies (MDX) and articles (Markdown) are imported by their routes.
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
};

const withMDX = createMDX({
  // Handle plain Markdown articles (.md) as well as .mdx.
  extension: /\.(md|mdx)$/,
  // Plugins are given by name so they work with Turbopack.
  options: { remarkPlugins: ["remark-gfm"] },
});

export default withMDX(nextConfig);
