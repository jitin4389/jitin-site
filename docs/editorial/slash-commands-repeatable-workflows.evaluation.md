# Evaluation: slash-commands-repeatable-workflows (round 1)

**Verdict: PASS.** There are no blocker or major issues, and every score is 4 or higher. Three minor fixes are listed below. They are worth making before publishing, but they do not block it.

## Scores

| Dimension       | Score | Notes                                                                                                                                                                                                                                                                                                                                       |
| --------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accuracy        | 5     | Every Claude Code fact was checked against the current docs at code.claude.com (fetched 2026-10-04). All hold. One sentence adds a qualifier the docs do not use (issue 2).                                                                                                                                                                 |
| Originality     | 5     | The course covers custom and personal-vs-project commands as topics only. The examples (`/release-notes` from git history, a personal `/brief`) are original. There is no workout app, Clerk, Neon, Ollama, or git branching/merging walkthrough.                                                                                           |
| Confidentiality | 5     | Case-insensitive substring scan of the article and the sidecar against all blocklist entries: no matches. No client, person, vendor, product or repository names.                                                                                                                                                                           |
| Claims          | 5     | The only client facts are the hedge fund with around $1B AUM, a 15+ person team and 12+ sector forecasting models. All three are in the approved facts file. No other numbers about the client work.                                                                                                                                        |
| Code            | 5     | All 4 fenced blocks pass. Both command files have valid YAML frontmatter. The `!` shell lines pass `bash -n`, and they behave as the article describes in a throwaway git repo (log below).                                                                                                                                                 |
| Clarity         | 5     | Follows the series template: idea, working example, production, pitfalls, checklist, further reading. 2,051 words of prose, excluding code. British spelling throughout. No JSX, no H1, no import/export lines. The sidecar is valid JSON with the same keys as the sibling sidecars, and its `summary` supplies the "In one minute" block. |

## Facts verified against the official docs

Pages fetched: skills, commands, interactive-mode, claude-directory, plugins-reference, permissions and tools-reference. All six further-reading links return HTTP 200.

- **Commands merged into skills.** `.claude/commands/deploy.md` and `.claude/skills/deploy/SKILL.md` both create `/deploy` and "work the same way". The command file is "the older format and still works".
- **Locations and names.** Personal commands live in `~/.claude/commands/`. Plugin items are namespaced as `/plugin-name:name`. A subfolder becomes part of the name (`/frontend:component`).
- **Frontmatter.** These fields are documented: `description`, `argument-hint`, `arguments` (as a YAML list or a string), `allowed-tools`, `disallowed-tools` and `disable-model-invocation`. Unknown field names are ignored without an error. YAML that fails to parse still loads, with no fields set.
- **`allowed-tools`.** It pre-approves tools for the invoking turn only and clears on your next message. It does not restrict other tools. Deny and ask rules still override it. Workspace trust does not gate it. `allowManagedPermissionRulesOnly` lets an organisation switch these grants off.
- **Arguments.** `$0` is the first argument and `$1` the second. A missing indexed placeholder stays in the text literally. A missing named placeholder expands to an empty string.
- **`!` injection.** It runs before Claude sees the prompt. A failure aborts the whole invocation with `Shell command failed for pattern "..."`. Exit code 1 from `grep`, `git diff` and similar tools is carved out. `|| true` is the documented workaround. Injected commands do not prompt, so the docs recommend pre-approving them with `allowed-tools`.
- **`disable-model-invocation: true`.** It makes the command manual-only and keeps its description out of Claude's context.
- **`/reload-skills` and `/skills`.** `/reload-skills` re-scans skill and command directories. `/skills` lists the available skills.
- **Lifecycle.** The rendered content stays in context, and Claude Code does not re-read the file on later turns.

## Issues

1. **Minor. Consistency. Sidecar `keyPoints[5]`.** The sidecar says "Commands are followed most of the time". The research notes record that this wording was removed from the body, because the test showed a judgement call rather than a compliance rate. The sidecar was not updated to match.
   - **Fix:** reword to match the body, for example: "A command is a prompt, so the model still makes judgement calls; rules that must always hold belong in hooks."
2. **Minor. Accuracy (wording). Working example, after the `/release-notes` run.** The article says "in an interactive session you see `Shell command failed for pattern "..."`". The docs show this error with no interactive-only qualifier.
   - **Fix:** drop "in an interactive session", or write "Claude Code shows `Shell command failed for pattern "..."`".
3. **Minor. Suggestion (scope). `/release-notes` example.** `$since` is placed inside a `!` shell line, so whatever the caller types becomes part of a shell command. The `allowed-tools` rule and the manual-only setting limit the risk, but the article never says so.
   - **Fix (optional):** add one sentence to Pitfalls: "Arguments you place inside a `!` line become part of a shell command, so keep those commands narrow and pre-approve only exact patterns."

## Code-check log

The blocks were extracted to `/tmp/eval-slash/`.

| #   | Lang                        | Check                                                                     | Result                                                                                                 |
| --- | --------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| 0   | markdown (`/release-notes`) | YAML frontmatter `yaml.safe_load`                                         | OK. Keys: description, argument-hint, arguments (list), disable-model-invocation (true), allowed-tools |
| 0   | `!` line 1                  | `bash -n` on `git log --no-merges --pretty=format:'- %h %s' v0.1.0..HEAD` | OK (rc 0)                                                                                              |
| 0   | `!` line 2                  | `bash -n` on `git diff --stat v0.1.0..HEAD`                               | OK (rc 0)                                                                                              |
| 1   | text                        | invocation line only                                                      | n/a                                                                                                    |
| 2   | markdown (`/brief`)         | YAML frontmatter `yaml.safe_load`                                         | OK. Keys: description, argument-hint, disable-model-invocation (true)                                  |
| 3   | text                        | invocation line only                                                      | n/a                                                                                                    |

Live behaviour in a throwaway repo (one tag, one commit after it):

- `git log ... v0.1.0..HEAD` listed the commit (rc 0). `git diff --stat` printed a summary (rc 0).
- When `$since` is empty, the range becomes `..HEAD`. The log is empty with rc 0, so rule 1 ("stop if empty") is reachable, as the article claims.
- With a ref that does not exist (`v9.9.9..HEAD`), git exits with rc 128. This is non-zero and outside the exit-1 carveout, so the invocation aborts, as the article claims.
