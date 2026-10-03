# Implementation Plan: profile

Spec: [SPEC-profile.md](../SPEC-profile.md) · Module map: [CAPABILITY-MAP.md](../CAPABILITY-MAP.md)
Tasks tracked in [tasks/todo.md](todo.md). Previous module: [foundation-plan.md](foundation-plan.md) (complete).

## Overview

Replace the placeholder home page with a one-page profile (Hero, About, Experience, Skills & certifications, Contact). Add a print-styled `/cv` page and a generated `/jitin-gupta-cv.pdf`. Everything reads from one typed content file, guarded by a facts test.

## Architecture Decisions

- **Content first.** `src/content/profile.ts` and its facts-guard test land before any UI, so every later task renders data that has already been checked.
- **Sections are Server Components.** Only the "Earlier roles" disclosure needs interaction, and it uses native `<details>`, which needs no JavaScript. This protects the Lighthouse score.
- **Nav never links to something missing.** Section anchors switch on as each section ships; the CV link and _Download CV_ buttons switch on only when the PDF exists (P7).
- **PDF via Playwright, not a PDF library.** `scripts/generate-cv-pdf.ts` builds the site, prints `/cv` with `page.pdf()` and commits the result. There is no runtime cost and no new dependency.
- **Decorative visuals are CSS only.** The glow uses a radial gradient on the `--glow` token and the grid is a masked background; both are `aria-hidden`. No images, no motion beyond a ≤200 ms fade.

## Dependency Graph

```
P1 Content + facts guard
   ├──► P2 Hero (+ nav anchors)
   ├──► P3 About
   ├──► P4 Experience timeline
   ├──► P5 Skills, certifications, contact
   │         └── Checkpoint A (home page review)
   └──► P6 /cv print page ──► P7 PDF script + Download CV + CV nav
                                   └── Checkpoint B (CV review)
                                         └──► P8 Merge, Lighthouse on production
```

P2–P5 depend only on P1 and touch separate files, so their order is flexible.

## Task List

### Phase 1: Content

- [x] P1: Typed content file + facts-guard unit test

### Phase 2: Home page sections

- [x] P2: Hero with glow/grid, CTAs (Email, LinkedIn), nav anchor for About
- [x] P3: About section
- [x] P4: Experience timeline with "Earlier" disclosure
- [x] P5: Skills & certifications + Contact section

### Checkpoint A: home page review

- [x] All tests green; axe clean in both themes
- [ ] **You review the preview: hero, sections, both themes, phone + desktop**

### Phase 3: CV

- [ ] P6: `/cv` print-styled page
- [ ] P7: PDF generation script, _Download CV_ buttons, CV nav link

### Checkpoint B: CV review

- [ ] **You review the PDF (≤ 2 pages, content, no phone number)**

### Phase 4: Ship

- [ ] P8: Merge to production; Lighthouse ≥ targets; mark module complete

## Risks and Mitigations

| Risk                                                 | Impact             | Mitigation                                                                                           |
| ---------------------------------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------- |
| Copy drifts from approved facts                      | High (credibility) | Facts-guard unit test; content copied only from `drafts/`; any new wording is "ask first"            |
| PDF exceeds 2 pages                                  | Medium             | Print CSS (A4, tight spacing, CLOUDSUFI 7 bullets max); e2e asserts page count                       |
| Glow/grid hurts contrast or performance              | Medium             | Pure CSS, decorative layer behind content; axe contrast check in both themes; Lighthouse after merge |
| Generated PDF goes stale                             | Medium             | `npm run cv:pdf` documented; e2e checks the PDF contains the current headline text                   |
| Anchor nav breaks the "every nav link resolves" test | Low                | `/#about` style links return 200; test also asserts the target section id exists                     |

## Open Questions

None blocking.
