# Evaluation: working-responsibly-with-ai (round 1)

**Verdict: PASS.** There are no blocker or major issues, and every score is 4 or higher. Five minor fixes are listed below. Make them before publishing if possible, but none of them blocks publishing.

## Scores

| Dimension       | Score | Notes                                                                                                                                                                                                                                                                                                                                                                                                    |
| --------------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accuracy        | 4     | Checked every Claude Code fact against the raw Markdown of the current docs at code.claude.com. Nearly all hold word for word. One sentence over-generalises how `ask` rules behave (issue 1), and one says the classifier reviews "each action" (issue 2).                                                                                                                                              |
| Originality     | 5     | No workout app, Clerk, Neon or Ollama. The kit (working agreement, settings file, counts-only check), the key-card analogy and the "download as spreadsheet" example are original. The topics "explaining to non-developers" and "onboarding a new hire" come from the agreed series map. They are written as original guidance, not as course-style role plays, and there is no interview-prep section. |
| Confidentiality | 5     | Case-insensitive substring scan of the article and the sidecar against every term in `.confidential-terms`: zero hits. No client, person, vendor, internal product or repository names. The placeholder names in the demo are generic and not on the blocklist.                                                                                                                                          |
| Claims          | 5     | The only client fact is "a global hedge fund with ~$1B AUM", which is approved. The physics background matches the facts file. No counts, percentages or speed-up claims about client work. The article says outright that it gives no speed-up number. The token-rotation story and the counts-only check come from the supplied production notes.                                                      |
| Code            | 4     | All 5 fenced blocks pass their checks. The demo reproduces the printed expected output exactly. One robustness gap: a file name that does not exist passes the check (issue 4).                                                                                                                                                                                                                          |
| Clarity         | 4     | Follows the template order: intro, idea, working example, production, pitfalls, checklist, further reading. 2,436 words of prose, excluding code, which is inside the range but near the top. British spelling, no JSX, no H1. The sidecar is valid JSON, but it lacks `date` and `series` (issue 5).                                                                                                    |

## Facts verified against the official docs

Pages fetched on 2026-10-04 as raw Markdown: security, permissions, permission-modes, sandboxing, settings, settings-reference, data-usage, checkpointing, best-practices. All six further-reading links return HTTP 200. The Anthropic consumer terms were also fetched to check the age rule.

- **Core quote.** "Permission rules are enforced by Claude Code, not by the model…" is from permissions, word for word.
- **Auto mode as the starting mode.** permission-modes: "With Claude Code v2.1.283 or later, auto mode is the built-in starting permission mode for interactive terminal and VS Code sessions." `Shift+Tab` cycles modes. "Auto mode reduces permission prompts but does not guarantee safety" is confirmed.
- **Classifier block list.** `curl | bash`, force push, production deploys and migrations, and "Printing a live credential or token into the transcript" are all in the default block list.
- **Boundaries stated in chat.** "Boundaries are not stored as rules… can be lost if context compaction removes the message… For a hard guarantee, add a deny rule" is confirmed.
- **Deny rules in every mode.** "Deny rules block in every mode, including `bypassPermissions`" is confirmed.
- **`disableBypassPermissionsMode`.** Its type is the string `"disable"`, it works from any scope, and Claude Code then rejects `--dangerously-skip-permissions`. Managed settings can't be overridden. All confirmed.
- **Read deny scope.** A `Read` deny also blocks Edit and Write on the same path. It does not stop a script or a command that reads files without naming them, and the docs point to the sandbox for that. Confirmed.
- **Trailing ` *`.** "A `*` at the end, with a space before it, also matches the bare command." `git -C . push` is not matched by `Bash(git push *)`. Both are confirmed in the bash-rule-limits table.
- **Workspace trust.** Project `allow` rules apply only after the trust dialog. "`deny` and `ask` rules aren't affected, since they only restrict." Confirmed.
- **`/permissions`.** It lists every rule and the settings file it comes from. Confirmed.
- **Sandbox.** It runs on macOS, Linux and WSL2, is off by default and is turned on with `/sandbox`. "There is no built-in credential deny list, so only the files and variables you list are restricted." Confirmed.
- **Checkpoints.** "Checkpointing does not track files modified by Bash commands", and "Not a replacement for version control". Confirmed.
- **Transcripts.** They are stored "locally in plaintext under `~/.claude/projects/` for 30 days by default". Prompts and outputs are sent over the network. Confirmed.
- **Approval fatigue.** "After the tenth approval you're clicking through rather than reviewing" is in best-practices.
- **Attribution.** The co-author trailer exists and can be hidden with `attribution`. This supports the "don't turn it off" advice.
- **Age rule.** The consumer terms say users must be "at least 18 years old or the minimum age required to consent… whichever is higher". Confirmed.

