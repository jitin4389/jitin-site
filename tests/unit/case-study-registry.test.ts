import { existsSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { caseStudies, getCaseStudy } from "@/content/case-studies";

describe("case-study registry", () => {
  it("has unique, URL-safe slugs", () => {
    const slugs = caseStudies.map((study) => study.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs)
      expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  });

  it.each(caseStudies.map((study) => [study.slug, study] as const))(
    "%s has an MDX file and complete metadata",
    (slug, study) => {
      expect(existsSync(`src/content/case-studies/${slug}.mdx`)).toBe(true);
      for (const field of [
        "title",
        "summary",
        "role",
        "organisation",
        "period",
      ] as const) {
        expect(study[field].trim(), field).not.toBe("");
      }
      expect(study.tags.length).toBeGreaterThan(0);
      expect(getCaseStudy(slug)).toBe(study);
    },
  );
});
