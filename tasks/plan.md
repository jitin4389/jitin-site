# Implementation Plan: case-studies

Spec: [SPEC-case-studies.md](../SPEC-case-studies.md) · Module map: [CAPABILITY-MAP.md](../CAPABILITY-MAP.md)
Tasks tracked in [tasks/todo.md](todo.md). Previous modules: [foundation](foundation-plan.md), [profile](profile-plan.md), [leads](leads-plan.md) (complete).

## Overview

Add a Work section: `/work` index and `/work/[slug]` pages rendered from MDX, two anonymised case studies with SVG diagrams, and automated guards for confidentiality and claims. Text is drafted by me and approved by you before merge.

## Architecture Decisions

- **Infrastructure and guards before words.** The MDX pipeline, routes and both guards land first, so every draft is checked from the moment it exists.
- **Official `@next/mdx`, metadata via `export const meta`.** No frontmatter plugin; a typed registry (`index.ts`) lists slugs in display order and lazy-imports each MDX file.
- **Static only.** `generateStaticParams` + `dynamicParams = false`: unknown slugs 404, no runtime work, Lighthouse-friendly.
- **Blocklist stays private.** `.confidential-terms` is git-ignored; the guard fails locally if it's missing and skips only in CI, so the sensitive names never enter the public repo.
- **The Work nav stays off until text is approved.** Pages can exist on the branch and preview without being linked from the site.

## Dependency Graph

```
C1 MDX pipeline + routes ──► C2 Guards ──► C4 Draft: agentic platform ──┐
          │                                                              ├──► C6 Enable Work nav + e2e ──► Checkpoint ──► C7 Ship
          └────────────────► C3 Diagrams ──► C5 Draft: backtesting ──────┘
                                              (needs your notes)
```

## Task List

### Phase 1: Infrastructure

- [x] C1: MDX pipeline, registry, `/work` and `/work/[slug]` routes, MDX typography
- [x] C2: Confidentiality guard, claims guard, registry test
- [x] C3: Diagram components (figure wrapper, agent workflow, backtest pipeline)

### Phase 2: Content (your review gates)

- [x] C4: Draft case study 1, Agentic research platform → **you edit / approve**
- [ ] C5 (deferred): Draft case study 2, Backtesting framework (from your notes) → **you edit / approve**

### Phase 3: Wire up

- [x] C6: Enable Work nav, ⌘K and sitemap; e2e + axe; screenshots

### Checkpoint: your review on the preview

- [ ] **Both case studies approved as they appear on the preview, both themes, phone + desktop**

### Phase 4: Ship

- [x] C7 (case study 1): Merge; Lighthouse on a case-study page; mark module complete

## Risks and Mitigations

| Risk                                                 | Impact | Mitigation                                                                                                                   |
| ---------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------- |
| A confidential name or detail slips into public text | High   | Private blocklist guard; methodology-only rule; your approval gate; research summaries flag sensitive terms to avoid         |
| Claims beyond the approved facts (numbers, outcomes) | High   | Claims guard limits CLOUDSUFI numbers to 12+ / 15+ / ~$1B; backtesting blocks returns language; "ask first" for anything new |
| Backtesting draft stalls without your notes          | Medium | C5 is independent; C4 and C6 proceed; the Work index can launch with one case study if you prefer                            |
| MDX setup friction with Next 16 / Turbopack          | Medium | Follow the bundled Next 16 MDX guide; C1 proves it with a stub page before content                                           |
| Diagrams unreadable on phones or in dark mode        | Low    | Responsive SVG with `viewBox`; `currentColor`/tokens; screenshot check at 360 px in both themes                              |

## Open Questions

- Your `.confidential-terms` file and backtesting notes (requested in the spec).