## Issues

1. **Minor. Accuracy. Lines 23 and 117, "ask rules prompt in every mode".** The docs say an `ask` rule is never _auto-approved_ in any mode. That does not mean every mode shows a prompt. In `dontAsk` mode, and wherever no prompt can be shown, the call is denied instead. Line 117 covers `claude -p`, but "prompt in every mode" is still too broad.
   - **Fix:** say "are never auto-approved in any mode. In auto mode they still prompt. Where nobody can answer, such as `dontAsk` or a `claude -p` run, the call is refused." For line 23: "An explicit `ask` rule is never auto-approved, even in auto or bypass mode."
2. **Minor. Accuracy. Line 22, "a separate classifier model reviews each action".** Actions that match your allow, ask or deny rules resolve at once, before the classifier sees them. The docs' wording is "reviews actions before they run".
   - **Fix:** "reviews actions before they run" (drop "each").
3. **Minor. Consistency. Agreement, line 55, "Push … _(enforced: `ask` rules)_".** Line 120 admits that `Bash(git push *)` can be written around, and says branch protection is the real gate. Labelling the push rule "enforced" by ask rules alone contradicts the article's own promise-versus-control test.
   - **Fix:** label it "_(enforced: branch protection; `ask` rules add a prompt)_", or similar.
4. **Minor. Code robustness. `check-confidential.sh`, line 135.** If a path that does not exist is passed (for example a typo in CI), `grep` fails, `|| true` hides the failure, `n` becomes `0`, and the script prints "Confidentiality check passed." A check that fails open on bad input conflicts with the article's "a stricter team should make a missing list fail" point.
   - **Fix:** add `[ -f "$f" ] || { echo "$f: not found"; exit 2; }` at the top of the loop. Optionally, also fail when no files are passed.
5. **Minor. Sidecar completeness. `working-responsibly-with-ai.meta.json`.** It lacks `date` and `series`. The live sidecars have both, and `Article` in `src/content/writing/index.ts` requires `date`. Two other unpublished drafts also lack them, so they may be added at integration time.
   - **Fix:** add `"date": "<publish date>"` and `"series": { "name": "Agentic coding with Claude Code", "part": 10, "of": 10 }`.

## Code-check log

Blocks extracted to `/tmp/wr-eval/code/`.

| #   | Lang     | File                              | Check                                                                                                                                                          | Result                                                                                       |
| --- | -------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| 1   | markdown | b1.md (working agreement)         | Read through. The `##` headings sit inside the fence, so they do not affect the page structure                                                                 | OK                                                                                           |
| 2   | json     | b2.json (`.claude/settings.json`) | `python3 -m json.tool`. Keys checked against settings-reference (`permissions.deny`, `permissions.ask`, `permissions.disableBypassPermissionsMode: "disable"`) | OK                                                                                           |
| 3   | bash     | b3.sh (`check-confidential.sh`)   | `bash -n`, then `shellcheck`                                                                                                                                   | OK, no warnings                                                                              |
| 4   | bash     | b4.sh (demo commands)             | `bash -n`                                                                                                                                                      | OK. shellcheck reports only SC2148 (no shebang), which is expected for a snippet of commands |
| 5   | text     | b5.txt (expected output)          | Compared with real output                                                                                                                                      | Matches exactly                                                                              |

Behaviour run (macOS, BSD grep), in a scratch folder with `scripts/check-confidential.sh` = block 3:

- Demo commands (block 4): printed `draft.md: 2 blocked term(s) found` and the failure line, exit 1. The output matches block 5 exactly. Case-insensitive matching works.
- Clean file: "Confidentiality check passed.", exit 0.
- Two occurrences differing only in case: 2 hits, exit 1.
- Missing file argument: grep error to stderr, then "Confidentiality check passed.", exit 0. This is issue 4.
- No blocklist terms appeared in any output. Counts only, as claimed.
