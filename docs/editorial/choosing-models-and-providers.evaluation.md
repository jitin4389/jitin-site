# Evaluation (round 1): Choosing models and providers

- **Article:** `src/content/writing/choosing-models-and-providers.md`
- **Sidecar:** `docs/editorial/choosing-models-and-providers.meta.json`
- **Evaluator:** independent, round 1, 2026-10-04
- **Docs checked live:** code.claude.com/docs/en/ model-config, sub-agents, llm-gateway, llm-gateway-connect, prompt-caching, costs, cli-reference, commands, amazon-bedrock, headless

## Verdict: PASS

There are no blocker or major issues, and every score is 4 or higher. Four minor fixes are listed below. The editor should apply them before publishing, but none of them stops the article.

## Scores

| Dimension       | Score | Note                                                                                                                                                                              |
| --------------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accuracy        | 4     | Every fact I checked matches the current docs. Two points need a caveat: `--bare` and `opusplan`.                                                                                 |
| Originality     | 5     | Original example (routing table, summariser and reviewer subagents, eval runner). None of the course's project, sequence or tools appear.                                         |
| Confidentiality | 5     | No blocklisted term appears in the article or the sidecar (all terms checked, case-insensitive). No client, person, vendor or product names.                                      |
| Claims          | 5     | The only client facts are "global hedge fund with ~$1B AUM" and "12+ sector forecasting models", both on the approved list. The production lessons give no counts or percentages. |
| Code            | 5     | All 12 blocks pass their checks. The runner also works end to end against a stub `claude`.                                                                                        |
| Clarity         | 4     | Follows the template, with 2,429 words of prose (inside the 1,500–2,500 range, near the top). The sidecar is valid JSON but has no `date` or `series` keys.                       |

## Facts verified against the docs

| Claim in the article                                                                                                                                                               | Result                                                                             |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Precedence: `/model` > `--model` > `ANTHROPIC_MODEL` > settings `model`                                                                                                            | Matches model-config                                                               |
| `opusplan` = Opus in plan mode, Sonnet in execution                                                                                                                                | Matches                                                                            |
| `/effort` and `--effort`                                                                                                                                                           | Match                                                                              |
| `fallbackModel` is an array; used when the model is overloaded or unavailable, never for auth or billing errors                                                                    | Matches                                                                            |
| `ANTHROPIC_DEFAULT_{OPUS,SONNET,HAIKU}_MODEL` pin the aliases; unpinned defaults can lag the newest release; one unpinned deployment moved to Opus and was billed at the Opus rate | Matches (model-config, plus the Bedrock warning about v2.1.207)                    |
| WebSearch is not available on Bedrock                                                                                                                                              | Matches (amazon-bedrock)                                                           |
| Subagent `model` accepts an alias, a full ID or `inherit`                                                                                                                          | Matches                                                                            |
| `CLAUDE_CODE_SUBAGENT_MODEL` does not change Explore and Plan unless `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1` is set                                                                   | Matches                                                                            |
| `/tasks` shows the model each subagent runs on                                                                                                                                     | Matches (v2.1.242+)                                                                |
| Each model has its own cache; pick model and effort at the start; subagents have their own cache                                                                                   | Matches prompt-caching                                                             |
| A gateway that strips `cache_control` markers still returns success, and every turn then bills as uncached                                                                         | Matches prompt-caching                                                             |
| "the gateway becomes infrastructure your organization operates"                                                                                                                    | Exact quote, llm-gateway                                                           |
| "doesn't support routing Claude Code to non-Claude models through any gateway"                                                                                                     | Exact quote, llm-gateway                                                           |
| A gateway credential bills per token to the credential owner, not to the subscription                                                                                              | Matches llm-gateway                                                                |
| `apiKeyHelper` prints only the credential; `"~/bin/get-gateway-key.sh"`                                                                                                            | Matches llm-gateway-connect                                                        |
| Do not put credentials in the project's `.claude/settings.json`                                                                                                                    | Matches (that page carries a Warning)                                              |
| `/status` shows an `Anthropic base URL` line and a credential line                                                                                                                 | Matches                                                                            |
| `/usage` has a `Prompt cache (main)` line; `/cost` is an alias for `/usage`                                                                                                        | Matches costs and commands                                                         |
| The cost figure is an estimate at list price                                                                                                                                       | Matches                                                                            |
| Sonnet for most coding, Opus for architecture and multi-step reasoning, `model: haiku` for simple subagents                                                                        | Matches the costs page ("Choose the right model")                                  |
| `--tools`, `--max-budget-usd`, `--no-session-persistence`, `--output-format json`                                                                                                  | Match cli-reference (the last three are print mode only, and the script uses `-p`) |
| JSON fields `result`, `is_error`, `total_cost_usd`, `modelUsage`                                                                                                                   | Match headless; the research notes confirm them from a live run                    |
| `-p` loads user `CLAUDE.md`, hooks and MCP servers; `--bare` skips them                                                                                                            | Matches headless                                                                   |

