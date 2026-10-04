import { siteConfig } from "@/config/site";
import { getArticles } from "@/content/writing";
import { buildRss } from "@/lib/rss";

export const dynamic = "force-static";

export function GET() {
  const xml = buildRss({
    siteUrl: siteConfig.url,
    title: `${siteConfig.name}: Writing`,
    description: "Practical guides on agentic coding and AI systems.",
    articles: getArticles(),
  });
  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
