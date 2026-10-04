import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it, vi } from "vitest";

import {
  articles,
  getSeriesNeighbours,
  getTags,
  tagSlug,
} from "@/content/writing";
import { formatDay } from "@/lib/dates";
import { buildRss } from "@/lib/rss";

vi.mock("server-only", () => ({}));
const { countWords, readingMinutes } = await import("@/lib/reading-time");

describe("writing registry", () => {
  it("has unique URL-safe slugs, each with a Markdown body", () => {
    const slugs = articles.map((article) => article.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) {
      expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(existsSync(`src/content/writing/${slug}.md`), slug).toBe(true);
    }
  });

  it.each(articles.map((article) => [article.slug, article] as const))(
    "%s has complete metadata",
    (_slug, article) => {
      expect(article.title.trim()).not.toBe("");
      expect(article.description.trim()).not.toBe("");
      expect(() => formatDay(article.date)).not.toThrow();
      expect(article.tags.length).toBeGreaterThan(0);
      expect(article.summary.trim()).not.toBe("");
      expect(article.keyPoints.length).toBeGreaterThan(0);
      expect(article.videoOutline.length).toBeGreaterThan(0);
      if (article.series) {
        expect(article.series.part).toBeGreaterThanOrEqual(1);
        expect(article.series.part).toBeLessThanOrEqual(article.series.of);
      }
    },
  );

  it("keeps article bodies portable: plain Markdown, no JSX or imports", () => {
    for (const { slug } of articles) {
      const body = readFileSync(
        `src/content/writing/${slug}.md`,
        "utf8",
      ).replace(/```[\s\S]*?```/g, "");
      expect(body, slug).not.toMatch(/^\s*(import|export)\s/m);
      expect(body, slug).not.toMatch(/<[A-Z][A-Za-z]*[\s/>]/);
    }
  });

  it("gives each series part a unique number", () => {
    const parts = articles
      .filter((a) => a.series)
      .map((a) => `${a.series!.name}#${a.series!.part}`);
    expect(new Set(parts).size).toBe(parts.length);
  });

  it("links neighbouring parts in order", () => {
    const sorted = [...articles]
      .filter((a) => a.series)
      .sort((a, b) => a.series!.part - b.series!.part);
    if (sorted.length > 1)
      expect(getSeriesNeighbours(sorted[0].slug).next?.slug).toBe(
        sorted[1].slug,
      );
    expect(getSeriesNeighbours(sorted[0].slug).previous).toBeUndefined();
  });

  it("makes tag slugs URL-safe", () => {
    expect(tagSlug("Claude Code")).toBe("claude-code");
    expect(tagSlug("MCP & Tools")).toBe("mcp-tools");
    for (const tag of getTags()) expect(tagSlug(tag)).toMatch(/^[a-z0-9-]+$/);
  });
});

describe("reading time", () => {
  it("ignores code blocks and rounds to at least one minute", () => {
    expect(countWords("one two three\n```js\nconst a = 1\n```\nfour")).toBe(4);
    expect(readingMinutes("word ".repeat(10))).toBe(1);
    expect(readingMinutes("word ".repeat(2300))).toBe(10);
  });
});

describe("rss", () => {
  it("builds an RSS 2.0 feed with escaped, absolute items", () => {
    const xml = buildRss({
      siteUrl: "https://example.com",
      title: "A & B",
      description: "d",
      articles: [{ ...articles[0], title: "Tom & <Jerry>" }],
    });
    expect(xml).toMatch(/^<\?xml version="1.0"/);
    expect(xml).toContain('<rss version="2.0"');
    expect(xml).toContain("<title>A &amp; B</title>");
    expect(xml).toContain("Tom &amp; &lt;Jerry&gt;");
    expect(xml).toContain(
      `<link>https://example.com/writing/${articles[0].slug}</link>`,
    );
  });
});

describe("formatDay", () => {
  it("formats and validates", () => {
    expect(formatDay("2026-10-04")).toBe("4 Oct 2026");
    expect(() => formatDay("2026-13-01")).toThrow();
  });
});
