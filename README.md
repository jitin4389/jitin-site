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
```

## Quality (foundation, 2026-10-03)

Lighthouse, mobile, production (`https://jitin-site.vercel.app`), 3 runs:

| Performance | Accessibility | Best Practices | SEO | LCP       | TBT      | CLS |
| ----------- | ------------- | -------------- | --- | --------- | -------- | --- |
| 99          | 100           | 100            | 100 | 2.1–2.2 s | 10–30 ms | 0   |

Automated: 7 unit tests, 44 Playwright e2e tests (desktop + mobile, axe in both themes), passing locally and against production.
