# Tasks: foundation

Plan: [plan.md](plan.md) · Spec: [SPEC-foundation.md](../SPEC-foundation.md)
Definition of done for every task: `npm run check` green, no new lint warnings, changes committed on a branch.

---

## Phase 1: Pipeline

### T1: Scaffold Next.js app ✅ done

**Description:** Create the Next.js 16 app (App Router, TypeScript strict, Tailwind 4, ESLint, `src/` dir, `@/*` alias) with a placeholder home page. Add Prettier and the scripts listed in the spec.

**Acceptance criteria:**

- [x] `npm run dev` serves a placeholder home page ("Jitin Gupta, coming soon")
- [x] `npm run lint`, `npm run typecheck` and `npm run build` pass
- [x] `tsconfig.json` has `"strict": true`; `.gitignore` covers `.env*`, `.next`, `node_modules`

**Verification:** `npm run lint && npm run typecheck && npm run build`; open http://localhost:3000
**Dependencies:** None
**Files:** `package.json`, `tsconfig.json`, `next.config.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/styles/globals.css`, `.prettierrc` (plus generated config)
**Scope:** M

### T2: Test harness and `check` script ✅ done

**Description:** Add Vitest + Testing Library for unit tests and Playwright + `@axe-core/playwright` for e2e. Write one smoke test at each level. Add `npm test`, `npm run test:e2e` and `npm run check`.

**Acceptance criteria:**

- [x] Unit smoke test passes under `npm test`
- [x] E2E: home returns 200 and has zero axe violations (mobile + desktop viewports)
- [x] `npm run check` runs lint → typecheck → test → build and fails if any step fails

**Verification:** `npm run check && npm run test:e2e`
**Dependencies:** T1
**Files:** `vitest.config.ts`, `playwright.config.ts`, `tests/unit/smoke.test.ts`, `tests/e2e/smoke.spec.ts`, `package.json`
**Scope:** M

### T3: GitHub repo and Vercel deploy ✅ done

**Description:** Create the public repo `jitin4389/jitin-site`, push `main`, and create a Vercel project under your personal account linked to it. Confirm production and preview deploys work.

**Acceptance criteria:**

- [x] `gh api user` returns `jitin4389` before the repo is created; repo is public
- [x] Production URL (`*.vercel.app`) serves the placeholder
- [x] A test pull request gets a Vercel preview URL

**Verification:** open the production URL; open the PR's preview link
**Dependencies:** T2; you logged in with `vercel login` on the personal account
**Files:** none in code (`README.md` with live URL)
**Scope:** S

### ✅ Checkpoint A: pipeline proven

- [x] `npm run check` + `npm run test:e2e` green
- [x] Placeholder live; previews working
- [x] Quick review with you before design work

---

## Phase 2: Shell and design system

### T4: Design tokens and theme ✅ done

**Description:** Initialise shadcn/ui. Define Tailwind 4 `@theme` tokens: indigo accent, neutral grey scale, Geist Sans/Mono via `next/font`, radii, subtle border and gradient tokens. Wire `next-themes` (system default, persisted toggle, no flash) and a `ThemeToggle` component.

**Acceptance criteria:**

- [x] Dark when the system is dark, light when light; the toggle overrides and persists after reload
- [x] No flash of the wrong theme on hard reload
- [x] Zero axe violations (including colour contrast) in both themes

**Verification:** `npm run check`; e2e `theme.spec.ts` (emulate dark/light, toggle, reload, assert `html` class); manual hard-reload check
**Dependencies:** T1, T2
**Files:** `src/styles/globals.css`, `src/app/layout.tsx`, `src/components/site/theme-provider.tsx`, `src/components/site/theme-toggle.tsx`, `tests/e2e/theme.spec.ts`
**Scope:** M

### T5: Site config, header and footer ✅ done

