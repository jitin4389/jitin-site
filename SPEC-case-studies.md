# Spec: case-studies

**Status: 🟡 live with case study 1 (2026-10-04); case study 2 pending.** Module `case-studies` from [CAPABILITY-MAP.md](CAPABILITY-MAP.md). Depends on `foundation` (complete).

## Objective

Show _how_ you work, not just what your titles were. Two case studies launch on a new **Work** section, each explaining a real problem, your approach and the design decisions, with a simple architecture diagram.

**Users**

- _Hiring manager / technical interviewer:_ wants evidence of architecture thinking before a call. Reads one case study end to end.
- _Prospective client:_ wants to see how you'd approach their problem.
- _Jitin (owner):_ adds future case studies by writing one MDX file.

**Decisions (2026-10-04)**

| Question               | Decision                                                                                                                               |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Launch set             | **1. Agentic research platform** (CLOUDSUFI) · **2. Backtesting framework** (Share India)                                              |
| Disclosure (CLOUDSUFI) | **Methodology only.** No client, fund or expert names; no real forecasts, numbers or client data; no screenshots of the client product |
| Drafting               | **I draft, you edit.** Nothing publishes without your approval of the final text                                                       |
| Diagrams               | **Simple inline SVG**, theme-aware, generic labels only                                                                                |

### Page structure (each case study)

1. **Header:** title, one-line summary, role, period, tags (e.g. _Agentic AI · Forecasting_)
2. **Context:** the situation in 2–3 sentences, anonymised
3. **The problem:** what made it hard
4. **Approach:** how it works, with the diagram
5. **Key decisions:** 3–4 design choices and their trade-offs
6. **Outcome:** only claims already approved in the facts file (e.g. "12+ sector models", "15+ person team"); otherwise qualitative
7. **What I'd do differently:** short, honest reflection
8. **Stack:** tools and techniques

**Case study 1: Agentic research platform.** How a research question flows through planning, context retrieval, calls to quantitative models and tools, verification and synthesis, with provenance on every number. Diagram: the agent workflow.

**Case study 2: Backtesting framework.** How strategy ideas were tested robustly: data preparation, cost and slippage modelling, position sizing, entry/exit rules, and the path from research to live execution. **No performance, returns or profitability claims.** Diagram: the research-to-execution pipeline.

**Acceptance criteria**

- [ ] `/work` lists both case studies (title, summary, tags), and the **Work** nav item and ⌘K entry are enabled
- [ ] `/work/agentic-research-platform` and `/work/backtesting-framework` render all eight sections
- [ ] Each page has its own title, description and canonical URL, and appears in the sitemap
- [ ] Each diagram has a text alternative (`role="img"` + title/description) and reads well in both themes and at 360 px
- [ ] Confidentiality guard passes: no term from your private blocklist appears in any case study (see Testing)
- [ ] Backtesting text contains no returns, alpha, Sharpe or profitability claims
- [ ] Zero axe violations on `/work` and both case studies, both themes; Lighthouse ≥ 95 / 100 / ≥ 95 / 100 on a case-study page
- [ ] You approve the final text of each case study before it is merged

## Tech Stack

| Concern  | Choice                                                                                                                      |
| -------- | --------------------------------------------------------------------------------------------------------------------------- |
| Content  | MDX via official `@next/mdx` (+ `@mdx-js/loader`, `@mdx-js/react`, `@types/mdx`): new dependencies, approved with this spec |
| Metadata | `export const meta = {…}` inside each MDX file (no frontmatter plugin)                                                      |
| Routes   | `/work` index + `/work/[slug]` with `generateStaticParams` and `dynamicParams = false` (fully static)                       |
| Diagrams | React SVG components in `src/components/diagrams/`, using theme tokens via `currentColor` and CSS variables                 |
| Styling  | Typography styles mapped in `src/mdx-components.tsx` (no Tailwind typography plugin)                                        |

## Commands

```bash
npm run dev          # write and preview case studies
npm run check        # lint + typecheck + unit (incl. confidentiality guard) + build
npm run test:e2e     # Work pages, diagrams, axe
```

## Project Structure (additions)

