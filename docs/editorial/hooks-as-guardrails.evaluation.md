# Evaluation: hooks-as-guardrails (round 1)

**Verdict: PASS.** There are no blocker or major issues, and every score is 4 or higher. Three minor fixes are listed below. They are worth making before publishing, but they do not block it.

## Scores

| Dimension       | Score | Notes                                                                                                                                                                                                                                            |
| --------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Accuracy        | 4     | Checked every Claude Code fact against the current docs at code.claude.com. All of them hold except two over-generalised sentences (issues 1 and 2).                                                                                             |
| Originality     | 5     | The course outline has no hooks module. The example (a lexicon file, a `reports/` folder, a citation Stop hook) is original. There is no workout app, Clerk, Neon or Ollama.                                                                     |
| Confidentiality | 5     | None of the blocklist terms appear in the article or the sidecar (case-insensitive substring scan). No client, person, vendor, product or repository names.                                                                                      |
| Claims          | 5     | The only client facts are "global hedge fund with around $1B in assets under management" and "sector forecasting models", with no count. There are no other numbers about the client work.                                                       |
| Code            | 5     | All 6 fenced blocks pass the syntax checks. Both Python hooks also behave correctly when given sample events (log below).                                                                                                                        |
| Clarity         | 5     | Follows the template order: idea, working example, production, pitfalls, checklist, further reading. 2,329 words of prose, excluding code. British spelling. No JSX, no H1. The sidecar is valid JSON with the same keys as the sibling sidecar. |

## Facts verified against the official docs

Pages fetched on 2026-10-04: hooks, hooks-guide, permissions, permission-modes, settings and agent-sdk/hooks. All five further-reading links return HTTP 200.

- **Exit codes.** Exit 2 blocks. Exit 1 and other non-zero codes are non-blocking errors. The docs say "If your hook is meant to enforce a policy, use `exit 2`."
- **Which events can block.** The per-event table matches the docs for `PreToolUse`, `PostToolUse`, `UserPromptSubmit`, `Stop` and `SubagentStop`.
- **Deny beats permission modes.** A `PreToolUse` deny holds even in `bypassPermissions` mode, and an allow cannot loosen deny rules. Source: the hooks-guide sentence "tighten restrictions but not loosen them".
- **Sub-agents.** Settings hooks fire inside sub-agents, and the input carries `agent_id` and `agent_type`.
- **Stop hooks.** `stop_hook_active` and `last_assistant_message` are documented. The continuation cap exists (8 in a row).
- **Configuration form.** The `args` exec form and `${CLAUDE_PROJECT_DIR}` substitution are documented, and the docs prefer exec form when a hook uses a path placeholder. `Stop` has no matcher support.
- **Matchers and tool input.** `Write|Edit` is matched exactly. `tool_input.file_path` is always absolute for `Write` and `Edit`.
- **Timeouts.** A timed-out command hook on `PreToolUse` does not block. A timed-out Agent SDK callback does block.
- **JSON output.** Top-level `decision` on `PreToolUse` is deprecated in favour of `hookSpecificOutput.permissionDecision`. On exit 0, JSON preceded by text from a shell profile is ignored silently.
- **Configuration management.** `/hooks` is a read-only browser. Hooks merge across settings levels. `--settings '{"disableAllHooks": true}'` is the documented way to turn hooks off for one run.

## Issues

1. **Minor. Accuracy. Line 281, the trust prompt.** The article says: "In an interactive session Claude Code holds back a project's hooks until you accept the folder's trust prompt." The permissions docs ("What runs before you trust a folder") say that settings-file hooks _are_ used when you have only trusted a parent folder, with no prompt shown.
   - **Fix:** add "unless you have already trusted a parent folder", or simplify to "In non-interactive runs … there is no trust prompt, so a repository's committed hooks run."
2. **Minor. Accuracy. Line 277, "A field at the wrong level is silently ignored".** The docs do not say this in general. For the standard decision model, a parsed object that fails schema validation shows a `hook error` notice; it is not silent. The second half of the sentence is accurate: JSON preceded by stray profile output is ignored on exit 0.
   - **Fix:** say less, for example: "A field at the wrong level does not do what you expect, and JSON preceded by stray text from a shell profile is ignored."
3. **Minor. Code robustness. `block_banned_phrases.py`, line 147.** If `guarded_folder` is missing from `lexicon.json`, the default `""` resolves to the project root. The hook then quietly guards the whole project. That is the opposite of the "guard a folder, not the world" advice.
   - **Fix:** return 0 with a stderr note when the key is missing or empty, or show the key as required.

## Code-check log

The blocks were extracted to `/tmp/hooks-eval-r1/`.

| Block | Language                           | Check                   | Result |
| ----- | ---------------------------------- | ----------------------- | ------ |
| 1     | text (directory tree)              | none                    | n/a    |
| 2     | JSON (`lexicon.json`)              | `python3 -m json.tool`  | OK     |
| 3     | JSON (`settings.json`)             | `python3 -m json.tool`  | OK     |
| 4     | Python (`block_banned_phrases.py`) | `python3 -m py_compile` | OK     |
| 5     | Python (`require_citations.py`)    | `python3 -m py_compile` | OK     |
| 6     | bash (manual test)                 | `bash -n`               | OK     |

Functional run in a scratch project built from blocks 2–5:

- **The article's own test command (block 6):** prints the block message and `exit code: 2`, as the article says.
- **Clean text in `reports/`:** exit 0.
- **Banned word outside `reports/`:** exit 0.
- **Path traversal `src/../reports/a.md` with "risk-free":** exit 2. Path resolution works.
- **Mixed-case "Game-Changing":** exit 2.
- **Empty `tool_input`:** exit 0. Fails open, as documented in the article.
- **Stop hook, uncited "12%":** prints `{"decision": "block", ...}` and exits 0. It also flags "Port 8080", the false positive the article already admits.
- **Stop hook with a `[1]` citation:** exit 0, no output.
- **Stop hook with `stop_hook_active: true`:** exit 0, no output.
