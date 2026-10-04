# Evaluation, round 1: Context engineering (CLAUDE.md, docs and the context window)

- **Article:** `src/content/writing/context-engineering-claude-md.md`
- **Sidecar:** `docs/editorial/context-engineering-claude-md.meta.json`
- **Evaluator:** independent, round 1, 2026-10-04
- **Claude Code version used for live checks:** 2.1.289

## Verdict: PASS

There are no blocker or major issues, and every score is 4 or higher. I checked every Claude Code fact against the current docs at code.claude.com. I also ran the worked example in a real Claude Code session, and it behaves exactly as the article says. Three minor fixes are listed below. They are optional polish for the editor.

## Scores

| Dimension       | Score | Notes                                                                                                                           |
| --------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------- |
| Accuracy        | 5     | Every fact matches the current docs. The example was also run live.                                                             |
| Originality     | 5     | The example (`reminders-service`) is original. None of the course's project, tools or sequence appear.                          |
| Confidentiality | 5     | No blocklisted term in the article or sidecar (0 hits, case-insensitive). No names of clients, people, vendors or products.     |
| Claims          | 5     | The client-work numbers are only ~$1B AUM, 12+ models and 15+ team, all from the approved facts file.                           |
| Code            | 5     | All 7 fenced blocks pass their syntax checks. The bash commands also ran successfully.                                          |
| Clarity         | 4     | The structure follows the template and the prose runs to about 2,050 words. The sidecar is missing `date` and `series` (minor). |

## Issues

| #   | Severity | Location                                         | Problem                                                                                                                                                                                                                                                  | Fix                                                                                                                                                                                                                                                     |
| --- | -------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | minor    | Sidecar `.meta.json`                             | The `Article` type in `src/content/writing/index.ts` requires `date` and has an optional `series` field. The sidecar has neither, so whoever wires it into `index.ts` has to fill them in.                                                               | Add `"date": "YYYY-MM-DD"` and `"series": {"name": "Agentic coding with Claude Code", "part": 1, "of": 10}`.                                                                                                                                            |
| 2   | minor    | Article line 168 ("Keep the stable part stable") | The cache argument for "no dates" is accurate but loosely linked to the advice. Claude Code reads CLAUDE.md once per session, so a date inside it does not break the cache mid-session. The stronger reason for leaving dates out is that they go stale. | Lead with staleness ("dates and sprint notes go stale and mislead the agent"). Then keep the caching point as a secondary reason, or drop it.                                                                                                           |
| 3   | minor    | Article line 156 (Step two)                      | The reader is never shown how to confirm that the path-scoped rule loads. The first step had a `/context` check; this one has none.                                                                                                                      | Add one sentence, e.g. "Create an empty `tests/test_smoke.py`, ask Claude to read it, and the rule appears as a loaded notice and in `/context`." Optionally also say that item 3 of the hierarchy ("The docs imported below") now covers only one doc. |

Note (no change required): `/doctor prompt-audit` needs Claude Code v2.1.283 or later, according to the docs. The article could add "(recent versions)" for readers on older builds.

## Accuracy check: claims verified against official docs

Sources: code.claude.com/docs/en/ pages `memory`, `context-window`, `how-claude-code-works`, `prompt-caching`, `sub-agents` and `costs`, plus the Claude Code changelog and `claude --help` (v2.1.289).