```
src/content/case-studies/
  agentic-research-platform.mdx   → case study 1 (exports `meta`)
  backtesting-framework.mdx       → case study 2
  index.ts                        → ordered registry: slug → meta + lazy import
src/app/work/page.tsx             → index
src/app/work/[slug]/page.tsx      → case-study page
src/components/diagrams/          → agent-workflow.tsx, backtest-pipeline.tsx, figure.tsx
src/components/case-study/        → header.tsx, section helpers
src/mdx-components.tsx            → headings, lists, links, code mapped to site styles
.confidential-terms               → YOUR private blocklist, one term per line (git-ignored, never committed)
tests/unit/case-study-guard.test.ts
tests/e2e/work.spec.ts
```

## Code Style

```mdx
{/* src/content/case-studies/agentic-research-platform.mdx */}
import { AgentWorkflow } from "@/components/diagrams/agent-workflow";

export const meta = {
  title: "Agentic research platform",
  summary:
    "An AI research system that turns investment questions into traceable, model-backed answers.",
  role: "Applied AI Architect",
  period: "2024 – present",
  tags: ["Agentic AI", "Forecasting", "Architecture"],
};

## Context

…

<AgentWorkflow />
```

## Testing Strategy

| Level                       | Covers                                                                                                                                                                                                                                                                                                                   |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Unit: confidentiality guard | Reads every case-study MDX file and fails if any term in `.confidential-terms` appears (case-insensitive). The blocklist itself is **git-ignored**, so the sensitive names never enter the public repo. If the file is missing, the test fails locally with instructions (it's skipped only in CI, where it can't exist) |
| Unit: claims guard          | Backtesting MDX contains no `returns`, `alpha`, `Sharpe`, `profit`, `outperform`; numbers in the CLOUDSUFI case study are limited to the approved ones (12+, 15+, ~$1B)                                                                                                                                                  |
| Unit: registry              | Every registry entry has an MDX file and complete `meta`; slugs are unique                                                                                                                                                                                                                                               |
| E2E                         | `/work` lists both; each page shows the eight section headings; diagram has an accessible name; nav "Work" works; 404 for unknown slug; axe both themes; no horizontal scroll at 360 px                                                                                                                                  |
| Manual                      | You review the drafted text and diagrams; Lighthouse on production after merge                                                                                                                                                                                                                                           |

## Boundaries

**Always:** draft only from `profile_builder/drafts/00-facts.md`, the live profile content and your own descriptions; keep the confidentiality guard green; show every draft to you before merge.

**Ask first:** any number, metric or outcome not in the facts file; naming any technology vendor or dataset that could identify the client; adding a third case study.

**Never:** name the client, the fund, the expert, or internal product or code names; publish real forecasts or client outputs; claim trading returns; commit `.confidential-terms`.

## Success Criteria

`case-studies` is done when both pages are live, every acceptance criterion is checked, you've approved the final text, and Lighthouse holds on production.

## What I need from you

1. **Your private blocklist** (names to never publish, e.g. the client, the fund, the expert, internal product/codenames). You create it yourself; I never see it in chat:
   `! nano ~/projects/jitin-site/.confidential-terms` (one term per line, save with Ctrl+O, exit with Ctrl+X)
2. **Backtesting notes:** a few lines on what made the framework work (data frequency, instruments, tools, how costs/slippage were modelled, how strategies moved to live). Rough is fine; I'll shape it.
3. **Agentic platform:** OK for me to read your STDF / agent repos on this Mac to get the architecture right? I'll only describe patterns in generic terms; nothing is copied.

## Implementation notes (2026-10-04)

- Metadata lives in the typed registry `src/content/case-studies/index.ts` (not `export const meta` in MDX), so unit tests can check it without compiling MDX.
- The platform case study is a long-form version of the eight-part structure: Context, Problem and an architecture overview, then five themed chapters (tools & MCP, skills as context, structured handoffs, evaluations, automation), then Outcome, What I'd do differently and Stack. Requested by the owner after the first draft was too shallow.
- Diagrams are responsive HTML ordered lists (`FlowDiagram`) rather than SVG: steps reflow on phones, follow theme tokens, and screen readers read them as a numbered list with a visible caption.

## Scope change (2026-10-04)

Launch with case study 1 only, at the owner's request. Case study 2 (backtesting) follows when the owner's notes arrive; acceptance criteria mentioning both apply once it ships.

## Approvals (2026-10-04)

- Spec approved.
- Permission granted to read the STDF / agent repos on this Mac for the platform case study (patterns described generically; nothing copied).

## Open Questions

1. **Vercel team name:** your preview URLs include `stellar-works`. If that resembles an internal product name, rename the team slug (Vercel → Team Settings → General) before more previews are shared. Production uses `jitin-site.vercel.app`, so it's unaffected.
