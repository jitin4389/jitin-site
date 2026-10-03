# Implementation Plan: foundation

Spec: [SPEC-foundation.md](../SPEC-foundation.md) · Module map: [CAPABILITY-MAP.md](../CAPABILITY-MAP.md)
Tasks tracked in [tasks/todo.md](todo.md).

## Overview

Build the production-ready shell of `jitin-site`: a Next.js 16 app with a Linear-inspired design system (indigo accent, dark/light), header, footer, ⌘K menu, 404 page and SEO basics. It deploys to Vercel from the public GitHub repo `jitin4389/jitin-site`. The home page is a placeholder; the `profile` module fills it next.

## Architecture Decisions

- **Deploy pipeline first.** The riskiest unknowns are account linking (personal GitHub + personal Vercel) and new major versions (Next 16, Tailwind 4). Proving a placeholder deploys end-to-end in Phase 1 surfaces these before any design work.
- **Next.js App Router with Server Components by default.** Only the theme toggle and command menu are client components, which keeps JavaScript small for the Lighthouse ≥ 95 target.
- **Tailwind 4 CSS-first tokens** in `globals.css` (`@theme`) are the single source of colours, radii and fonts. shadcn components read the same CSS variables, so the theme stays consistent.
- **`next-themes` with the `class` strategy** gives system-default plus a persisted manual toggle, without a flash of the wrong theme.
- **`src/config/site.ts` drives navigation**, with an `enabled` flag per item. Later modules switch their link on; nothing ships a broken link.
- **Tests from Task 2 onward.** Vitest for logic and components; Playwright + axe for routes, accessibility, theme and ⌘K. `npm run check` gates every commit.

## Dependency Graph

```
T1 Scaffold ──► T2 Test harness ──► T3 Repo + Vercel deploy
                                        │
                     ┌──────────────────┘
                     ▼
              T4 Design tokens + theme
                     │
                     ▼
              T5 Config + header + footer ──► T6 404 + responsive + motion
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
   T7 ⌘K command menu     T8 SEO (metadata, OG, sitemap, robots)
          └──────────┬──────────┘
                     ▼
              T9 Lighthouse pass + production promote
```

T7 and T8 are independent and can run in either order.

## Task List

### Phase 1: Pipeline (fail fast)

- [x] T1: Scaffold Next.js 16 + TypeScript strict + Tailwind 4 + lint/format
- [x] T2: Test harness (Vitest, Playwright, axe) + `npm run check`
- [x] T3: Create public GitHub repo + Vercel project; first preview and production deploy of placeholder

### Checkpoint A: pipeline proven

- [x] `npm run check` and `npm run test:e2e` green locally
- [x] Placeholder live on `*.vercel.app`; a pull request gets a preview URL

### Phase 2: Shell and design system

- [x] T4: Design tokens (indigo, neutrals, Geist), shadcn init, dark/light theme with toggle
- [x] T5: Site config + header + footer with flag-gated navigation
- [x] T6: 404 page, responsive at 360 px, reduced-motion handling

### Checkpoint B: look and feel review

- [x] All tests green; axe clean in both themes
- [x] **You review the preview URL on phone and desktop, in both themes, and approve the look**

### Phase 3: Linear touches and SEO

- [ ] T7: ⌘K command menu (live pages + theme toggle)
- [ ] T8: SEO: metadata helper, OG image, sitemap, robots, canonical URLs
- [ ] T9: Lighthouse pass on preview; fix gaps; promote to production (with your go-ahead)

### Checkpoint C: foundation complete

- [ ] Every acceptance criterion in SPEC-foundation.md met and checked off
- [ ] Ready to start the `profile` module spec

## Risks and Mitigations

| Risk                                                                   | Impact               | Mitigation                                                                                                          |
| ---------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Vercel CLI token is invalid; personal Vercel account may not exist yet | High (blocks T3)     | You run `vercel login` with the personal account (GitHub `jitin4389`); I verify with `vercel whoami` before linking |
| `jitin-site.vercel.app` already taken                                  | Low                  | Fall back to `jitin-gupta.vercel.app` or let Vercel assign one                                                      |
| Next 16 / Tailwind 4 / shadcn version mismatch                         | Medium               | Scaffold with official CLIs (`create-next-app`, `shadcn@latest`); pin exact versions in `package.json` once green   |
| Theme flash on load                                                    | Medium (CLS, polish) | `next-themes` script in `<head>` + `suppressHydrationWarning`; e2e test reloads and checks the theme                |
| Lighthouse perf < 95 (fonts, JS)                                       | Medium               | `next/font` self-hosting, Server Components by default, ⌘K loaded lazily on first open                              |
| Pushing to the wrong GitHub account                                    | Medium               | Repo-local git identity is set; verify `gh api user` = `jitin4389` before `gh repo create`                          |

## Open Questions

1. **Personal Vercel account:** do you already have one (ideally signed in with GitHub `jitin4389`)? If not, create it at vercel.com/signup before T3.
