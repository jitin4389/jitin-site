# Evaluation: claude-code-in-ci (round 2)

**Verdict: PASS.** All seven round-1 issues are fixed. No blocker or major issues remain. Two minor wording points are listed below as optional polish.

## Scores

| Dimension       | Score | Notes                                                                                                                                                                                                                                                                                                                                                                      |
| --------------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accuracy        | 5     | Every Claude Code and action fact checked against the current docs (fetched 2026-10-04). The round-1 major issue is fixed: the review step now passes `github_token: ${{ github.token }}`, `id-token: write` is gone, and the text explains why the App token matters. Two small wording points remain (issues 1–2).                                                       |
| Originality     | 5     | The course's "GitHub Actions / automate issue fixing" lesson is only a topic overlap. This article uses its own angle: a checklist review behind a human approval gate, plus a nightly failing-test summary that never writes. No workout app, Clerk, Neon or Ollama.                                                                                                      |
| Confidentiality | 5     | Case-insensitive scan of the article and sidecar against every blocklist entry: zero matches. No client, person, vendor, product, code or repo names.                                                                                                                                                                                                                      |
| Claims          | 5     | The client appears only as "a global hedge fund with around $1B in assets under management" and "a cross-functional team". The round-1 count ("two copies") is now "duplicated copies". No other numbers about client work.                                                                                                                                                |
| Code            | 5     | All blocks parse. Both workflows pass `actionlint` with no findings. Every `run:` script passes `bash -n`. The inline JSON schema is valid. The `jq` filters and the new empty-file guard behave as described.                                                                                                                                                             |
| Clarity         | 5     | Follows the series template (idea, working example, production, pitfalls, checklist, further reading). 2,355 words of prose excluding code fences. British spelling, no JSX or import/export, headings start at `##`. "OIDC federation" is now defined. The sidecar is valid JSON with the same keys as the sibling sidecars, and its summary is plain enough for juniors. |

## Round-1 issues: status

| #   | Round-1 issue                                        | Status                                                                                                                    |
| --- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| 1   | Review job not truly read-only (App token can write) | Fixed: `github_token: ${{ github.token }}` added, `id-token: write` removed, explanation bullet and checklist item added. |
| 2   | "Read files and nothing else" overstated             | Fixed: `--disallowedTools "Bash,Edit,Write"` added to the nightly command.                                                |
| 3   | Testing note hid that `--bare` was not tested        | Fixed: "tested locally without `--bare`".                                                                                 |
| 4   | "Foundry"                                            | Fixed: "Microsoft Foundry".                                                                                               |
| 5   | Count about client work                              | Fixed: "duplicated copies".                                                                                               |
| 6   | Empty `summary.json` gave a blank summary            | Fixed: `[ -s summary.json ]` guard plus `                                                                                 |     | echo` for unreadable JSON. |
| 7   | "OIDC federation" undefined                          | Fixed: defined in line 254.                                                                                               |

## Facts verified against the official docs

Fetched 2026-10-04: code.claude.com `github-actions`, `github-actions-cloud-providers`, `headless`, `cli-reference`, `permission-modes`, `permissions`, `tools-reference`, `setup`, `agent-sdk/overview`, and the action repo's `docs/security.md`, `docs/faq.md`, `docs/usage.md`, `docs/configuration.md`. All six further-reading links return HTTP 200.

- **Interactive vs automation mode; no shell or GitHub API access for a plain-text prompt until tools are granted.** Matches `github-actions`.
- **Write access required on issue and PR events; bots rejected unless listed (`allowed_bots`).** Matches `security.md` and `github-actions`.
- **Base-branch restore of `.claude/`, `.mcp.json`, `CLAUDE.md` and others on PRs.** Matches `security.md`.
- **Passing `github_token` avoids the GitHub App; the App token has Contents, Pull requests and Issues read and write.** Matches `faq.md`, `security.md` and the `github_token` input row in `github-actions`.
- **`/install-github-app` installs the app and adds the secret; admin access needed.** Matches.
- **`structured_output` output from `--json-schema`.** Matches `usage.md`.
- **`--allowedTools` auto-approves; `--disallowedTools` with a bare name removes the tool; `--tools` restricts.** Matches `cli-reference`. Naming `Glob`/`Grep` in `--allowedTools` restores them on Linux (`tools-reference`), so the review example works.
- **`--max-turns`: no limit by default, exits with an error.** Matches. **`--max-budget-usd`: print mode only.** Matches.
- **`--bare` skips hooks, skills, plugins, MCP servers and `CLAUDE.md`; recommended for scripts; key must come from `ANTHROPIC_API_KEY`.** Matches `headless`.
- **Without `--bare`, `-p` runs project hooks and `.mcp.json` servers with no trust dialog.** Matches `headless`.
- **`dontAsk` denies anything that would prompt.** Matches `permission-modes`.
- **`permission_denials` in the result.** Documented for the final result message; the article's exit-0 observation is presented as the author's own test.
- **`show_full_output` off by default, on automatically with step debug logging.** Matches `security.md` (`ACTIONS_STEP_DEBUG`).
- **`pull_request_target` / `workflow_run` with base secrets; subfolder checkout plus `--add-dir`.** Matches `security.md`.
- **Bedrock, Google Cloud's Agent Platform and Microsoft Foundry use OIDC.** Matches `github-actions-cloud-providers`.
- **Cost controls (`--max-turns`, workflow timeouts, concurrency).** Match the "Manage costs" list.
- **Install command `curl -fsSL https://claude.ai/install.sh | bash -s stable`.** Matches `setup`.
- **Agent SDK in Python and TypeScript.** Matches.

