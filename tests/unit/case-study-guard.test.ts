import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { caseStudies } from "@/content/case-studies";

const DIR = "src/content/case-studies";
const BLOCKLIST = ".confidential-terms";

/** Everything a visitor could read for one case study: its MDX plus its registry metadata. */
function publicText(slug: string): string {
  const meta = caseStudies.find((study) => study.slug === slug);
  return `${readFileSync(`${DIR}/${slug}.mdx`, "utf8")}\n${JSON.stringify(meta)}`;
}

function blocklist(): string[] {
  return readFileSync(BLOCKLIST, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
}

describe("case-study confidentiality guard", () => {
  // The blocklist is private (git-ignored), so it can only exist on the owner's machine.
  it.skipIf(!!process.env.CI)(
    "has a private blocklist to check against",
    () => {
      expect(
        existsSync(BLOCKLIST),
        `Create ${BLOCKLIST} (one confidential term per line). It is git-ignored.`,
      ).toBe(true);
      expect(blocklist().length).toBeGreaterThan(0);
    },
  );

  for (const { slug } of caseStudies) {
    it.skipIf(!existsSync(BLOCKLIST))(
      `${slug} contains no blocklisted term`,
      () => {
        const text = publicText(slug).toLowerCase();
        const found = blocklist().filter((term) =>
          text.includes(term.toLowerCase()),
        );
        // Report how many matched, not which, so the terms never appear in test output or CI logs.
        expect(
          found.length,
          `${found.length} confidential term(s) found in ${slug}`,
        ).toBe(0);
      },
    );
  }
});

describe("case-study claims guard", () => {
  const backtesting = `${DIR}/backtesting-framework.mdx`;
  it.skipIf(!existsSync(backtesting))(
    "backtesting makes no performance claims",
    () => {
      const text = publicText("backtesting-framework");
      expect(text).not.toMatch(
        /\b(returns?|alpha|sharpe|profit\w*|outperform\w*|beat the market)\b/i,
      );
    },
  );

  const platform = `${DIR}/agentic-research-platform.mdx`;
  it.skipIf(!existsSync(platform))(
    "platform case study only uses approved numbers",
    () => {
      // Heading and list ordinals ("## 1. Tools", "1. First") are structure, not claims.
      const text = publicText("agentic-research-platform").replace(
        /^(#{1,6}\s+)?\d+\.\s/gm,
        "$1",
      );
      const numbers = text.match(/[~$]*\d[\d,.]*\s*(?:\+|%|[BMK]\b)?/g) ?? [];
      const approved = /^(?:12\+|15\+|~\$1B|(?:19|20)\d{2})$/;
      const unapproved = numbers
        .map((n) => n.replace(/\s+/g, ""))
        .filter((n) => !approved.test(n));
      expect(unapproved, "Numbers must come from drafts/00-facts.md").toEqual(
        [],
      );
    },
  );
});
