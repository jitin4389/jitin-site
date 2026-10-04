/**
 * Articles in the agentic coding series (and future writing). Bodies are plain Markdown in
 * `<slug>.md` next to this file so they can be republished elsewhere unchanged.
 * Intent and series map: docs/intent/writing-series.md.
 */
export type KeyTerm = { term: string; definition: string };

export type Article = {
  slug: string;
  title: string;
  description: string;
  /** "YYYY-MM-DD" */
  date: string;
  tags: string[];
  series?: { name: string; part: number; of: number };
  /** Plain-language "In one minute" summary for readers new to the topic. */
  summary: string;
  keyTerms: KeyTerm[];
  keyPoints: string[];
  /** Beats for a future video (YouTube lecture or Short). Not shown on the site. */
  videoOutline: string[];
};

export const SERIES_NAME = "Agentic coding with Claude Code";

export const articles: Article[] = [
  {
    slug: "hello-writing",
    title: "Hello, writing",
    description:
      "Temporary stub proving the writing pipeline. Removed before launch.",
    date: "2026-10-04",
    tags: ["stub"],
    series: { name: SERIES_NAME, part: 1, of: 10 },
    summary: "A stub article.",
    keyTerms: [{ term: "Stub", definition: "A placeholder." }],
    keyPoints: ["It renders."],
    videoOutline: ["Hook", "Point", "Close"],
  },
];

/** Newest first. */
export function getArticles(): Article[] {
  return [...articles].sort(
    (a, b) =>
      b.date.localeCompare(a.date) ||
      (b.series?.part ?? 0) - (a.series?.part ?? 0),
  );
}

export function getArticle(slug: string): Article | undefined {
  return articles.find((article) => article.slug === slug);
}

export function getTags(): string[] {
  return [...new Set(articles.flatMap((article) => article.tags))].sort();
}

export function tagSlug(tag: string): string {
  return tag
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Previous and next published parts of the same series, by part number. */
export function getSeriesNeighbours(slug: string): {
  previous?: Article;
  next?: Article;
} {
  const current = getArticle(slug);
  if (!current?.series) return {};
  const parts = articles
    .filter((article) => article.series?.name === current.series?.name)
    .sort((a, b) => (a.series?.part ?? 0) - (b.series?.part ?? 0));
  const index = parts.findIndex((article) => article.slug === slug);
  return { previous: parts[index - 1], next: parts[index + 1] };
}
