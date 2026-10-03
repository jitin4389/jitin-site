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