| Article claim (line)                                                                                                                                                                      | Verdict     | Source                                                                                                                    |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------- |
| Auto memory is on by default and can be toggled with `/memory` (14)                                                                                                                       | Correct     | memory: "Auto memory is on by default in local sessions… open `/memory`… toggle"                                          |
| CLAUDE.md is delivered as a message after the system prompt, with no enforcement (28)                                                                                                     | Correct     | memory: "delivered as a user message after the system prompt… no guarantee of strict compliance"                          |
| File locations: user, `./CLAUDE.md` or `./.claude/CLAUDE.md`, `CLAUDE.local.md` added to `.gitignore` by you, managed file, walk up the tree, concatenated, may pick one arbitrarily (30) | Correct     | memory: scope table, "concatenated… rather than overriding", "Claude may pick one arbitrarily"                            |
| Imports load at launch and do not save context (32, pitfall 2)                                                                                                                            | Correct     | memory: "Imports… don't reduce its context cost"                                                                          |
| Subfolder CLAUDE.md files load on demand; `paths:` rules load on read or edit; skills show only a description (34)                                                                        | Correct     | memory (Read/Write/Edit trigger); context-window (skill descriptions at startup)                                          |
| Keep each file under about 200 lines (36)                                                                                                                                                 | Correct     | memory: "target under 200 lines per CLAUDE.md file"                                                                       |
| Compaction clears older tool output first, then summarises; the root CLAUDE.md is re-read (38)                                                                                            | Correct     | how-claude-code-works and context-window "What survives compaction"                                                       |
| `@` paths inside code spans and blocks are skipped (135, pitfall 1)                                                                                                                       | Correct     | memory: "Import parsing skips Markdown code spans and fenced code blocks"                                                 |
| A "Compact instructions" section, and `/compact <focus>` (137)                                                                                                                            | Correct     | how-claude-code-works; costs example                                                                                      |
| Path-scoped rules are summarised away on compaction and reload on the next matching read (156)                                                                                            | Correct     | context-window: "compaction summarizes them away… drop the `paths:` frontmatter or move it to the project-root CLAUDE.md" |
| Request order is system prompt, then project context, then conversation; exact-prefix caching (168)                                                                                       | Correct     | prompt-caching layer table                                                                                                |
| A mid-session CLAUDE.md edit applies only after `/clear`, `/compact` or a restart (168, pitfall 3)                                                                                        | Correct     | prompt-caching "Editing CLAUDE.md mid-session"                                                                            |
| Sub-agents start with a fresh context; most load CLAUDE.md and get a delegation message, not the conversation (172)                                                                       | Correct     | sub-agents (Explore and Plan skip CLAUDE.md, hence "most")                                                                |
| Only the sub-agent's result returns to the main conversation (178)                                                                                                                        | Correct     | sub-agents: "their results return to your main conversation"                                                              |
| "Remember this" goes to auto memory; say "add this to CLAUDE.md" (pitfall 4)                                                                                                              | Correct     | memory, `/memory` section                                                                                                 |
| `/doctor prompt-audit` proposes edits and changes nothing until asked (pitfall 6)                                                                                                         | Correct     | memory "Audit your instruction files" (v2.1.283+)                                                                         |
| The `#` quick-memory shortcut has been removed (191)                                                                                                                                      | Correct     | changelog: "Removed # shortcut for quick memory entry"                                                                    |
| `/context` lists files under **Memory files** (125, checklist)                                                                                                                            | Correct     | memory, and confirmed live (see below)                                                                                    |
| `claude -p … --tools ""` disables all tools (130)                                                                                                                                         | Correct     | `claude --help`: `--tools` takes "" to disable all tools                                                                  |
| Further-reading URLs                                                                                                                                                                      | All resolve | All 6 pages fetched successfully                                                                                          |

## Live run of the worked example

I built the folder exactly as the article describes, using code blocks 2–4, in a scratch directory.

- `claude -p "Without reading any files: …" --tools ""` answered "only `store/` may talk to the database" and "the `fake_channel` fixture". This matches the article.
- `claude -p "/context"` listed under **Memory Files**: the project `CLAUDE.md`, `docs/architecture.md` and `docs/testing.md`. This confirms that the imported docs appear there, as the article says. It also listed the evaluator's own user `~/.claude/CLAUDE.md`, which is expected.

## Originality

- **Project:** an original appointment-reminders Python service, not a workout tracker.
- **Tools:** uv, ruff, mypy and pytest. Clerk, Neon, Ollama and qwen do not appear.
- **Order:** concept, three buckets, a working example and step two, then production patterns. This does not follow the course sequence. The course topics "context window" and "influence output with doc files" are only the topic map.

## Confidentiality and claims

- **Blocklist scan:** a script compared all 46 blocklist entries, case-insensitively, against every line of the article and the sidecar. Result: 0 hits in each file. No term is reproduced in this report.
- **Manual read:** no client name, person, data vendor, repo or internal code name. "Context packs" and "routing table" are generic descriptions.
- **Numbers about client work:** only "~$1B AUM", "12+ sector forecasting models" and "15+ person cross-functional team" (line 160). All three are in the approved facts file. There are no other counts or percentages.

## Code-check log

The blocks were extracted to a scratch directory as `block01`…`block07`.

| Block | Language                                                    | Check                                        | Result                             |
| ----- | ----------------------------------------------------------- | -------------------------------------------- | ---------------------------------- |
| 1     | text (directory tree)                                       | none needed                                  | OK                                 |
| 2     | markdown (`CLAUDE.md`)                                      | inspected; `@` imports sit outside backticks | OK; loaded live                    |
| 3     | markdown (`docs/architecture.md`)                           | inspected                                    | OK; loaded live                    |
| 4     | markdown (`docs/testing.md`)                                | inspected                                    | OK; loaded live                    |
| 5     | bash (`cd`; `claude`)                                       | `bash -n`                                    | OK                                 |
| 6     | bash (`claude -p … --tools ""`)                             | `bash -n` and live run                       | OK; correct answer                 |
| 7     | markdown with YAML frontmatter (`.claude/rules/testing.md`) | YAML parsed with `yaml.safe_load`            | OK: `{'paths': ['tests/**/*.py']}` |

## Format and clarity

- **Length:** about 2,050 words of prose without code (2,481 with code). This is within 1,500–2,500.
- **Template order:** concept, working example (with step two), production, pitfalls, checklist, further reading. The "In one minute" summary comes from the sidecar's `summary` field, which `index.ts` documents as that summary.
- **Format:** headings start at `##`; the `#` lines are only inside code blocks. No JSX, no import/export lines, no HTML.
- **Spelling:** British throughout (behaviour, organisation, summarised, maths). No US spellings found.
- **Junior readability:** the sidecar summary is jargon-free. Key terms define the context window, CLAUDE.md, imports, path-scoped rules and compaction.
- **Sidecar:** valid JSON (`python3 -m json.tool`). It has slug, title, description, tags, summary, keyTerms, keyPoints and videoOutline. It is missing `date` and `series` (issue 1).
