# Evaluation: claude-code-in-ci (round 1)

**Verdict: REVISE.** One major accuracy issue. The article says the review job is read-only, but the action step gets a GitHub App token that can write (issue 1). Everything else is minor. The fix is small: one input line in the workflow, or a reworded sentence.

## Scores

| Dimension       | Score | Notes                                                                                                                                                                                                                                                                                                           |
| --------------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accuracy        | 3     | Most Claude Code facts match the current docs. One central safety claim (read-only review job) does not hold for the action step (issue 1). Small wording gaps in issues 2–4.                                                                                                                                   |
| Originality     | 5     | The course has a "GitHub Actions / automate issue fixing" lesson. This article uses a different angle: a checklist review with an approval gate, plus a nightly test summary that never writes. No workout app, Clerk, Neon or Ollama.                                                                          |
| Confidentiality | 5     | A case-insensitive scan of the article and the sidecar against the blocklist found no matches. No client, person, vendor, product or repository names.                                                                                                                                                          |
| Claims          | 4     | The client is described only as "a global hedge fund with around $1B in assets under management". One extra count about the client work appears (issue 5).                                                                                                                                                      |
| Code            | 4     | All three blocks parse. Both workflows pass `actionlint`, every `run:` script passes `bash -n`, and the inline JSON schema is valid. The `jq` filters give the expected output. One fallback branch can never run (issue 6).                                                                                    |
| Clarity         | 4     | Follows the series template: idea, working example, production, pitfalls, checklist, further reading. 2,193 words of prose, excluding code. British spelling. No JSX, no H1. The sidecar is valid JSON and has the same keys as the sibling sidecars. "OIDC federation" is used without a definition (issue 7). |

## Facts verified against the official docs

Pages fetched on 2026-10-04: code.claude.com `github-actions`, `headless`, `cli-reference`, `tools-reference` and `setup`, plus the action's `docs/security.md`, `docs/usage.md` and `docs/faq.md` on GitHub. All six further-reading links return HTTP 200.

- **Interactive and automation modes.** These match the docs. With no `prompt`, Claude waits for `@claude`. With a `prompt`, it runs on the triggering event. A plain-text prompt has no shell or GitHub API access until tools are granted.
- **Who can trigger runs.** These match. Write access is checked on issue and PR events, and bots are rejected unless listed in `allowed_bots`.
- **Config restored from the base branch.** This matches. The restored paths include `.claude/`, `.mcp.json` and `CLAUDE.md`, plus others.
- **`/install-github-app`.** This matches: it installs the app and adds the secret, and admin access is required.
- **`--json-schema` in the action.** This matches. The result comes back in the `structured_output` output, as a JSON string.
- **`--allowedTools` and `--disallowedTools`.** These match. `--allowedTools` auto-approves tools, and `--disallowedTools` with a bare tool name removes the tool. Note that `Glob` and `Grep` are absent by default on Linux, but naming them in `--allowedTools` brings them back, so the review example works.
- **`--max-turns`.** This matches: no limit by default, and the run exits with an error when the limit is reached. `--max-budget-usd` is print-mode only.
- **`--bare`.** This matches. It skips hooks, skills, plugins, MCP servers, auto memory and `CLAUDE.md`, and the docs recommend it for scripted calls. Without `--bare`, a `-p` run uses the project's hooks and `.mcp.json` and shows no trust dialog.
- **`dontAsk`.** This matches: it denies anything that would prompt.
- **`show_full_output`.** This matches. It is off by default and switches on automatically when step debug logging is enabled.
- **`pull_request_target` / `workflow_run`.** This matches the safe pattern in the security doc: check out PR code into a subfolder and pass it with `--add-dir`.
- **Install script.** `curl -fsSL https://claude.ai/install.sh | bash -s stable` is documented, and the launcher lives in `~/.local/bin`.
- **Cost controls.** `--max-turns`, workflow timeouts and concurrency groups all appear in the docs' "Manage costs" list.

## Issues

