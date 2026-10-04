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
    slug: "agentic-research-platform",
    title: "Agentic research platform",
    summary:
      "How we built an AI research system that turns investment questions into traceable, model-backed answers: MCP tools, skills as context, typed handoffs, evaluations and automation.",
    role: "Senior Software Engineer → Applied AI Architect",
    organisation: "CLOUDSUFI",
    period: "2024 – present",
    tags: [
      "Agentic AI",
      "MCP",
      "Context engineering",
      "Evaluations",
      "Automation",
    ],
  },
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