## Issues

### Minor 1: `--bare` needs an API key, and the article does not say so

- **Where:** Pitfalls, "Comparing models on easy cases, in a noisy set-up".
- **Problem:** The article suggests `--bare` for a leaner baseline. The headless docs say bare mode never reads OAuth or keychain credentials, so it needs `ANTHROPIC_API_KEY` or an `apiKeyHelper` passed through `--settings`. A reader on a subscription login who adds `--bare` to the runner will get failing runs, and every case will show "no JSON" or `is_error`.
- **Fix:** Add one clause: "bare mode does not use a subscription login, so it needs `ANTHROPIC_API_KEY` or an `apiKeyHelper`."

### Minor 2: `opusplan` switches models, which conflicts with the "switching is not free" rule

- **Where:** Decision 1 (the `opusplan` bullet) and the Step 1 routing table (the `opus`, or `opusplan` row).
- **Problem:** The prompt-caching docs say each plan-mode toggle under `opusplan` is a model switch and starts a fresh cache. The article recommends `opusplan` and, a few lines later, stresses that mid-session switches cost a full re-read. Readers are not told the two are linked.
- **Fix:** Add a short note to the `opusplan` bullet: "each switch in or out of plan mode is a model switch, so it starts a fresh cache".

### Minor 3: the sidecar has no `date` or `series` keys

- **Where:** `choosing-models-and-providers.meta.json`.
- **Problem:** The published sidecars (parts 1, 2, 4, 6 and 7) carry `date` and `series` (`{"name": "Agentic coding with Claude Code", "part": N, "of": 10}`). This one does not. The JSON is otherwise valid and complete.
- **Fix:** Add `"date": "<publish date>"` and `"series": {"name": "Agentic coding with Claude Code", "part": 9, "of": 10}`.

### Minor 4: the article's title differs from the series map, and one heading misleads

- **Where:** `docs/intent/writing-series.md` (series map, row 9) and the Step 3 heading.
- **Problem:** The series map lists Part 9 as "Local and open models: when and how", but the article's title is "Choosing models and providers: cloud, gateways and local models". The research brief flags this too. Separately, the Step 3 heading says "point the project at a gateway", while the body correctly says the configuration goes in the personal `~/.claude/settings.json`, not in the project.
- **Fix:** Update row 9 of the series map to the new title. Rename the Step 3 heading to "Step 3 (optional): route your own sessions through a gateway".

## Confidentiality and claims check

- I loaded the blocklist and ran a case-insensitive substring search over every line of the article and the sidecar. There were no hits.
- I compared the client facts with `profile_builder/drafts/00-facts.md`. Only approved wording is used. The production section's lessons on gateway, caching, eval and context management are written as patterns, with no numbers.
- No reference to the Udemy course: no workout tracker, no Clerk, Neon, Vercel, Ollama or qwen, and the order of topics is not the course's.

## Code-check log

The blocks were extracted to `/tmp/cmp-eval-r1/` with `check.py`.

| #   | Language                       | Lines | Check                                                                | Result                                                                  |
| --- | ------------------------------ | ----- | -------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 1   | json (`.claude/settings.json`) | 7     | `json.loads` / `python3 -m json.tool`                                | OK                                                                      |
| 2   | markdown (`summariser.md`)     | 7     | YAML frontmatter parse                                               | OK: name, description, tools, model                                     |
| 3   | markdown (`reviewer.md`)       | 7     | YAML frontmatter parse                                               | OK                                                                      |
| 4   | bash (routing check)           | 2     | `bash -n`                                                            | OK                                                                      |
| 5   | json (gateway settings)        | 8     | `json.loads`                                                         | OK                                                                      |
| 6   | python (`fixture/stats.py`)    | 7     | `py_compile`                                                         | OK                                                                      |
| 7   | python (`fixture/text.py`)     | 6     | `py_compile`                                                         | OK; `slugify('Hello, World!')` returns `hello-world`, as case 2 expects |
| 8   | json (`cases.jsonl`)           | 3     | per-line `json.loads`                                                | OK (JSONL, so `json.tool` on the whole block rejects it by design)      |
| 9   | json (`configs.json`)          | 4     | `python3 -m json.tool`                                               | OK                                                                      |
| 10  | python (`compare_configs.py`)  | 48    | `py_compile`, plus an end-to-end run against a stub `claude` on PATH | OK; it printed the Markdown table, 3/3 for both configs                 |
| 11  | bash (run command)             | 1     | `bash -n`                                                            | OK                                                                      |
| 12  | text (sample output)           | 4     | none                                                                 | n/a                                                                     |

I did not re-run the real `claude` calls in this round. The research notes record a live run on v2.1.289 for the routing check and the runner.