1. **Major. Accuracy. Lines 13, 96–99 and 167: "read-only" review job.** The review job sets `contents: read` and `pull-requests: read`, plus `id-token: write` "used by the action's GitHub App authentication". The action uses that OIDC permission to exchange for a Claude GitHub App installation token. The action's security doc lists that token as Contents, Pull requests and Issues **read and write**. The job's `permissions:` block limits only `GITHUB_TOKEN`, not the App token. So the step that runs the agent does hold a write-capable token. Writes are actually blocked by the tool restrictions (no Bash, no GitHub MCP tools), not by the job's permissions. That contradicts "If it only reads, it cannot write" and "The review job asks only to read", which are the article's central safety claims.
   - **Fix (preferred):** add `github_token: ${{ github.token }}` to the review step's `with:` block. The action then uses the job's read-only `GITHUB_TOKEN`; the action's FAQ documents this as the way to avoid the App. Then remove `id-token: write`, because API-key auth does not need it, and update the bullet at line 167.
   - **Fix (alternative):** keep App auth, but say plainly that the App token can write. Make clear that the tool limits are what stop the agent from writing in this step.
2. **Minor. Accuracy. Line 239: "Claude can read files and nothing else."** In bare mode Claude has Bash, and `dontAsk` still runs the built-in read-only command set without a prompt. In practice those commands only read, but the sentence overstates the restriction.
   - **Fix:** add `--disallowedTools "Bash"` (or `--tools "Read"`) to the nightly command, or reword to "can read files and run read-only shell commands, and nothing else".
3. **Minor. Accuracy (honesty). Line 44: "the headless command in the nightly job was tested locally".** The research notes (line 422) say it was tested **without** `--bare`, because the machine had no API key.
   - **Fix:** "the headless command was tested locally without `--bare`".
4. **Minor. Accuracy. Lines 246 and 288: "Foundry".** The docs call it "Microsoft Foundry".
   - **Fix:** use the full name.
5. **Minor. Claims. Line 252: "two copies of a shared server".** This is a count about the client work, and it is not in the approved-facts file.
   - **Fix:** "copies of a shared server" or "duplicated copies of a shared server".
6. **Minor. Code. Nightly workflow, line 227–228.** If `claude` writes nothing (for example, it crashes before any output), `summary.json` is empty. `jq` exits 0 on empty input and prints nothing, so the `|| echo "Summary unavailable: no result returned."` fallback never runs. The job summary is then a heading with no body. The build still fails correctly.
   - **Fix:** guard with `if [ -s summary.json ]; then jq … ; else echo "Summary unavailable: no result returned."; fi`. Or use `jq -e` and handle a null result.
7. **Minor. Clarity. Line 246: "OIDC federation".** This is used without a definition.
   - **Fix:** add a short gloss, e.g. "OIDC federation (the workflow swaps a short-lived GitHub identity token for cloud access, so no stored key is needed)".

## Code-check log

The blocks were extracted to a scratch directory.

| Block                           | Lang                          | Check                                       | Result                                                                |
| ------------------------------- | ----------------------------- | ------------------------------------------- | --------------------------------------------------------------------- |
| 0 `.claude/review-checklist.md` | markdown                      | visual                                      | OK                                                                    |
| 1 `ai-review.yml`               | yaml                          | `yaml.safe_load`                            | OK                                                                    |
| 1                               | yaml                          | `actionlint`                                | OK, no findings                                                       |
| 1                               | json (inline `--json-schema`) | `shlex` split + `json.loads`                | OK                                                                    |
| 1 `review` step 1 `run:`        | bash                          | `bash -n`                                   | OK                                                                    |
| 1 `publish` step 0 `run:`       | bash                          | `bash -n`                                   | OK                                                                    |
| 1 publish `jq` filter           | jq                            | sample with 2 findings (one without `line`) | OK: ``- `src/a.js:3` **1**: has key`` and ``- `b.py` **2**: no test`` |
| 1 publish `jq` filter           | jq                            | `{"findings":[]}`                           | OK: "No checklist issues found."                                      |
| 2 `nightly-test-summary.yml`    | yaml                          | `yaml.safe_load`                            | OK                                                                    |
| 2                               | yaml                          | `actionlint`                                | OK, no findings                                                       |
| 2 all 4 `run:` scripts          | bash                          | `bash -n`                                   | OK                                                                    |
| 2 summary `jq` filter           | jq                            | `{"subtype":"error_max_turns"}`             | OK: "Summary unavailable: error_max_turns"                            |
| 2 summary `jq` filter           | jq                            | empty file                                  | Prints nothing, exit 0; fallback not reached (issue 6)                |

Confidentiality scan: every blocklist term was checked against each line of the article and the sidecar, case-insensitively. There were zero matches.
