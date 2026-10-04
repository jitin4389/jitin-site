# Tasks: case-studies

Plan: [plan.md](plan.md) · Spec: [SPEC-case-studies.md](../SPEC-case-studies.md)
Definition of done for every task: `npm run check` green with no warnings, `npm run test:e2e` green, committed on a branch.

---

## Phase 1: Infrastructure

### C1: MDX pipeline and routes ✅ done

**Description:** Install `@next/mdx`, `@mdx-js/loader`, `@mdx-js/react`, `@types/mdx`; configure `next.config.ts`; add `src/mdx-components.tsx` mapping headings, paragraphs, lists, links and code to site styles; registry `src/content/case-studies/index.ts`; `/work` index and `/work/[slug]` (static params, `dynamicParams = false`, per-page metadata). Prove it with a stub MDX file.

**Acceptance criteria:**

- [x] `/work` lists registry entries; `/work/<slug>` renders the MDX with site typography in both themes
- [x] Unknown slug returns 404; each page has its own title, description and canonical URL
- [x] Build output marks the routes as static

**Verification:** `npm run check`; `tests/e2e/work.spec.ts` (index, page, 404)
**Dependencies:** None
**Files:** `next.config.ts`, `package.json`, `src/mdx-components.tsx`, `src/content/case-studies/index.ts`, `src/app/work/page.tsx`, `src/app/work/[slug]/page.tsx`, `src/components/case-study/header.tsx`
**Scope:** M

### C2: Guards ✅ done

**Description:** Unit tests that read every case-study MDX file: (1) confidentiality guard against `.confidential-terms` (git-ignored; fails locally if missing, skipped in CI); (2) claims guard (backtesting: no returns/alpha/Sharpe/profit/outperform; CLOUDSUFI: only approved numbers); (3) registry integrity.

**Acceptance criteria:**

- [x] Planting a blocklisted term or a forbidden claim in an MDX file makes `npm test` fail
- [x] Missing `.confidential-terms` fails locally with a clear instruction
- [x] Every registry slug has an MDX file and complete `meta`

**Verification:** `npm test` plus a deliberate plant-and-revert check
**Dependencies:** C1
**Files:** `tests/unit/case-study-guard.test.ts`, `tests/unit/case-study-registry.test.ts`
**Scope:** S

### C3: Diagrams ✅ done

**Description:** `Figure` wrapper (caption + accessible description) and two SVG components: agent workflow (question → plan → retrieve context → call models/tools → verify → synthesize, with a provenance lane) and backtest pipeline (data → signals → costs/slippage → sizing → evaluation → execution).

**Acceptance criteria:**

- [x] `role="img"` with `<title>`/`<desc>`; caption visible
- [x] Legible at 360 px and in both themes (tokens / `currentColor`)
- [x] No horizontal scroll introduced

**Verification:** `npm run check`; e2e accessible-name check; screenshots at 360 / 1280 in both themes
**Dependencies:** C1
**Files:** `src/components/diagrams/figure.tsx`, `agent-workflow.tsx`, `backtest-pipeline.tsx`
**Scope:** M

---

## Phase 2: Content

### C4: Case study 1, Agentic research platform ✅ accepted for now (2026-10-04)

**Description:** Draft from the facts file, the live profile content and generic architecture patterns from your repos. Eight sections per the spec, with the agent-workflow diagram.

**Acceptance criteria:**

- [x] Guards pass; only approved numbers; no client/fund/expert/codenames
- [x] **You approve the text** (edits applied)

**Verification:** `npm test`; your review of the draft and preview
**Dependencies:** C2, C3
**Files:** `src/content/case-studies/agentic-research-platform.mdx`, registry
**Scope:** S

### C5: Case study 2, Backtesting framework ⏸ deferred (launch with case study 1 only; add when notes arrive)

**Description:** Draft from your notes and the approved Share India bullets. No performance claims.

**Acceptance criteria:**

- [ ] Guards pass (no returns language)
- [ ] **You approve the text**

**Verification:** `npm test`; your review
**Dependencies:** C2, C3, your notes
**Files:** `src/content/case-studies/backtesting-framework.mdx`, registry
**Scope:** S

---

## Phase 3: Wire up

### C6: Work nav, sitemap, end-to-end checks ✅ done

**Description:** Enable "Work" in nav and ⌘K, add `/work` and case-study routes to the sitemap, remove the stub, complete e2e (eight section headings, diagram names, axe both themes, 360 px).

**Acceptance criteria:**

- [x] Nav "Work" → `/work`; sitemap lists `/work` and both case studies
- [x] All e2e and axe checks pass; screenshots reviewed

**Verification:** `npm run check && npm run test:e2e`
**Dependencies:** C4, C5
**Files:** `src/config/site.ts`, `src/app/sitemap.ts`, `tests/e2e/work.spec.ts`, `tests/unit/metadata.test.ts`
**Scope:** S

### ✅ Checkpoint

- [x] **You approve both case studies on the preview**

---

## Phase 4: Ship

### C7: Production ✅ done for case study 1 (2026-10-04)

**Description:** Merge; read-only e2e and Lighthouse (mobile, 3 runs) on a case-study page; record results; mark module complete.

**Acceptance criteria:**

- [x] Lighthouse ≥ 95 / 100 / ≥ 95 / 100
- [ ] All SPEC-case-studies acceptance criteria checked

**Verification:** `PLAYWRIGHT_BASE_URL=https://jitin-site.vercel.app npm run test:e2e`; Lighthouse
**Dependencies:** Checkpoint
**Files:** `README.md`, `SPEC-case-studies.md`, `CAPABILITY-MAP.md`, tasks files
**Scope:** S
