# Evaluation (round 1): Evaluating agent output: from vibes to evidence

**Verdict: PASS.** No blockers and no major issues. Every score is 4 or higher. The minor items below are worth fixing in the editor pass, but none blocks publication.

Evaluated 2026-10-04 against the current official docs, fetched as raw Markdown on the same day:
code.claude.com `headless`, `cli-reference`, `plugin-evals`, `best-practices`, `permission-modes` and `setup`, plus platform.claude.com `test-and-evaluate/develop-tests` and `reduce-hallucinations`.

## Scores

| Dimension       | Score | Note                                                                                                                                                                         |
| --------------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accuracy        | 4     | All flags, output fields and bare-mode behaviour match the docs. Two small wording issues (grading-method order, plugin baseline).                                           |
| Originality     | 5     | The invoice fixture, cases and harness are original. Nothing mirrors the course's sequence, project or tools.                                                                |
| Confidentiality | 5     | Scanned for all 46 blocklist terms (case-insensitive) in the article and sidecar: no matches. No client, person, vendor, product or repo names.                              |
| Claims          | 4     | Only approved client facts are used (~$1B AUM, 12+ sector forecasting models). One soft quantifier ("most of one model's answers") is worth softening.                       |
| Code            | 4     | Every block parses. The fixture behaves as described. The runner passes an end-to-end smoke test with a stub `claude`. Two error paths crash instead of recording a failure. |
| Clarity         | 5     | Follows the series template. About 2,150 words of prose. British spelling. The sidecar is valid JSON with every key.                                                         |

## Facts verified

| Article claim                                                                                                                                                                      | Source                                  | Result                                           |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------------ |
| `--tools`, `--allowedTools`, `--permission-mode dontAsk`, `--max-turns`, `--max-budget-usd`, `--no-session-persistence`, `--json-schema`, `--append-system-prompt-file`, `--model` | cli-reference                           | Correct                                          |
| `dontAsk` denies anything that would otherwise prompt                                                                                                                              | permission-modes                        | Correct                                          |
| `--bare` skips hooks, `~/.claude`, `.mcp.json` and CLAUDE.md, and needs `ANTHROPIC_API_KEY`                                                                                        | headless, "Start faster with bare mode" | Correct                                          |
| `--json-schema` returns the verdict in `structured_output`                                                                                                                         | headless                                | Correct                                          |
| `stream-json` plus `--verbose`; top-level messages have `parent_tool_use_id: null`                                                                                                 | headless                                | Correct                                          |
| `result` message fields `subtype`, `is_error`, `result`, `total_cost_usd`                                                                                                          | headless / SDK                          | Correct; the stub run confirms the parsing logic |
| Best-practices quote ("looks done", "you become the verification loop")                                                                                                            | best-practices                          | Accurate paraphrase                              |
| Eval guidance: fastest method first, prefer volume, mirror real task distribution, avoid human grading                                                                             | develop-tests                           | Correct, but see issue 1 on order                |
| `claude plugin eval`: isolated sessions, three runs by default, no-plugin baseline                                                                                                 | plugin-evals                            | Mostly correct; see issue 2                      |
| `npm install -g @anthropic-ai/claude-code`                                                                                                                                         | setup                                   | Still documented                                 |
| All six Further reading links                                                                                                                                                      | live check                              | All return HTTP 200                              |

## Issues

1. **Minor, Accuracy: grading-method order.** The section "The idea", in the grading table. The article introduces the table with Anthropic's "choose the fastest, most reliable…" guidance but lists Code → Model → Human. The docs list Code → Human → LLM. The article's order is a sensible preference, but as written it reads as the docs' order. **Fix:** say "Anthropic lists three grading methods:" and keep the article's order, or add "my order of preference" before the table.
2. **Minor, Accuracy: plugin eval baseline.** The paragraph on `claude plugin eval` says "It also runs each case without your plugin". The docs say the no-plugin arm is decided per case: some cases run only one arm (history-file cases, cases with no plugin found, or `--ablation none`). **Fix:** "It can also run each case without your plugin…".
3. **Minor, Code: crash paths contradict the text.** In `run_evals.py`, `judge()` calls `json.loads(out.stdout)`, which raises if the judge prints nothing or prints non-JSON (for example on an auth error). In the same way, `run_agent()` raises when no result message arrives. Either error stops the whole suite instead of recording one failed case. That conflicts with "A missing verdict counts as a failure". **Fix:** wrap the parse in `try/except json.JSONDecodeError` and return `(False, "judge returned no JSON")`. Optionally, catch `RuntimeError` in `check_case` and record it as a failure.
4. **Minor, Claims: soft quantifier.** The production bullet "Use numeric tolerances" says the wrong operator "quietly broke most of one model's answers". This is not a number, but it is a size claim about the client work. **Fix:** "quietly broke one model's answers" says the same thing with less exposure.

## Code-check log

The blocks were extracted to `/tmp/eval-agent-output-r1/`.

| #   | Block                      | Check                                                                                                  | Result                                                                                                       |
| --- | -------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| 0   | `text` folder tree         | n/a                                                                                                    | n/a                                                                                                          |
| 1   | `invoice.py`               | `python3 -m py_compile`                                                                                | OK                                                                                                           |
| 2   | `test_invoice.py`          | `py_compile`, then run                                                                                 | OK. Buggy fixture fails (`AssertionError: 28.0`, exit 1). After the one-operator fix it prints `ok`, exit 0. |
| 3   | `cases.jsonl` (3 lines)    | `json.loads` per line                                                                                  | All 3 OK                                                                                                     |
| 4   | `run_evals.py` (178 lines) | `py_compile`                                                                                           | OK                                                                                                           |
| 4   | `run_evals.py`             | End-to-end with a stub `claude` that emits `stream-json` and a `structured_output` verdict, `--runs 2` | 6/6 PASS, exit 0. Tool parsing, hashing, `check_cmd`, regexes and the judge path all work.                   |
| 5   | bash usage                 | `bash -n`                                                                                              | OK                                                                                                           |
| 6   | GitHub Actions YAML        | `yaml.safe_load`                                                                                       | OK. Keys `name`, `on` (parsed as `True`, normal for YAML 1.1), `jobs`.                                       |

## Other checks

- **Format:** plain Markdown, headings start at `##`, no JSX and no HTML components. The only `import` lines are inside the Python fence.
- **Template:** idea, working example, production, pitfalls, checklist, further reading. This matches the live parts. The "In one minute" text comes from the sidecar `summary`. It is plain and junior-readable.
- **Sidecar:** valid JSON, with `slug`, `title`, `description`, `tags`, `summary`, `keyTerms`, `keyPoints` and `videoOutline`.
- **Cross-reference:** "Part 6 builds a minimal version of this hook" is confirmed. `hooks-as-guardrails.md` contains a `Stop` hook, `require_citations.py`.
