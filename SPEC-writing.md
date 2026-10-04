# Spec: writing

**Status: ✅ complete (2026-10-04): all 10 parts of the agentic coding series live.** Module `writing` from [CAPABILITY-MAP.md](CAPABILITY-MAP.md). Depends on `foundation`. Intent: [docs/intent/writing-series.md](docs/intent/writing-series.md).

Owner asked for minimal involvement: this spec and plan are recorded without a review gate. The single gate is the owner's "publish" before merging to production.

## Objective

A Writing section with an article index, article pages, tags and RSS, launching with parts 1, 4 and 6 of the agentic coding series. Articles are portable Markdown so they can be republished elsewhere.

**Acceptance criteria**

- [x] `/writing` lists published articles (newest first) with title, description, date, reading time, series part and tags; a "Writing" nav item and ⌘K entry
- [x] `/writing/[slug]` renders the article with an "In one minute" box and key points, series navigation (previous/next part), per-page metadata and canonical URL
- [x] `/writing/tags/[tag]` lists articles by tag
- [x] `/rss.xml` is a valid RSS 2.0 feed of published articles, linked from the page `<head>`
- [x] Article bodies are plain Markdown (`.md`, GFM tables allowed, no JSX), so the same file can go to Medium/LinkedIn/Discord unchanged
- [x] Each article's registry entry stores summary, key points and a video-script outline (for future YouTube lectures and Shorts)
- [x] Confidentiality guard covers all article and case-study content and the profile
- [x] Each launch article has a passing evaluator report in `docs/editorial/` (accuracy, originality, confidentiality, claims, runnable code)
- [x] Zero axe violations on writing pages in both themes; no horizontal scroll at 360 px; Lighthouse ≥ 95 / 100 / ≥ 95 / 100 on an article
- [x] Owner says "publish" before the merge to production

## Tech

- `@next/mdx` with `.md` support and `remark-gfm` (string plugin form for Turbopack). New dependency: `remark-gfm`.
- Registry `src/content/writing/index.ts` (slug, title, description, date, tags, series part, summary, keyPoints, videoOutline, readingMinutes computed from the file). Bodies in `src/content/writing/<slug>.md`.
- Code blocks styled without a highlighter for now (zero client JS); syntax highlighting can be added later.
- RSS via a route handler at `src/app/rss.xml/route.ts` (static).

## Editorial team (multi-agent workflow)

1. **Researcher** per article: Anthropic's official Claude Code docs for the topic (current behaviour, exact config shapes) and anonymised patterns from the owner's repos.
2. **Writer** per article: draft to the template.
3. **Editor** per article: voice, clarity, structure, length; plain-English "In one minute".
4. **Evaluator** per article: verdict PASS / REVISE with reasons on accuracy, originality versus the course outline, confidentiality, unapproved claims about client work, runnable examples (JSON/YAML parse, `bash -n`, `python -m py_compile`). One revision loop.

## Boundaries

- **Always:** original text only; cite official docs; anonymise client work (no names, numbers beyond `drafts/00-facts.md`).
- **Never:** reproduce or paraphrase the Udemy course's lectures, project or examples; publish to production without the owner's "publish".

## Testing

- Unit: registry integrity, confidentiality guard extended to `src/content/**`, reading-time helper, RSS builder.
- E2E: index, article, tag page, RSS content type and items, series nav, axe both themes, 360 px.
