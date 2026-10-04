import type { Article } from "@/content/writing";

const escape = (text: string) =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** RSS 2.0 feed for the given articles (already in the desired order). */
export function buildRss({
  siteUrl,
  title,
  description,
  articles,
}: {
  siteUrl: string;
  title: string;
  description: string;
  articles: Article[];
}): string {
  const items = articles
    .map((article) => {
      const url = `${siteUrl}/writing/${article.slug}`;
      return `    <item>
      <title>${escape(article.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(`${article.date}T00:00:00Z`).toUTCString()}</pubDate>
      <description>${escape(article.description)}</description>
${article.tags.map((tag) => `      <category>${escape(tag)}</category>`).join("\n")}
    </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escape(title)}</title>
    <link>${siteUrl}/writing</link>
    <description>${escape(description)}</description>
    <language>en</language>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>
`;
}
