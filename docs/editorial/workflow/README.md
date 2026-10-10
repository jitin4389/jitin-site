# Editorial workflows

Reusable multi-agent workflows for the Writing section. Run them with Claude Code's Workflow tool using `scriptPath` and an `args` object. (`export const meta` must stay the first statement in each script.)

## editorial-team.workflow.js

Researcher → writer → editor → evaluator per article, with one revision loop when the evaluator returns REVISE. Writes the article to `src/content/writing/<slug>.md`, a sidecar to `docs/editorial/<slug>.meta.json`, and research and evaluation reports to `docs/editorial/`.

```json
{
  "repo": "/Users/<you>/projects/jitin-site",
  "seriesName": "Agentic coding with Claude Code",
  "courseOutline": ["topics to avoid mirroring"],
  "articles": [
    {
      "slug": "kebab-case-slug",
      "part": 1,
      "topic": "Title-ish topic",
      "docsFocus": "which official docs to research",
      "exampleIdea": "an original working example",
      "angle": "the article's point of view",
      "productionNotes": "anonymised lessons the writer may use"
    }
  ]
}
```

After it finishes: add `date` and `series` to each sidecar, register the article in `src/content/writing/index.ts`, run `npm run check && npm run test:e2e`, open a PR, and merge only after the owner says "publish".

## architecture-article.workflow.js

Same team and gates for a **standalone architecture article** (no series, no Claude Code tutorial). The researcher works from public sources (vendor engineering posts, docs, papers) and must fetch every page it cites; the example must run with plain `python3`; the evaluator fails anything that describes a specific project rather than a general pattern. First used for `learning-loop-for-ai-agents` (2026-10-10).

```json
{
  "repo": "/Users/<you>/projects/jitin-site",
  "articles": [
    {
      "slug": "kebab-case-slug",
      "topic": "Working title",
      "problemStatement": "the problem as a practitioner meets it",
      "principles": "the principles the article must cover, generalised",
      "sourcesFocus": "which public sources to research",
      "exampleIdea": "a small runnable example",
      "angle": "the article's point of view",
      "productionNotes": "anonymised, number-free lessons the writer may use"
    }
  ]
}
```

## revise-article.workflow.js

Revise a published article against a review brief: reviser → editor → evaluator, one fix loop. Args: `{ "repo", "slug", "brief" (markdown), "slidesManifest"? (path to the deck's JSON manifest), "wordRange"? [min, max] }`. With a manifest, every slide must appear exactly once at the start of its section and the prose must not repeat it. First used for the learning-loop article (2026-10-11).

## Slides

Article decks are generated: `node scripts/slides/build.mts <slug> --png` writes SVG masters to `public/writing/<slug>/` and PNG exports to `exports/slides/<slug>/` (git-ignored). One deck file per article under `scripts/slides/decks/`; tokens and primitives in `scripts/slides/lib.mts`. Rule: topic title, one-line takeaway, picture in the middle; a reader who sees only the slides and captions must still get the argument.

## minor-fixes.workflow.js

One fixer agent per article applies the evaluator's minor issues. Args: `{ "repo": "...", "items": [{ "slug": "...", "issues": [{ "location", "problem", "fix" }] }] }`. Pass `items` as a real JSON array, not a string.
