import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const BLOCKLIST = ".confidential-terms";
const CONTENT_DIR = "src/content";

/** Every public content file: articles, case studies, profile and their registries. */
function contentFiles(dir = CONTENT_DIR): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return contentFiles(full);
    return /\.(md|mdx|ts)$/.test(entry.name) ? [full] : [];
  });
}

function blocklist(): string[] {
  return readFileSync(BLOCKLIST, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
}

describe("confidentiality guard: all public content", () => {
  const files = contentFiles();

  it("finds the content files", () => {
    expect(files.length).toBeGreaterThan(3);
  });

  for (const file of files) {
    it.skipIf(!existsSync(BLOCKLIST))(
      `${file} contains no blocklisted term`,
      () => {
        const text = readFileSync(file, "utf8").toLowerCase();
        const found = blocklist().filter((term) =>
          text.includes(term.toLowerCase()),
        );
        // Counts only: the terms themselves must never appear in test output or CI logs.
        expect(
          found.length,
          `${found.length} confidential term(s) in ${file}`,
        ).toBe(0);
      },
    );
  }
});
