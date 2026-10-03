# Spec: foundation

Module `foundation` from [CAPABILITY-MAP.md](CAPABILITY-MAP.md). Every other module builds on it.

## Objective

Build the empty but production-ready shell of the site: layout, navigation, design system, SEO basics and a working deploy pipeline. Later modules then only add pages and content.

**Users**

- _Visitor (recruiter, client, peer):_ lands on any page and immediately gets a fast, polished, readable site on phone or desktop.
- _Jitin (owner):_ can add a page or component in one place and get a preview deploy for every change.

**Linear-inspired design principles** (this is how "learning from Linear" is applied)

1. Dark-first, with an equally polished light mode. Follows the system setting, with a manual toggle.
2. Restraint: one accent colour, a neutral grey scale, generous whitespace, no decorative clutter.
3. Typography does the work: tight, high-contrast headings and comfortable body text.
4. Subtle depth: thin borders, soft gradients and glow on hero and cards. No heavy shadows.
5. Feels fast: instant navigation, minimal motion (≤200 ms, disabled under `prefers-reduced-motion`).
6. Keyboard-friendly: visible focus rings and a ⌘K / Ctrl+K command menu for navigation.

**Acceptance criteria**

- [ ] Site deploys to `jitin-site.vercel.app` (or a similar `*.vercel.app` URL) from the `main` branch. Every pull request gets a preview URL.
- [ ] Header with name/logo and nav links: Home, Work, Writing, Contact. Links to unbuilt modules are hidden behind a config flag, never broken.
- [ ] Footer with LinkedIn link, email link, copyright and "last updated" date.
- [ ] Theme: dark by default when the system is dark, light when light. The toggle persists across visits. No flash of the wrong theme on load.
- [ ] ⌘K / Ctrl+K opens a command menu listing all live pages and the theme toggle.
- [ ] Custom 404 page in the site style.
- [ ] SEO: per-page title and description, Open Graph / Twitter image, `sitemap.xml`, `robots.txt`, canonical URLs.
- [ ] Responsive from 360 px to 1440 px+ with no horizontal scroll.
- [ ] Accessibility: zero axe violations on every page; all interactive elements reachable by keyboard.
- [ ] Lighthouse (mobile) on the home page: Performance ≥ 95, Accessibility 100, Best Practices ≥ 95, SEO 100.

## Tech Stack

| Concern              | Choice                                                                            | Version               |
| -------------------- | --------------------------------------------------------------------------------- | --------------------- |
| Framework            | Next.js (App Router, React Server Components, TypeScript strict)                  | 16.x                  |
| Styling              | Tailwind CSS (CSS-first `@theme` tokens)                                          | 4.x                   |
| Components           | shadcn/ui (copied into repo, Radix primitives)                                    | latest CLI            |
| Command menu         | `cmdk` (via the shadcn `command` component)                                       | latest                |
| Theming              | `next-themes`                                                                     | latest                |
| Fonts                | Geist Sans + Geist Mono via `next/font` (self-hosted, no layout shift)            | —                     |
| Icons                | `lucide-react`                                                                    | latest                |
| Runtime              | Node.js                                                                           | 24.x (local: 24.13.1) |
| Package manager      | npm                                                                               | 11.x                  |
| Hosting              | Vercel (Git integration with personal GitHub `jitin4389`; never the work account) | —                     |
| Data (later modules) | Supabase. **Not used in foundation**                                              | —                     |

## Commands

```bash
npm install                 # install dependencies
npm run dev                 # local dev server on http://localhost:3000
npm run build               # production build (must pass before merge)
npm run start               # serve the production build locally
npm run lint                # ESLint (next/core-web-vitals + typescript)
npm run typecheck           # tsc --noEmit
npm run format              # Prettier --write .
npm test                    # Vitest unit/component tests
npm run test:e2e            # Playwright: smoke, axe accessibility, theme, 404, ⌘K
npm run check               # lint + typecheck + test + build (run before every commit)
npx shadcn@latest add <component>   # add a UI primitive into src/components/ui
vercel                      # preview deploy (CLI fallback; Git integration is primary)
```

## Project Structure

