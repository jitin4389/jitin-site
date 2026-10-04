# Evaluation: sub-agents-delegation (round 1)

**Verdict: PASS.** There are no blocker or major issues, and every score is 4 or higher. Eight minor fixes are listed below. Most are one-sentence additions or wording changes. They are worth making before publishing, but none of them blocks it.

## Scores

| Dimension       | Score | Notes                                                                                                                                                                                                                                                                                                                    |
| --------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Accuracy        | 4     | Every Claude Code fact was checked against the current docs at code.claude.com. Almost all of them hold. Issues 1 to 5 are small gaps or over-generalisations, not wrong facts.                                                                                                                                          |
| Originality     | 5     | The course has a "Sub agents" module, but the example here is original: a pricing module with a deliberate `>` versus `>=` bug, plus investigator, test-writer and reviewer agents and a `SubagentStop` shape check. There is no workout app, Clerk, Neon or Ollama, and the article does not follow the course's order. |
| Confidentiality | 5     | A case-insensitive substring scan of the article and sidecar found none of the blocklist terms. There are no client, person, vendor, product or repository names.                                                                                                                                                        |
| Claims          | 5     | The only client facts are "a global hedge fund with around $1B in assets under management" and "12+ sector forecasting models". Both are approved. Budgets, specialists and the registry are described without any counts or percentages.                                                                                |
| Code            | 5     | All 10 fenced blocks pass their checks. The pytest seed passes, and the hook behaves correctly on sample events (log below).                                                                                                                                                                                             |
| Clarity         | 4     | Follows the template order: idea, working example, production, pitfalls, checklist, further reading. 2,263 words of prose, excluding code. British spelling, no JSX, no H1. Two small points: the sidecar has no `date` or `series` field (issue 7), and one sentence is unclear (issue 8).                              |

## Facts verified against the official docs

These pages were fetched as Markdown on 2026-10-04: sub-agents, hooks, agent-sdk/subagents, tools-reference, cli-reference, headless and permissions. All five further-reading links return HTTP 200.

- **What a non-fork sub-agent starts with.** Its own system prompt, the task message, CLAUDE.md files, a git status snapshot and any preloaded skills. Explore and Plan skip CLAUDE.md and git status. ✔
- **What the SDK docs say.** "The only content you pass from parent to subagent is the Agent tool's prompt string." The parent "may summarize" the report unless you ask for it verbatim. ✔
- **When to stay in the main conversation.** The docs list back-and-forth work, phases that share context and quick, targeted changes. ✔
- **Scopes and fields.** Sub-agents live in `.claude/agents/` and `~/.claude/agents/`. Fields use camelCase, and unknown fields are ignored silently. The `model` values `haiku`, `sonnet` and `inherit` are valid. ✔
- **Required fields.** The article says only `name` and `description` are required. A file with a name but no description is skipped, so this holds. ✔
- **Description budget.** Claude Code warns at startup when descriptions add up to more than 15,000 tokens. ✔
- **Restricting tools.** `disallowedTools: Bash(git push *)` removes the whole Bash tool. `skills` controls what is preloaded, not what the sub-agent can reach. The `Agent(type)` allowlist works only for an agent run with `claude --agent`. ✔
- **Frontmatter hooks need trust.** In a project agent they need workspace trust, and a `-p` session does not count as trusted. Settings-file hooks do not need this. ✔
- **The `SubagentStop` hook.** Its input includes `last_assistant_message`, `stop_hook_active` and `agent_type`, and the matcher filters on `agent_type`. Exit 2 stops the sub-agent from finishing, and its stderr becomes the next instruction. ✔
- **Internal agents.** Their `SubagentStop` events carry an empty `agent_type` when the session runs without `--agent`. A matcher that names agent types does not match them. ✔
- **Limits.** Nesting is capped at 3 layers and concurrency at 20 sub-agents by default, and `maxTurns` exists. ✔
- **`/agents`.** It now prints a reminder. Only v2.1.197 and earlier opened a wizard. ✔
- **Allowlist rules and permission modes.** `--permission-mode acceptEdits` is valid, and `Agent` is the tool name to put in `--allowedTools`. ✔

## Issues

All of these are **minor**.

