# jitin-site

Personal site of Jitin Gupta, Applied AI Architect.

- **Live:** https://jitin-site.vercel.app
- **Stack:** Next.js 16 · Tailwind CSS 4 · shadcn/ui · Vercel
- **Specs:** [CAPABILITY-MAP.md](CAPABILITY-MAP.md) · [SPEC-foundation.md](SPEC-foundation.md) · [tasks/](tasks/)

## Develop

```bash
npm install
npm run dev        # http://localhost:3000
npm run check      # lint + typecheck + unit tests + build
npm run test:e2e   # Playwright + axe (set PLAYWRIGHT_BASE_URL to test a deployment)
npm run cv:pdf     # regenerate public/jitin-gupta-cv.pdf after editing src/content/profile.ts
```

## Quality (foundation, 2026-10-03)

Lighthouse, mobile, production (`https://jitin-site.vercel.app`), 3 runs:

| Performance | Accessibility | Best Practices | SEO | LCP       | TBT      | CLS |
| ----------- | ------------- | -------------- | --- | --------- | -------- | --- |
| 99          | 100           | 100            | 100 | 2.1–2.2 s | 10–30 ms | 0   |

Automated: 7 unit tests, 44 Playwright e2e tests (desktop + mobile, axe in both themes), passing locally and against production.

## Quality (profile, 2026-10-03)

Lighthouse, mobile, production, 3 runs per page:

| Page  | Performance | Accessibility | Best Practices | SEO | LCP       | CLS |
| ----- | ----------- | ------------- | -------------- | --- | --------- | --- |
| `/`   | 98–99       | 100           | 100            | 100 | 2.1–2.3 s | 0   |
| `/cv` | 98–99       | 100           | 100            | 100 | 2.0–2.3 s | 0   |

Automated: 28 unit tests (incl. facts guard and CV freshness), 80 Playwright e2e tests, passing locally and against production.

## Quality (leads, 2026-10-04)

Lighthouse, mobile, production `/`, 3 runs: Performance 96 · Accessibility 100 · Best Practices 100 · SEO 100 · LCP 2.7 s · CLS 0.

Automated: 56 unit tests, 94 e2e tests locally (80 read-only against production; contact submissions are never sent to production by tests). No Supabase secrets in the client bundle.

### Contact messages

Stored in Supabase table `contact_messages` (Table Editor; filter `status = new`). Schema: [supabase/migrations/0001_contact_messages.sql](supabase/migrations/0001_contact_messages.sql). Vercel env: `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `CONTACT_IP_SALT` (Production + Preview). See [.env.example](.env.example).

## Quality (case studies, 2026-10-04)

Lighthouse, mobile, production, 3 runs per page:

| Page                              | Performance | Accessibility | Best Practices | SEO | LCP       | CLS |
| --------------------------------- | ----------- | ------------- | -------------- | --- | --------- | --- |
| `/work`                           | 99          | 100           | 100            | 100 | 2.0 s     | 0   |
| `/work/agentic-research-platform` | 98–99       | 100           | 100            | 100 | 2.1–2.3 s | 0   |

Automated: 63 unit tests (incl. confidentiality and claims guards), 110 e2e tests locally (96 read-only against production).

### Adding a case study

1. Write `src/content/case-studies/<slug>.mdx` and add its entry to `src/content/case-studies/index.ts`.
2. Keep the private, git-ignored `.confidential-terms` blocklist up to date; `npm test` fails on any match.
3. New numbers must be approved in `profile_builder/drafts/00-facts.md` and added to the claims guard.

## Quality (writing, 2026-10-04)

Lighthouse, mobile, production, 3 runs per page: `/writing` 99 · 100 · 100 · 100 (LCP 2.0 s); `/writing/hooks-as-guardrails` 99 · 100 · 100 · 100 (LCP 2.1–2.2 s); CLS 0.

Automated: 90 unit tests (incl. confidentiality guard over all content and `docs/`), 130 e2e tests locally (116 read-only against production).

### Adding an article

1. Run the editorial workflow (researcher → writer → editor → evaluator) or write `src/content/writing/<slug>.md` in plain Markdown (no JSX).
2. Add its entry (summary, key terms, key points, video outline) to `src/content/writing/index.ts`; keep the editorial notes in `docs/editorial/`.
3. `npm run check && npm run test:e2e`, then open a PR; merge only after the owner says "publish".

### Series complete (2026-10-04)

All 10 parts live. Lighthouse (mobile, production, 3 runs): `/writing` and `/writing/evaluating-agent-output` 99 · 100 · 100 · 100, LCP 2.0–2.1 s, CLS 0. 130 read-only e2e tests pass against production. Batch 2 used 39 agents (research, writing, editing, evaluation, revision, fixes).
