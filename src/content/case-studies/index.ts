/**
 * Case studies in display order. Text lives in `<slug>.mdx` next to this file.
 * Every claim must be in profile_builder/drafts/00-facts.md and pass the guards in
 * tests/unit/case-study-guard.test.ts.
 */
export type CaseStudyMeta = {
  slug: string;
  title: string;
  summary: string;
  role: string;
  organisation: string;
  period: string;
  tags: string[];
};

export const caseStudies: CaseStudyMeta[] = [
  {
    slug: "example",
    title: "Example case study",
    summary: "Temporary stub proving the MDX pipeline. Removed before launch.",
    role: "Applied AI Architect",
    organisation: "Example",
    period: "2026",
    tags: ["Stub"],
  },
];

export function getCaseStudy(slug: string): CaseStudyMeta | undefined {
  return caseStudies.find((study) => study.slug === slug);
}