1. **Matcher rationale, line 251.** The article says the anchors stop the hook catching "other agents with 'reviewer' in the name". But a plain matcher of `reviewer` (letters only) already matches exactly. Only matchers that contain other characters are treated as unanchored regular expressions. **Fix:** say the anchors keep the match exact if the pattern ever becomes a regular expression. Or use the plain `reviewer` and note that plain names match exactly.
2. **Forks are not mentioned, lines 11–20 and 307.** Fork mode is on by default in interactive sessions, and `/subtask` starts a fork. A fork inherits the whole conversation, so it has no input isolation. A reader who sees Claude fork will find the article's "it does not get the conversation" untrue for that case. **Fix:** add one sentence: "The exception is a fork (`/subtask`), which inherits the whole conversation and so gives up input isolation."
3. **`SubagentHandback` in auto mode, lines 204–247.** On v2.1.271 or later in auto mode, sub-agents deliver their report through the `SubagentHandback` tool. `last_assistant_message` then holds only the closing text, not the report. The hook would reject a correct report once. The example uses `acceptEdits`, so it still works as written. **Fix:** add a one-line caveat. In auto mode, check the report with a `PreToolUse` hook matched on `SubagentHandback` (`tool_input.message`).
4. **`--debug` claim, line 311.** For a file with no `name`, or with `---` not on line 1, Claude Code treats the file as documentation. The docs do not say this is logged. **Fix:** "`claude --debug` shows the reason for most skips, and `claude plugin validate .claude/agents` finds frontmatter that does not parse."
5. **Grep and Glob are off by default on macOS, Linux and WSL, lines 150 and 180.** The test-writer and reviewer list `Grep, Glob` together with `Bash`. In an interactive session those two tools are not granted, and Claude searches through Bash instead. The investigator is fine, because a sub-agent that lists them without `Bash` gets them back. The headless command is also fine, because naming them in `--allowedTools` restores them. Nothing breaks. **Fix (optional):** drop `Grep, Glob` from those two agents, or add a short note.
6. **Bash rule spacing, line 276.** `Bash(git diff*)` without a space also matches commands such as `git diff-index`. The docs recommend `Bash(git diff *)`, which still matches a bare `git diff`. **Fix:** use the spaced form for all four Bash rules. Related, optional: the docs recommend exec form (`args`) when a hook references `${CLAUDE_PROJECT_DIR}`. The quoted shell form used here works, though.
7. **Sidecar is missing `date` and `series`.** The `Article` type in `src/content/writing/index.ts` requires `date`. Every published sidecar also has `series`. **Fix:** add `"date"` and `"series": {"name": "Agentic coding with Claude Code", "part": 3, "of": 10}` at publication, as for the other parts.
8. **"Platform caps are a floor", line 297.** A cap is a ceiling, so this reads as a contradiction. **Fix:** "Platform caps are a safety net. The per-specialist budget was our decision…"

## Unverified claim (kept, low risk)

- Line 269 says `--allowedTools` "takes several values and will swallow a prompt placed after it". The docs do not state this. Their examples do put the prompt first, and the advice is harmless. Consider softening it to "put the prompt first, as the docs' examples do".

## Code-check log

Blocks were extracted to `/tmp/eval-subagents/`.

| #   | Lang                           | Check                                                                             | Result                                                                                                                    |
| --- | ------------------------------ | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| 0   | text (tree)                    | none needed                                                                       | n/a                                                                                                                       |
| 1   | python `src/pricing.py`        | `py_compile`                                                                      | ok                                                                                                                        |
| 2   | python `tests/test_pricing.py` | `py_compile`, then `pytest -q` with blocks 1 and 2 and an empty `src/__init__.py` | ok, 1 passed                                                                                                              |
| 3   | markdown investigator          | YAML frontmatter parse                                                            | ok (name, description, tools, model=haiku)                                                                                |
| 4   | markdown test-writer           | YAML frontmatter parse                                                            | ok (model=sonnet)                                                                                                         |
| 5   | markdown reviewer              | YAML frontmatter parse                                                            | ok (model=inherit)                                                                                                        |
| 6   | json settings                  | `python3 -m json.tool`                                                            | ok                                                                                                                        |
| 7   | bash hook                      | `bash -n`, plus behaviour tests                                                   | ok. Valid report gives exit 0. Missing headings give exit 2 with a stderr message. `stop_hook_active: true` gives exit 0. |
| 8   | markdown CLAUDE.md section     | none needed                                                                       | n/a                                                                                                                       |
| 9   | bash run command               | `bash -n`                                                                         | ok                                                                                                                        |

The sidecar `sub-agents-delegation.meta.json` is valid JSON.