## Issues (optional polish, none blocking)

1. **Minor. Accuracy. Line 270: "To take tools away, use `--disallowedTools`, `--tools` or `--permission-mode dontAsk`."** `dontAsk` does not remove tools. It denies calls that would prompt. File reads and read-only Bash commands still run without a prompt.
   - **Fix:** "To take tools away, use `--disallowedTools` or `--tools`. To deny anything not pre-approved, add `--permission-mode dontAsk`."
2. **Minor. Accuracy (say less). Line 248: "stop the run when it hits either limit. It then exits non-zero".** The CLI reference documents the error exit for `--max-turns` only. For `--max-budget-usd` it says only that the run stops. The workflow is correct either way, because of `|| true` and the `subtype` check.
   - **Fix:** "stop the run when it hits either limit. The run may exit non-zero, which is why…"

## Code-check log

The blocks were extracted to a scratch directory. `${{ }}` expressions were replaced with a placeholder before `bash -n`.

| Block                           | Lang                            | Check                                                                                                                   | Result                                                                            |
| ------------------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| 0 `.claude/review-checklist.md` | markdown                        | visual                                                                                                                  | OK                                                                                |
| 1 `ai-review.yml`               | yaml                            | `yaml.safe_load`                                                                                                        | OK                                                                                |
| 1                               | yaml                            | `actionlint`                                                                                                            | OK, no findings                                                                   |
| 1 inline `--json-schema`        | json                            | `shlex` split + `json.loads`                                                                                            | OK                                                                                |
| 1 `review` step 1 `run:`        | bash                            | `bash -n`                                                                                                               | OK                                                                                |
| 1 `publish` step 0 `run:`       | bash                            | `bash -n`                                                                                                               | OK                                                                                |
| 1 publish `jq` filter           | jq                              | two findings, one without `line`                                                                                        | OK: ``- `a.js:3` **1**: key`` and ``- `b.py` **2**: no test``                     |
| 1 publish `jq` filter           | jq                              | `{"findings":[]}`                                                                                                       | OK: "No checklist issues found."                                                  |
| 2 `nightly-test-summary.yml`    | yaml                            | `yaml.safe_load`                                                                                                        | OK                                                                                |
| 2                               | yaml                            | `actionlint`                                                                                                            | OK, no findings                                                                   |
| 2 all 4 `run:` scripts          | bash                            | `bash -n`                                                                                                               | OK                                                                                |
| 2 summary `jq` filter           | jq                              | `{"subtype":"success","result":"hi"}`                                                                                   | OK: "hi"                                                                          |
| 2 summary `jq` filter           | jq                              | `{"subtype":"error_max_budget_usd"}`                                                                                    | OK: "Summary unavailable: error_max_budget_usd"                                   |
| 2 summary guard                 | bash                            | empty file                                                                                                              | OK: "Summary unavailable: no result returned."                                    |
| 2 summary guard                 | bash                            | non-JSON file                                                                                                           | OK: jq fails, "Summary unavailable: unreadable result."                           |
| CLI flags                       | local `claude` 2.1.289 `--help` | `--bare`, `--json-schema`, `--max-budget-usd`, `--disallowedTools`, `--permission-mode`, `--add-dir`, `--tools` present | OK (`--max-turns` is not in `--help` output but is in the official CLI reference) |

Confidentiality scan: every blocklist entry was checked against each line of the article and the sidecar, case-insensitively. Zero matches.
