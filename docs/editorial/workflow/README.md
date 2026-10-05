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

## minor-fixes.workflow.js

One fixer agent per article applies the evaluator's minor issues. Args: `{ "repo": "...", "items": [{ "slug": "...", "issues": [{ "location", "problem", "fix" }] }] }`. Pass `items` as a real JSON array, not a string.