```
jitin-site/
├── CAPABILITY-MAP.md          → module index
├── SPEC-<module>.md           → one spec per module
├── tasks/plan.md, todo.md     → implementation plan and task list
├── src/
│   ├── app/                   → routes (App Router): layout.tsx, page.tsx, not-found.tsx,
│   │                            sitemap.ts, robots.ts, opengraph-image.tsx
│   ├── components/
│   │   ├── ui/                → shadcn primitives (generated; edit sparingly)
│   │   └── site/              → site-level components: header, footer, theme-toggle, command-menu
│   ├── config/site.ts         → name, URLs, nav items + feature flags (single source)
│   ├── lib/                   → utilities (cn, metadata helpers)
│   └── styles/globals.css     → Tailwind import + @theme design tokens
├── content/                   → MDX/data for later modules (empty in foundation)
├── public/                    → static assets (favicon, cv.pdf later)
└── tests/
    ├── unit/                  → Vitest + Testing Library
    └── e2e/                   → Playwright + @axe-core/playwright
```

## Code Style

- TypeScript strict. No `any`. Server Components by default; add `"use client"` only where interaction needs it.
- File names in kebab-case; React components in PascalCase; one exported component per file.
- Styling uses Tailwind classes and design tokens only. No hard-coded hex colours in components.
- Copy and links come from `src/config/site.ts` or `content/`, never inline in components.
- Prettier defaults + `prettier-plugin-tailwindcss` for class ordering.

```tsx
// src/components/site/site-header.tsx
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { ThemeToggle } from "@/components/site/theme-toggle";

export function SiteHeader() {
  const items = siteConfig.nav.filter((item) => item.enabled);

  return (
    <header className="border-border/60 sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <nav
        aria-label="Main"
        className="mx-auto flex h-14 max-w-5xl items-center gap-6 px-4"
      >
        <Link href="/" className="font-medium tracking-tight">
          {siteConfig.name}
        </Link>
        <ul className="text-muted-foreground ml-auto flex items-center gap-4 text-sm">
          {items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="hover:text-foreground focus-visible:text-foreground"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <ThemeToggle />
      </nav>
    </header>
  );
}
```

## Testing Strategy

| Level             | Tool                                                 | Covers                                                                                                                         | Location      |
| ----------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------- |
| Unit / component  | Vitest + Testing Library                             | config filtering (disabled nav hidden), metadata helpers, theme toggle behaviour                                               | `tests/unit/` |
| End-to-end        | Playwright (Chromium; mobile + desktop viewports)    | every live route returns 200; 404 renders; theme persists after reload; ⌘K opens and navigates; no horizontal scroll at 360 px | `tests/e2e/`  |
| Accessibility     | `@axe-core/playwright`                               | zero violations on every live route, in both themes                                                                            | `tests/e2e/`  |
| Performance / SEO | Lighthouse (manual run on the preview URL; CI later) | thresholds in the acceptance criteria                                                                                          | —             |

Rule: every acceptance criterion maps to at least one test or a named manual check. `npm run check` must be green before every commit.

## Boundaries

**Always**

- Run `npm run check` before committing.
- Keep all personal facts consistent with `~/projects/profile_builder/drafts/00-facts.md`.
- Respect `prefers-reduced-motion` and keep focus states visible.
- Keep `.env*` files out of git; use Vercel environment variables.

**Ask first**

- Adding any dependency not listed in Tech Stack.
- Creating the GitHub repo (public or private) and linking the Vercel project.
- Any analytics, tracking or cookies.
- Buying or connecting a custom domain.
- Anything Supabase-related (that belongs to the `leads` module).

**Never**

- Commit secrets, API keys or Supabase keys.
- Publish the phone number, or client details beyond the approved claims.
- Ship a nav link to a page that doesn't exist.
- Promote a deployment to production without your go-ahead (preview deploys are fine).

## Success Criteria

`foundation` is done when:

1. `npm run check` and `npm run test:e2e` pass on a clean clone.
2. A preview URL and the production `*.vercel.app` URL both serve the shell (placeholder home page) with header, footer, theme toggle, ⌘K and 404.
3. Lighthouse mobile scores meet the thresholds above on the deployed home page.
4. You have reviewed the deployed shell in both themes on phone and desktop and approved the look.

## Decisions (2026-10-03)

| Question               | Decision                                                   |
| ---------------------- | ---------------------------------------------------------- |
| GitHub repo visibility | **Public**, under `jitin4389`                              |
| Accent colour          | **Indigo** (single accent; neutral grey scale)             |
| ⌘K command menu        | **Keep** (in scope for foundation)                         |
| Analytics              | **Later**. No analytics, tracking or cookies in foundation |

## Open Questions

1. **Offerings module:** what to offer at launch (affects module 6 only; not blocking).