**Description:** Create `src/config/site.ts` (name, email, LinkedIn URL, nav items with `enabled` flags). Build `SiteHeader` (as in the spec's code-style example) and `SiteFooter` (LinkedIn, email, ©, last-updated date). Render both in the root layout.

**Acceptance criteria:**

- [x] Only `enabled` nav items render (unit test)
- [x] Every rendered nav link returns 200 (e2e)
- [x] Footer shows LinkedIn and email links; no phone number anywhere

**Verification:** `npm run check`; `tests/unit/site-config.test.ts`; `tests/e2e/navigation.spec.ts`
**Dependencies:** T4
**Files:** `src/config/site.ts`, `src/components/site/site-header.tsx`, `src/components/site/site-footer.tsx`, `src/app/layout.tsx`, tests
**Scope:** M

### T6: 404, responsiveness and motion ✅ done

**Description:** Add a styled `not-found.tsx`. Make sure layouts hold from 360 px to 1440 px+. Add a global `prefers-reduced-motion` rule capping transitions.

**Acceptance criteria:**

- [x] Unknown URL shows the custom 404 with a link home (status 404)
- [x] No horizontal scroll at 360 px on all live routes
- [x] With reduced motion emulated, transitions are disabled

**Verification:** `npm run check`; `tests/e2e/layout.spec.ts` (404 status; `scrollWidth <= clientWidth` at 360 px; reduced-motion emulation)
**Dependencies:** T5
**Files:** `src/app/not-found.tsx`, `src/styles/globals.css`, `tests/e2e/layout.spec.ts`
**Scope:** S

### ✅ Checkpoint B: look and feel review

- [x] All tests green; axe clean in both themes
- [ ] Preview deployed; **you review on phone + desktop, both themes, and approve the look**

---

## Phase 3: Linear touches and SEO

### T7: ⌘K command menu

**Description:** Add the shadcn `command` component (cmdk). ⌘K / Ctrl+K opens a dialog listing enabled pages from `site.ts` plus "Toggle theme". Load it lazily so it doesn't add to initial JavaScript.

**Acceptance criteria:**

- [ ] ⌘K (macOS) and Ctrl+K (others) open the menu; Esc closes it and returns focus
- [ ] Selecting a page navigates; selecting "Toggle theme" switches theme
- [ ] Menu is fully keyboard-operable with zero axe violations when open

**Verification:** `npm run check`; `tests/e2e/command-menu.spec.ts`
**Dependencies:** T5
**Files:** `src/components/ui/command.tsx`, `src/components/ui/dialog.tsx`, `src/components/site/command-menu.tsx`, `src/app/layout.tsx`, test
**Scope:** M

### T8: SEO basics

**Description:** Add a `buildMetadata()` helper (title template, description, canonical, Open Graph/Twitter). Generate a default OG image with `opengraph-image.tsx` in the site style. Add `sitemap.ts` and `robots.ts` driven by enabled routes.

**Acceptance criteria:**

- [ ] Each page has a unique title and description and a canonical URL (unit test on helper)
- [ ] `/sitemap.xml` lists only live routes; `/robots.txt` allows indexing and points to the sitemap
- [ ] `/opengraph-image` returns a 1200×630 PNG

**Verification:** `npm run check`; `tests/unit/metadata.test.ts`; `tests/e2e/seo.spec.ts`
**Dependencies:** T5
**Files:** `src/lib/metadata.ts`, `src/app/opengraph-image.tsx`, `src/app/sitemap.ts`, `src/app/robots.ts`, tests
**Scope:** M

### T9: Lighthouse pass and production promote ⚠️ needs your go-ahead

**Description:** Run Lighthouse (mobile) on the preview home page; fix anything below target; merge to `main` to update production.

**Acceptance criteria:**

- [ ] Performance ≥ 95, Accessibility 100, Best Practices ≥ 95, SEO 100 (mobile)
- [ ] Production URL updated after your approval

**Verification:** `npx lighthouse <preview-url> --preset=perf --form-factor=mobile` plus full categories; scores recorded in `README.md`
**Dependencies:** T6, T7, T8
**Files:** fixes only as needed; `README.md`
**Scope:** S

### ✅ Checkpoint C: foundation complete

- [ ] Every acceptance criterion in SPEC-foundation.md checked
- [ ] Next: write `SPEC-profile.md`
