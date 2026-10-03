# Capability Map: jitin-site

Personal brand site for Jitin Gupta: profile showcase now, solopreneur products and offerings later.
Next.js + Tailwind + shadcn/ui on Vercel; Supabase only for dynamic data. Design language inspired by Linear.

Approved: 2026-10-03 (repo `~/projects/jitin-site`, personal name brand, `*.vercel.app` domain for now)

| Module id    | Responsibility                                                                                                     | Depends on        | Spec                                        |
| ------------ | ------------------------------------------------------------------------------------------------------------------ | ----------------- | ------------------------------------------- |
| foundation   | App shell, layout, navigation, design system (Linear-style tokens, dark/light), SEO base, Vercel deploy, CI checks | —                 | [SPEC-foundation.md](SPEC-foundation.md) ✅ |
| profile      | Hero, About, experience timeline, skills & certifications, CV PDF download                                         | foundation        | [SPEC-profile.md](SPEC-profile.md) ✅       |
| leads        | Contact form + newsletter signup → Supabase, email notification, spam protection                                   | foundation        | —                                           |
| case-studies | Featured work pages (MDX), starting with one public-safe forecasting-platform write-up                             | foundation        | —                                           |
| writing      | Blog (MDX), tags, RSS                                                                                              | foundation        | —                                           |
| offerings    | Services / products pages with CTAs into leads                                                                     | foundation, leads | —                                           |

**Build order:** foundation → profile → leads → case-studies, writing (parallel) → offerings

**First public launch:** after foundation + profile + leads.

**Content source of truth:** `~/projects/profile_builder/drafts/00-facts.md`. Site copy must not claim anything outside it.
