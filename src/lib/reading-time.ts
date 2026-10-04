import "server-only";

import { readFileSync } from "node:fs";
import path from "node:path";

const WORDS_PER_MINUTE = 230;

/** Words in a Markdown body, ignoring fenced code blocks (readers skim code). */
export function countWords(markdown: string): number {
  const prose = markdown.replace(/```[\s\S]*?```/g, " ");
  return prose.split(/\s+/).filter((word) => /[A-Za-z0-9]/.test(word)).length;
}

export function readingMinutes(markdown: string): number {
  return Math.max(1, Math.round(countWords(markdown) / WORDS_PER_MINUTE));
}

export function readingMinutesForArticle(slug: string): number {
  const file = path.join(process.cwd(), "src/content/writing", `${slug}.md`);
  return readingMinutes(readFileSync(file, "utf8"));
}
