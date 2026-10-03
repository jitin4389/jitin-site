# Tasks: profile

Plan: [plan.md](plan.md) · Spec: [SPEC-profile.md](../SPEC-profile.md)
Definition of done for every task: `npm run check` green with no warnings, `npm run test:e2e` green, committed on a branch.

---

## Phase 1: Content

### P1: Typed content file + facts guard

**Description:** Create `src/content/profile.ts` with typed data for hero, about, experience, skills and certifications, copied from the approved drafts. Add a date-range formatting helper. Add the facts-guard unit test.

**Acceptance criteria:**

- [ ] All content from `drafts/00-facts.md`, `02-about.txt`, `03-cloudsufi.md`, `04-older-roles.md` and CV capability groups is represented
- [ ] Facts test passes: required claims present; no phone number, "Woolf" or "Product & AI Lead"; roles in reverse-chronological order
- [ ] `formatRange("2025-07")` → "Jul 2025 – Present"; `formatRange("2024-10", "2025-06")` → "Oct 2024 – Jun 2025"

**Verification:** `npm test`
**Dependencies:** None
**Files:** `src/content/profile.ts`, `src/lib/dates.ts`, `tests/unit/profile-content.test.ts`, `tests/unit/dates.test.ts`
**Scope:** M

---

## Phase 2: Home page sections

### P2: Hero

**Description:** Replace the placeholder with the hero: name, role, value statement, _Email me_ and _LinkedIn_ buttons. Add the decorative indigo glow and faint grid (CSS, `aria-hidden`). Enable an "About" nav anchor once P3 lands (flag stays off here).

**Acceptance criteria:**

- [ ] Hero shows name (h1), "Applied AI Architect" and the value statement in both themes
- [ ] Buttons link to `mailto:` and LinkedIn; glow/grid are hidden from assistive tech
- [ ] No horizontal scroll at 360 px; axe clean in both themes

**Verification:** `npm run check`; `tests/e2e/profile.spec.ts` (hero block); screenshot review at 360/768/1280
**Dependencies:** P1
**Files:** `src/components/profile/hero.tsx`, `src/app/page.tsx`, `src/styles/globals.css`, `tests/e2e/profile.spec.ts`
**Scope:** M

### P3: About

**Description:** About section (`id="about"`) with intro, "What I do" bullets and "How I got here". Enable the "About" nav item (`/#about`).

**Acceptance criteria:**

- [ ] Section heading "About" and all four "What I do" bullets render
- [ ] Nav "About" link scrolls to the section; ⌘K lists it

**Verification:** `npm run check`; e2e about block
**Dependencies:** P1
**Files:** `src/components/profile/about.tsx`, `src/app/page.tsx`, `src/config/site.ts`, `tests/e2e/profile.spec.ts`
**Scope:** S

### P4: Experience timeline

**Description:** Experience section (`id="experience"`): timeline grouped by company; CLOUDSUFI shows both roles with a "Promoted" marker; Share India, Vidyamandir Data Scientist and Scaler in full; Curate and pre-2020 roles inside a native `<details>` "Earlier roles". Enable the "Experience" nav item.

**Acceptance criteria:**

- [ ] Roles render in reverse-chronological order with correct date ranges
- [ ] "Earlier roles" is collapsed by default and opens with keyboard and mouse
- [ ] Nav "Experience" link works

**Verification:** `npm run check`; e2e experience block (order, details toggle)
**Dependencies:** P1
**Files:** `src/components/profile/experience.tsx`, `src/app/page.tsx`, `src/config/site.ts`, `tests/e2e/profile.spec.ts`
**Scope:** M

### P5: Skills, certifications and contact

**Description:** Skills section with four capability groups as badges; certifications with Claude Certified Architect (current) and Databricks under "Past (2024–2026)". Contact section with email and LinkedIn.

**Acceptance criteria:**

- [ ] Four skill groups render; Claude cert marked current; Databricks marked past
- [ ] Contact section links to email and LinkedIn
- [ ] Axe clean in both themes for the full page

**Verification:** `npm run check`; e2e skills/contact blocks
**Dependencies:** P1
**Files:** `src/components/profile/skills.tsx`, `src/components/profile/contact.tsx`, `src/components/ui/badge.tsx`, `src/app/page.tsx`, `tests/e2e/profile.spec.ts`
**Scope:** M

### ✅ Checkpoint A: home page review

- [ ] All tests green; axe clean in both themes
- [ ] Preview deployed; **you review hero and sections on phone + desktop, both themes**

---

## Phase 3: CV

### P6: `/cv` print page

**Description:** Print-optimised CV page from `profile.ts`: light theme forced, A4 print CSS, compact layout, header with name, role, email and LinkedIn (no phone). Header/footer chrome hidden in print.

**Acceptance criteria:**

- [ ] `/cv` renders all CV sections; axe clean
- [ ] Browser print preview fits ≤ 2 A4 pages
- [ ] Has its own metadata (title "CV")

**Verification:** `npm run check`; `tests/e2e/cv.spec.ts` (render + axe); manual print preview
**Dependencies:** P1
**Files:** `src/app/cv/page.tsx`, `src/components/profile/cv-document.tsx`, `src/styles/globals.css` (print rules), `tests/e2e/cv.spec.ts`
**Scope:** M

### P7: PDF generation and Download CV

**Description:** `scripts/generate-cv-pdf.ts` (build, start, print `/cv` to `public/jitin-gupta-cv.pdf`) and `npm run cv:pdf`. Add _Download CV_ to the hero and contact; enable the "CV" nav item; generate and commit the PDF.

**Acceptance criteria:**

- [ ] `npm run cv:pdf` writes the PDF; `/jitin-gupta-cv.pdf` returns `application/pdf`
- [ ] PDF has ≤ 2 pages, selectable text containing "Applied AI Architect", no phone number
- [ ] _Download CV_ buttons and CV nav link work

**Verification:** `npm run cv:pdf && npm run test:e2e` (cv.spec PDF checks)
**Dependencies:** P2, P6
**Files:** `scripts/generate-cv-pdf.ts`, `package.json`, `public/jitin-gupta-cv.pdf`, `src/components/profile/hero.tsx`, `src/config/site.ts`, `tests/e2e/cv.spec.ts`
**Scope:** M

### ✅ Checkpoint B: CV review

- [ ] **You review the PDF and `/cv` page**

---

## Phase 4: Ship

### P8: Production and Lighthouse ⚠️ needs your go-ahead to merge

**Description:** Merge to `main`; run e2e and Lighthouse (mobile, 3 runs) on production; record results; mark module complete.

**Acceptance criteria:**

- [ ] Lighthouse ≥ 95 / 100 / ≥ 95 / 100 on production
- [ ] All SPEC-profile acceptance criteria checked

**Verification:** `PLAYWRIGHT_BASE_URL=https://jitin-site.vercel.app npm run test:e2e`; Lighthouse
**Dependencies:** P7
**Files:** `README.md`, `SPEC-profile.md`, `CAPABILITY-MAP.md`, tasks files
**Scope:** S
