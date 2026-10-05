# Project log: Jitin Gupta personal brand

**Start here in any new session.** One page with the state, the decisions and the open items. Details live in the linked files. Last updated: 2026-10-05.

## 1. What this project is

- **Goal:** reposition Jitin as an **Applied AI Architect**, and build a personal brand site that can later host his own products, courses and offerings (solopreneur path).
- **Live site:** https://jitin-site.vercel.app
- **Repo:** https://github.com/jitin4389/jitin-site (public), locally at `~/projects/jitin-site`
- **Companion folder:** `~/projects/profile_builder` (not a git repo) holds the LinkedIn work and the approved facts.

## 2. Accounts (personal only; never the work accounts)

| Service         | Account                                                                                 | Notes                                                                                                         |
| --------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| GitHub          | `jitin4389` (jitin4389@gmail.com)                                                       | `gh auth switch --user jitin4389` before pushing; repo uses HTTPS with gh credentials (repo-local git config) |
| Vercel          | `jitin4389` (jitin4389@gmail.com), personal default team (name in the Vercel dashboard) | Git-connected; every PR gets a private preview, `main` deploys to production                                  |
| Supabase        | project `jitin-site`, Mumbai, account jitin4389                                         | Table `contact_messages` (contact form). Free tier pauses after ~1 week idle                                  |
| Vercel env vars | `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `CONTACT_IP_SALT`                                | Production + Preview, all sensitive. Never `NEXT_PUBLIC_`                                                     |

Work accounts (`jitinguptaCS` on GitHub, the CLOUDSUFI Vercel account) must not be used for this project.

## 3. Status (2026-10-05)

| Module                                     | Status                                    | Spec                                                                      |
| ------------------------------------------ | ----------------------------------------- | ------------------------------------------------------------------------- |
| LinkedIn overhaul                          | ✅ done 2026-10-03                        | `profile_builder/LINKEDIN_UPDATE_PLAN.md`                                 |
| foundation (shell, design system, ⌘K, SEO) | ✅ live                                   | [SPEC-foundation.md](../SPEC-foundation.md)                               |
| profile (home page, `/cv`, CV PDF)         | ✅ live                                   | [SPEC-profile.md](../SPEC-profile.md)                                     |
| leads (contact form → Supabase)            | ✅ live                                   | [SPEC-leads.md](../SPEC-leads.md)                                         |
| case-studies (`/work`)                     | 🟡 case study 1 live; backtesting pending | [SPEC-case-studies.md](../SPEC-case-studies.md)                           |
| writing (`/writing`, RSS)                  | ✅ 10-part series live                    | [SPEC-writing.md](../SPEC-writing.md), [intent](intent/writing-series.md) |
| offerings                                  | Not started                               | [CAPABILITY-MAP.md](../CAPABILITY-MAP.md)                                 |

Quality bar on every page: Lighthouse mobile ≥ 95 / 100 / ≥ 95 / 100 (actual 96–99 / 100 / 100 / 100), zero axe violations in both themes, no horizontal scroll at 360 px.

## 4. Key decisions (newest first)

| Date       | Decision                                                                                                                                                                                                    | Why                                                                                                          |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| 2026-10-04 | Writing series produced by a multi-agent team (researcher, writer, editor, evaluator) with **one human gate: the owner says "publish"** before any merge to production                                      | Owner has little review time; evaluator checks accuracy, originality, confidentiality, claims, runnable code |
| 2026-10-04 | Udemy "Claude Code" course used **only as a topic map**; all content original (own experience + official docs)                                                                                              | Copyright and Udemy terms; owned content can become his own course and videos                                |
| 2026-10-04 | Audience for the series: working developers and tech leads; "In one minute" boxes for juniors. **Track B** (AI foundations for students/juniors, tool-agnostic, age-appropriate) deferred                   | Mixed audiences weaken both; Anthropic consumer services require 18+                                         |
| 2026-10-04 | Articles are portable plain Markdown with summary, key terms, key points and a video outline per article                                                                                                    | Future Medium/LinkedIn/Discord cross-posts and YouTube lectures/Shorts                                       |
| 2026-10-04 | Work section launched with case study 1 only                                                                                                                                                                | Backtesting notes not yet available                                                                          |
| 2026-10-04 | Case studies: **methodology only** for CLOUDSUFI work; private git-ignored blocklist `.confidential-terms` guards all content (tests report counts, never terms); claims guard allows only approved numbers | Client confidentiality                                                                                       |
| 2026-10-04 | Contact form: Supabase only (no email alerts), honeypot + 5/hour per hashed IP, no newsletter yet                                                                                                           | Owner's choice; newsletter moved to writing                                                                  |
| 2026-10-03 | One-page home with sections; CV PDF generated from `src/content/profile.ts` (now the CV source of truth; `profile_builder/cv/CV-master.md` frozen); no photo; phone never published                         | Single source of truth; privacy                                                                              |
| 2026-10-03 | Stack: Next.js 16, Tailwind 4, shadcn/ui, Vercel; Linear-inspired design, indigo accent, ⌘K menu; public repo; no analytics yet                                                                             | Owner's preference; personal brand                                                                           |
| 2026-10-03 | Title: **Applied AI Architect** (Jul 2025–present), previously Senior Software Engineer – Applied AI (Oct 2024–Jun 2025)                                                                                    | More relevant and higher impact than "Product Owner"                                                         |
| 2026-10-03 | Hedge fund (~$1B AUM) and "globally recognized expert on technology-driven economic disruption" may be mentioned; never named                                                                               | Owner approval                                                                                               |

Approved public facts: `~/projects/profile_builder/drafts/00-facts.md` (12+ sector models, 15+ person team, ~$1B AUM, ~2% MAPE, 20% dropout reduction, etc.).

## 5. How to work on the site

- **Process:** spec-driven (addy agent-skills): `CAPABILITY-MAP.md` → `SPEC-<module>.md` → `tasks/plan.md` + `tasks/todo.md` → build on a branch → PR → preview → owner OK → merge. Finished plans are archived as `tasks/<module>-plan.md`.
- **Commands:** `npm run check` (lint, typecheck, unit, build) and `npm run test:e2e` before every commit; `npm run cv:pdf` after editing `src/content/profile.ts`.
- **Content:** profile in `src/content/profile.ts`; case studies in `src/content/case-studies/` (MDX + registry); articles in `src/content/writing/` (Markdown + registry).
- **Editorial team:** reusable workflow scripts in [docs/editorial/workflow/](editorial/workflow/): `editorial-team.workflow.js` (research → write → edit → evaluate, one revision loop) and `minor-fixes.workflow.js`. Run them with the Workflow tool via `scriptPath` and an `args` object (see the script header and the article specs used for parts 1–10 in `docs/editorial/*.meta.json`).
- **Never:** publish without the owner's go-ahead; commit secrets or `.confidential-terms`; name the client, fund, expert, people, vendors or internal codenames.

## 6. Open items

1. **Case study 2 (backtesting):** needs owner notes (data, tools, costs/slippage, robustness checks, path to live). Then add `src/content/case-studies/backtesting-framework.mdx` + registry entry.
2. **"Phase changes" wording** on the site profile and LinkedIn echoes the fund's name; proposed replacement "market shifts". Awaiting owner decision.
3. **Optional case-study numbers** (49 tools, 73 criteria, 18 agents, 200+ sessions, 10%→90% fix) need owner approval before use.
4. **Security:** rotate the plaintext read-only DB password found in `.mcp.json` across work repos; replace the Vercel CLI token (`vercel logout` then `vercel login`) because it was printed in a session.
5. **Performance watch:** home page LCP 2.7 s after the contact form (target met; optional lazy-load of the form).
6. **Next candidates:** LinkedIn announcement posts for the series; cross-posting; Track B scoping; `offerings` module (needs a decision on what to offer); Ego Lite browser update pending.

## 7. Change history

15 merged PRs on GitHub (foundation #1–#4, profile #5–#6, leads #7–#8, case studies #9–#10, writing #11–#15). Each PR description lists changes and verification.
