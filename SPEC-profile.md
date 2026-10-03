# Spec: profile

Module `profile` from [CAPABILITY-MAP.md](CAPABILITY-MAP.md). Depends on `foundation` (complete).

## Objective

Turn the placeholder home page into your profile. In 30 seconds a visitor should know who you are, what you've built, and how to reach you or get your CV.

**Users**

- _Recruiter / hiring manager:_ scans the hero, skims experience, downloads the CV.
- _Fund / research client or peer:_ reads About and the CLOUDSUFI story to judge depth.
- _Jitin (owner):_ updates one content file and both the site and the CV PDF change together.

**Decisions taken by default** (you said "go ahead" without choosing; change any of these at review)

1. **One long home page with sections**, not separate pages. The nav links jump to sections.
2. **CV PDF is generated from the same content as the site.** No separate design file. A print-styled `/cv` page is rendered to PDF by a script.
3. **The public CV omits your phone number** (spec rule: never publish it). Email and LinkedIn only.
4. **Expired Databricks certification** is shown as "2024–2026" under a "Past" label, never as current.

### Page structure (home `/`)

| #   | Section                     | Content source                                       | Notes                                                                                                                                                                                      |
| --- | --------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | **Hero**                    | headline + first About line                          | Name, "Applied AI Architect", one-line value statement, buttons: _Download CV_, _Email me_, _LinkedIn_. Linear-style indigo radial glow and faint grid; no animation beyond a ≤200 ms fade |
| 2   | **About**                   | `drafts/02-about.txt`                                | "What I do" bullets and "How I got here", lightly edited for the web                                                                                                                       |
| 3   | **Experience**              | `drafts/03-cloudsufi.md`, `drafts/04-older-roles.md` | Timeline. CLOUDSUFI shows both roles and the promotion. Share India, Vidyamandir Data Scientist and Scaler in full; Curate plus pre-2020 roles collapsed under "Earlier"                   |
| 4   | **Skills & certifications** | `cv/CV-master.md` core capabilities                  | 4 groups: Applied AI, Quant research, Product & leadership, Engineering. Claude Certified Architect as a card                                                                              |
| 5   | **Contact**                 | site config                                          | Email + LinkedIn. Replaced by the form when `leads` ships                                                                                                                                  |

Plus **`/cv`**: a print-optimised CV page (light theme, A4) and **`/jitin-gupta-cv.pdf`**, the generated PDF.

**Acceptance criteria**

- [ ] All five sections render on `/` with content matching `profile_builder/drafts/00-facts.md`: titles, dates, metrics, approved claims only.
- [ ] Nav shows **About · Experience · CV** (section anchors and `/cv`); ⌘K lists the same.
- [ ] _Download CV_ serves `/jitin-gupta-cv.pdf` (PDF, ≤ 2 A4 pages, selectable text, no phone number).
- [ ] `/cv` renders the same content as the PDF; prints cleanly from the browser.
- [ ] Changing a fact in the content file changes the home page, `/cv` and the PDF after `npm run cv:pdf`.
- [ ] Hero looks right in both themes at 360 px, 768 px and 1280 px+; no horizontal scroll.
- [ ] Zero axe violations on `/` and `/cv` in both themes.
- [ ] Lighthouse mobile on production still ≥ 95 / 100 / ≥ 95 / 100.

## Tech Stack

No new runtime dependencies. Uses foundation's Next.js 16, Tailwind 4, shadcn/ui and lucide.

- PDF generation: Playwright (already a dev dependency) prints `/cv` to PDF. This avoids a PDF library.
- shadcn components to add if needed: `badge`, `separator`.

## Commands

```bash
npm run dev            # work on sections at http://localhost:3000
npm run cv:pdf         # build + print /cv to public/jitin-gupta-cv.pdf (commit the result)
npm run check          # lint + typecheck + unit + build
npm run test:e2e       # includes new profile and CV tests
```

## Project Structure (additions)

```
src/content/profile.ts          → single typed source: hero, about, experience, skills, certifications
src/components/profile/          → hero.tsx, about.tsx, experience.tsx, skills.tsx, contact.tsx
src/app/page.tsx                 → composes the sections
src/app/cv/page.tsx              → print-styled CV built from profile.ts
scripts/generate-cv-pdf.mts       → Playwright: open /cv, page.pdf() → public/jitin-gupta-cv.pdf
public/jitin-gupta-cv.pdf        → generated, committed
tests/unit/profile-content.test.ts
tests/e2e/profile.spec.ts, cv.spec.ts
```

## Code Style

Same conventions as foundation. Content is typed data, never hard-coded in components:

```ts
// src/content/profile.ts
export type Role = {
  title: string;
  start: string; // "2025-07"
  end?: string; // omitted = present
  summary?: string;
  highlights: string[];
};

export const experience: {
  company: string;
  location: string;
  roles: Role[];
}[] = [
  {
    company: "CLOUDSUFI",
    location: "Noida",
    roles: [
      {
        title: "Applied AI Architect",
        start: "2025-07",
        highlights: [/* … */],
      },
      {
        title: "Senior Software Engineer – Applied AI",
        start: "2024-10",
        end: "2025-06",
        highlights: [/* … */],
      },
    ],
  },
];
```

## Testing Strategy

| Level                            | Covers                                                                                                                                                                                                                             |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit (`profile-content.test.ts`) | Facts guard: required claims present (Applied AI Architect from Jul 2025, ~$1B AUM, 12+ models, 15+ team, ~2% MAPE); forbidden content absent (phone number, "Woolf", "Product & AI Lead"); dates in order; date formatting helper |
| E2E (`profile.spec.ts`)          | Each section visible with its heading; nav anchors scroll to sections; CV and contact links correct; 360 px no horizontal scroll; axe in both themes                                                                               |
| E2E (`cv.spec.ts`)               | `/cv` renders; `/jitin-gupta-cv.pdf` returns `application/pdf`, ≤ 2 pages, contains "Applied AI Architect", has no phone number                                                                                                    |
| Manual                           | You review hero and CV PDF visually; Lighthouse on production after merge                                                                                                                                                          |

## Boundaries

**Always:** take every fact from `profile_builder/drafts/00-facts.md`; regenerate and commit the PDF whenever `profile.ts` changes; keep the hero's glow and grid decorative only (`aria-hidden`).

**Ask first:** any wording beyond the approved drafts (new claims, metrics, client details); adding a photo; any new dependency.

**Never:** publish the phone number; name the hedge fund or the expert; claim investment returns; list Woolf; show the expired certification as current.

## Success Criteria

`profile` is done when every acceptance criterion is checked, `npm run check` and `npm run test:e2e` pass, the PDF is committed, Lighthouse holds on production, and you've approved the home page and CV PDF.

## Decisions (2026-10-03)

| Question           | Decision                                                                                                             |
| ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| Photo              | **No photo**; text-led hero                                                                                          |
| "Earlier" roles    | Collapse Curate, Loqation, FoxBox, Senior Faculty, Head of Physics under one "Earlier" disclosure (default accepted) |
| CV source of truth | `src/content/profile.ts` from now on; `profile_builder/cv/CV-master.md` frozen (default accepted)                    |
