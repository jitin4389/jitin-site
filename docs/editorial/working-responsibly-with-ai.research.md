# Research brief: Part 10, "Working responsibly with AI, and explaining it to others"

Researcher notes for the writer. Checked on 2026-10-04 against the official docs and a live run of Claude Code v2.1.289 on macOS.

## 0. Read this first

- **Docs have moved.** Claude Code pages now live at `https://code.claude.com/docs/en/...`. Older `docs.claude.com` / `docs.anthropic.com` links redirect there. Cite the `code.claude.com` URLs.
- **Primary sources** (short tags used below):
  - [SEC] Security: https://code.claude.com/docs/en/security
  - [PERM] Configure permissions: https://code.claude.com/docs/en/permissions
  - [MODES] Choose a permission mode: https://code.claude.com/docs/en/permission-modes
  - [SBX] Sandboxing: https://code.claude.com/docs/en/sandboxing
  - [SETREF] Settings reference: https://code.claude.com/docs/en/settings-reference
  - [SET] Settings: https://code.claude.com/docs/en/settings
  - [HOOKS] Hooks reference: https://code.claude.com/docs/en/hooks
  - [MCP] MCP: https://code.claude.com/docs/en/mcp
  - [DATA] Data usage: https://code.claude.com/docs/en/data-usage
  - [CKPT] Checkpointing: https://code.claude.com/docs/en/checkpointing
  - [BP] Best practices: https://code.claude.com/docs/en/best-practices
  - [LEGAL] Legal and compliance: https://code.claude.com/docs/en/legal-and-compliance
  - [AUP] Anthropic Usage Policy (effective 15 September 2025): https://www.anthropic.com/legal/aup
  - [TERMS] Consumer Terms of Service (effective 8 October 2025): https://www.anthropic.com/legal/consumer-terms
- **The docs change often.** Many facts carry "v2.1.x or later" notes. In the article, describe behaviour and say "at the time of writing". Name a version only where the point needs it (the biggest one: auto mode is now the starting mode, section 1.2).
- **One WebFetch summary was wrong.** A summarised fetch of the settings reference showed `"disableBypassPermissionsMode": true`. The raw page says the value is the string `"disable"`. All key shapes below were checked against the raw Markdown of each page.
- **The example in section 3 was tested live** (section 3.5).

---

## 1. Fact base

### 1.1 The core idea: rules are enforced by the tool, not the model

- Quote worth using: "Permission rules are enforced by Claude Code, not by the model. Instructions in your prompt or `CLAUDE.md` shape what Claude tries to do, but they don't change what Claude Code allows." [PERM, "Manage permissions", note]
- To grant or revoke access, the docs name four levers: `/permissions`, permission rules, a permission mode, or a `PreToolUse` hook. [PERM]
- "You're responsible for reviewing proposed code and commands for safety before approval." [SEC, "User responsibility"]

This is the backbone for the article: a working agreement written in prose is a promise. Settings and checks are what make it stick.

### 1.2 Permission modes (current)

[MODES, "Available modes"]

| Mode (config value)             | What runs without asking                                                           | Docs' "best for"                                |
| ------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------- |
| `default` (labelled **Manual**) | Reads only                                                                         | Reviewing every action yourself, sensitive work |
| `acceptEdits`                   | Reads, file edits, common filesystem commands (`mkdir`, `touch`, `mv`, `cp`, etc.) | Iterating on code you're reviewing              |
| `plan`                          | Reads, plus classifier-approved commands when auto mode is available               | Exploring a codebase before changing it         |
| `auto`                          | Everything, with background safety checks                                          | Long tasks, reducing prompt fatigue             |
| `dontAsk`                       | Reads and pre-approved tools; anything that would prompt is denied                 | Locked-down CI and scripts                      |
| `bypassPermissions`             | Everything                                                                         | Isolated containers and VMs only                |

- **Recently changed (important):** "With Claude Code v2.1.283 or later, auto mode is the built-in starting permission mode for interactive terminal and VS Code sessions." On earlier versions it was the starting mode only on Pro, Max and Team plans; before that, Manual. [MODES; SEC; BP]
  - Many tutorials still say "Claude Code asks before every edit by default". That is no longer true for interactive sessions on current versions. `claude -p` and the Agent SDK still start in `default` in most setups. [MODES, "Which mode a session starts in"]
- **Manual is the new name for `default`.** The label and the `manual` alias need v2.1.200 or later. Config and hooks still use `default`. [MODES]
- **Switching:** `Shift+Tab` in the CLI, `--permission-mode <mode>` at launch, or `permissions.defaultMode` in a settings file. [MODES]
- **What auto mode is:** "A separate classifier model reviews actions before they run, blocking anything that escalates beyond your request, targets unrecognized infrastructure, or appears driven by hostile content Claude read." [MODES]
- **Docs' own warning:** "Auto mode reduces permission prompts but does not guarantee safety. Use it for tasks where you trust the general direction, not as a replacement for review on sensitive operations." [MODES]
- **Things auto mode blocks by default** (selected, all quoted or close paraphrase from [MODES, "What the classifier blocks by default"]):
  - downloading and executing code, like `curl | bash`
  - sending sensitive data to external endpoints
  - production deploys and migrations
  - force push; `git reset --hard` and similar commands that discard uncommitted work
  - "Merging a pull request no human has approved, approving Claude's own pull request, or disabling CI checks"
  - "Printing a live credential or token into the transcript or a file"
  - "Including sensitive details in content sent, uploaded, published, or written to other people or shared systems, when your own message didn't authorize those details", with "internal file paths, code names, live API response data ... and infrastructure identifiers" given as examples of sensitive details.

  These map neatly onto a working agreement. They show the tool's designers worry about the same things a team should.

- **Boundaries you say in chat are soft.** If you tell Claude "don't push", the classifier treats that as a block signal. But "Boundaries are not stored as rules", and "a boundary can be lost if context compaction removes the message that stated it. For a hard guarantee, add a deny rule instead." [MODES, "Boundaries you state in conversation"] This is a strong quote for the "write it down in settings" argument.
- **Fallback:** after 3 blocks in a row or 20 in total, auto mode pauses and Claude Code goes back to prompting. These numbers are not configurable. [MODES, "Repeated-block thresholds"]
- **Availability:** all plans; Team and Enterprise admins can turn it off. It needs a supported model (Opus 4.6+ / Sonnet 4.6+ on the Anthropic API; stricter on cloud providers). [MODES] Keep this general in the article: "needs a recent model; admins can switch it off".

**`bypassPermissions` / `--dangerously-skip-permissions`** [MODES, "Skip all checks"]

- "Only use this mode in isolated environments like containers, VMs, or dev containers without internet access."
- "`bypassPermissions` offers no protection against prompt injection or unintended actions."
- On Linux and macOS it refuses to start as root or under `sudo`.
- Deny rules still block in every mode, including bypass. Allow rules have no effect in bypass. [MODES]

**Actions no mode auto-approves**, not even bypass: explicit `ask` rules, MCP tools marked as needing user interaction, and `rm`/`rmdir` aimed at a critical path such as `/`, your home directory or your working directory. [MODES, "Actions no mode auto-approves"; "Critical paths"]

**Protected paths.** Writes to some paths are never auto-approved except in bypass mode. They include `.git`, `.claude` (with small exceptions), `.vscode`, `.idea`, `.husky`, `.devcontainer`, shell start-up files such as `.bashrc`/`.zshrc`, `.npmrc`, `.pre-commit-config.yaml`, `.mcp.json` and `.claude.json`. An allow rule such as `Edit(.claude/**)` does not pre-approve them. [MODES, "Protected paths"] Useful point: the agent can't quietly rewrite its own guard rails or your git hooks unless you are in bypass mode.

### 1.3 Permission rules

[PERM]

- Three lists under `permissions`: `allow`, `ask`, `deny`.
- "Rules are evaluated in order: deny, then ask, then allow. The first match in that order determines the outcome, and rule specificity doesn't change the order." An allow rule can't carve an exception out of a deny rule.
- Format: `Tool` or `Tool(specifier)`. Examples: `Bash(npm run build)`, `Read(./.env)`, `WebFetch(domain:example.com)`.
- Bash rules are aware of `&&`, `||`, `;`, `|` and so on, so `Bash(safe-cmd *)` does not approve `safe-cmd && other-cmd`.
- **Limits worth stating honestly** [PERM, "What a Bash rule doesn't match"]: `Bash(curl *)` in `deny` stops `curl https://example.com` but not `/usr/bin/curl ...` or `sh -c 'curl ...'`. The docs say a deny or ask rule "isn't a security boundary around the program". For enforcement that doesn't depend on the command text, use the sandbox.
- **Read deny rules and secrets** [SETREF, `permissions.deny`]: use them "for files that hold API keys, secrets, or environment values: Claude Code excludes matching files from file discovery and search results, denies reads of them, and blocks the Edit and Write tools on the matching paths." They do **not** apply to "a command that reads files without naming them, such as `grep -r pattern .`, or to arbitrary subprocesses". For OS-level enforcement, enable the sandbox.
- **Deprecated:** a `.claudeignore` file "has no effect"; move entries into `Read` deny rules. `permissions.deny` "replaces the deprecated `ignorePatterns` configuration". [PERM; SETREF]
- Docs' own example (exact):

  ```json
  {
    "permissions": {
      "deny": [
        "Read(./.env)",
        "Read(./.env.*)",
        "Read(./secrets/**)",
        "Read(./config/credentials.json)",
        "Bash(curl *)"
      ]
    }
  }
  ```

  [SETREF, `permissions.deny`]

- `/permissions` lists every rule and the settings file it comes from. [PERM] [SEC] recommends you "regularly audit your permission settings with `/permissions`".

**Locking modes off** [SETREF]

- `permissions.disableBypassPermissionsMode`: type is the string `"disable"`. Scope: any settings file, typically managed settings. "Claude Code then rejects the `--dangerously-skip-permissions` flag." A user can set it on themselves.
- `disableAutoMode` (also accepted as `permissions.disableAutoMode`): string `"disable"`. Removes auto mode from the `Shift+Tab` cycle; sessions that would start in auto start in `default`.
- `permissions.blockReadsOutsideWorkingDirectories`: Boolean. Makes file tools refuse reads outside the working directories in every mode. Needs v2.1.257+. A repository can turn it on for itself but can't lift yours.

### 1.4 Settings files and who wins

[SET, "Settings precedence"], highest first:

1. Managed settings (organisation; `managed-settings.json`, MDM, or server-managed)
2. Command-line arguments
3. `.claude/settings.local.json` (personal, this project)
4. `.claude/settings.json` (shared, committed)
5. `~/.claude/settings.json` (personal, all projects)

- "If a tool is denied at any level, no other level can allow it." [PERM, "Settings precedence"]
- **Workspace trust:** `permissions.allow` rules in a project's `.claude/settings.json` apply only after you accept the workspace trust dialog. `deny` and `ask` rules aren't gated, "since they only restrict". [PERM, "Project allow rules and workspace trust"] Good point for teams: committing _restrictions_ is safe and takes effect straight away.
- **Headless caveat:** `claude -p` and SDK sessions never show the trust dialog and treat the folder as trusted, so a repository's hooks and `.mcp.json` servers run. Before running `claude -p` on a repository you didn't write, the docs suggest `--setting-sources user`, `--bare`, or `--settings '{"disableAllHooks": true}'`. [PERM, "What runs before you trust a folder"; HOOKS, "Workspace trust"]

### 1.5 Sandboxing

[SBX]

- What it is: "a boundary that the operating system enforces around the shell commands Claude runs on your machine." It covers Bash, PowerShell and Monitor commands and the processes they start.
- **Off by default.** Turn on with `/sandbox` or `"sandbox": { "enabled": true }` in settings.
- Runs on macOS, Linux and WSL2. On native Windows, commands run unsandboxed; use WSL2. Built on the open-source `@anthropic-ai/sandbox-runtime` package.
- Defaults while on:
  - Writes: working directory, a per-user temp directory, added directories.
  - Reads: "Most of the machine, including credential files such as `~/.ssh` and `~/.aws/credentials`" unless you deny them.
  - Network: no direct route out; a local proxy checks each host against allowed domains, "which start empty".
  - Environment variables: inherited, "including any secrets in its environment".
- **Not covered by the sandbox:** built-in file and web tools (Read, Edit, Write, WebFetch, WebSearch follow permission rules instead), hooks, local MCP servers, and helper commands. "A `denyRead` entry doesn't stop the Read tool." So you need **both** permission rules and the sandbox. [SBX, "What runs outside the sandbox"; PERM, "How permissions interact with sandboxing": "Use both for defense-in-depth"]
- **Protect credentials** (exact key shape):

  ```json
  {
    "sandbox": {
      "enabled": true,
      "credentials": {
        "files": [
          { "path": "~/.aws/credentials", "mode": "deny" },
          { "path": "~/.ssh", "mode": "deny" }
        ],
        "envVars": [
          { "name": "GITHUB_TOKEN", "mode": "deny" },
          { "name": "NPM_TOKEN", "mode": "deny" }
        ]
      }
    }
  }
  ```

  "There is no built-in credential deny list, so only the files and variables you list are restricted." [SBX, "Protect credentials"]

- **Escape hatch:** Claude may retry a failed command unsandboxed (`dangerouslyDisableSandbox`). In Manual mode you get a prompt titled "Bash command (unsandboxed)". Set `"allowUnsandboxedCommands": false` under `sandbox` to turn the retry off ("Strict sandbox mode"). [SBX]
- **Limits, quoted:** "Sandboxing reduces risk but is not a complete isolation boundary." Allowing broad domains such as `github.com` "can create paths for data exfiltration". "Effective sandboxing requires both filesystem and network isolation." [SBX, "Limitations"]

### 1.6 Prompt injection, MCP and hooks

**Prompt injection** [SEC]

- Definition: "a technique where an attacker attempts to override or manipulate an AI assistant's instructions by inserting malicious text."
- Built-in safeguards listed: permission system, network command approval (`curl`, `wget` are not auto-approved), WebFetch runs a separate model over the page so Claude receives a summary rather than the raw page, the workspace trust dialog, command injection detection, fail-closed matching ("unmatched commands require approval by default"), and secure credential storage (macOS Keychain; a `0600` file on Linux).
- Docs' best practices for untrusted content (exact list): "Review suggested commands before approval"; "Avoid piping untrusted content directly to Claude"; "Verify proposed changes to critical files"; "Use virtual machines (VMs) to run scripts and make tool calls, especially when interacting with external web services"; "Report suspicious behavior with `/feedback`".
- Honest caveat: "no system is completely immune to all attacks."

**MCP** [MCP; SEC, "MCP security"]

- "Verify you trust each server before connecting it. Servers that fetch external content can expose you to prompt injection risk."
- Project servers live in `.mcp.json`. Interactive sessions ask before using them; `claude mcp reset-project-choices` resets those choices. `claude -p`, SDK and cloud sessions load them without asking.
- Reviewing `.mcp.json` "doesn't show every server a session can load": user-scope servers, claude.ai connectors and plugins add more.
- Anthropic reviews directory connectors against listing criteria "but does not security-audit or manage any MCP server."
- An MCP server author can force a prompt on every call with `_meta["anthropic/requiresUserInteraction"]: true`. It prompts even in `auto` and `bypassPermissions`. [MCP, "Require approval for a specific tool"]

**Hooks** [HOOKS, "Security considerations"]

- "Command hooks execute shell commands with your full user permissions. They can modify, delete, or access any files your user account can access. Review and test all hook commands before adding them to your configuration."
- Best practices (exact): validate and sanitise inputs; always quote shell variables (`"$VAR"`); block path traversal (check for `..`); use absolute paths (`${CLAUDE_PROJECT_DIR}`); skip sensitive files (`.env`, `.git/`, keys).
- A `PreToolUse` hook that exits with code 2 blocks the tool call even when an allow rule would let it through. Hook decisions don't bypass deny or ask rules. [PERM, "Extend permissions with hooks"] (Part 6 covers hooks in depth; link to it rather than repeat.)

### 1.7 Reviewing changes

- **Checkpoints** [CKPT]: every prompt that starts a turn creates a checkpoint. `/rewind` or `Esc` twice opens the menu: restore code and conversation, conversation only, or code only.
  - **Limits, important:** "Checkpointing does not track files modified by Bash commands" (e.g. `rm`, `mv`, `cp`). Most subagent edits are not restored either; "Use git to revert them." Checkpoints are an undo button, not version control.
- **Verification** [BP, "Give Claude a way to verify its work"]: give Claude a check that returns pass or fail (tests, build, linter). "Have Claude show evidence rather than asserting success." Use a second opinion: a fresh-context reviewer, because "the agent doing the work isn't the one grading it". Writer/Reviewer pattern with two sessions. [BP]
- **Plan first** [BP; MODES]: `plan` mode lets Claude read and explore but not edit until you approve a plan.
- `/security-review` runs "an on-demand security pass over the changes on your current branch". [SEC, "Related resources"]
- [BP] on approval fatigue: "After the tenth approval you're clicking through rather than reviewing." Fixes: allowlists for safe commands and the sandbox. Good line for the "prompts are not review" pitfall.

### 1.8 Disclosure of AI assistance

- Claude Code adds attribution to commits and PRs by default. Commit default: `Co-Authored-By: <name> <noreply@anthropic.com>`, where the name is the model in use (e.g. `Claude Sonnet 5`). PR descriptions get plain text. [SETREF, `attribution`, `attribution.commit`]
- Controlled by the `attribution` object (`commit`, `pr`, `sessionUrl`), or `false` to hide all (needs v2.1.281+). [SETREF]
- **Deprecated:** `includeCoAuthoredBy`, "Deprecated since v2.0.62, when `attribution` replaced it." [SETREF]
- Working-agreement suggestion (ours, not Anthropic's): don't turn attribution off in shared repos.

### 1.9 Data usage and privacy

[DATA] Keep this section general in the article and link the page; the details are plan-specific.

- **Training:**
  - Consumer (Free, Pro, Max): "We give you the choice to allow your data to be used to improve future Claude models." Training happens when the setting is on, including Claude Code use from those accounts.
  - Commercial (Team, Enterprise, API, third-party platforms): "Anthropic does not train generative models using code or prompts sent to Claude Code under commercial terms", unless the customer opts in (e.g. the Development Partner Program).
- **Retention:**
  - Consumer, training allowed: 5 years. Training not allowed: 30 days. Change at `claude.ai/settings/data-privacy-controls`.
  - Commercial: 30 days standard; zero data retention is available to qualified Enterprise accounts, enabled per organisation.
- **Local transcripts:** stored "locally in plaintext under `~/.claude/projects/` for 30 days by default". Change with `cleanupPeriodDays` (whole number, minimum 1; `0` fails validation). [DATA; SETREF] Article point: if a secret is pasted into a session, it is now in a plaintext file on disk as well as sent to the provider. Rotate it.
- **Feedback:** transcripts sent with `/feedback` (and `/bug`, `/share`) are retained for 5 years. Opt out with `DISABLE_FEEDBACK_COMMAND=1`. [DATA]
- **Telemetry opt-outs:** `DISABLE_TELEMETRY=1`, `DISABLE_ERROR_REPORTING=1`, or `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` for all non-essential traffic. Metrics "never include your code, prompts, or file paths". These are off by default on Bedrock, Google Cloud and Foundry. [DATA]
- **In transit:** TLS 1.2+. [DATA]

### 1.10 Usage policy and age requirements

- Claude Code use is subject to the Anthropic Usage Policy, plus the Consumer Terms (Free, Pro, Max) or Commercial Terms (Team, Enterprise, API). [LEGAL]
- **Usage Policy structure** [AUP]: Universal Usage Standards (apply to everyone), High-Risk Use Case Requirements, and Additional Use Case Guidelines (consumer chatbots, products serving minors, agentic use, MCP servers).
  - Agentic use: "Agentic use cases must still comply with the Usage Policy." Anthropic links a help article with examples: https://support.claude.com/en/articles/12005017-using-agents-according-to-our-usage-policy (not read in detail; cite only as a pointer).
  - High-risk cases (legal, healthcare, insurance, finance, employment and housing, academic testing, media/journalistic content) need **human-in-the-loop** review by "a qualified professional" before dissemination, and **disclosure**: "you must disclose to them that you are using AI to help produce your advice, decisions, or recommendations." This applies to consumer-facing outputs, not ordinary coding. Use it as a principle, not as a claim that coding needs it.
  - External-facing AI agents and chatbots must disclose "that they are interacting with AI rather than a human".
- **Age:** "You must be at least 18 years old or the minimum age required to consent to use the Services in your location, whichever is higher." [TERMS, section 2, "Minimum age"]
  - Products that let minors interact with Anthropic models must follow a separate help-centre guideline: https://support.anthropic.com/en/articles/9307344-responsible-use-of-anthropic-s-models-guidelines-for-organizations-serving-minors [AUP]
  - Article guidance (matches production note 6): for under-18 audiences, keep teaching tool-agnostic and check each provider's own age rules. Don't say anything about other providers' ages; we haven't checked them.

### 1.11 Things to avoid saying

- Don't say "Claude Code asks before every change by default". Current interactive default is auto mode (v2.1.283+).
- Don't present deny rules as a security boundary. The docs explicitly say they aren't for Bash, and Read rules don't cover subprocesses.
- Don't say checkpoints undo everything. Bash changes aren't tracked.
- Don't say the sandbox protects against MCP servers or hooks. They run outside it.
- Don't use `.claudeignore`, `ignorePatterns` or `includeCoAuthoredBy` in examples.
- Don't quote plan-specific retention numbers without the plan they apply to.

---

## 2. Production notes the writer may use (as supplied; do not extend)

1. Every public piece of content on my own site passes an automated confidentiality check against a private, git-ignored blocklist of names, and a claims check that only allows numbers I have approved. Failures report counts, never the terms.
2. Nothing goes live without a single human "publish", even when a team of agents researched, wrote, edited and evaluated it.
3. Client work is described as anonymised patterns, never names or numbers beyond what is approved.
4. Secrets live in the deployment platform's encrypted settings, never in the repo or chat. When a token was accidentally printed in a session, the response was to rotate it.
5. Before teaching AI to anyone, I taught physics and led academic teams. The same rule applies: explain the mental model first, then the tool.
6. For audiences under 18, keep material tool-agnostic and check each provider's age requirements.

Approved public facts (from the facts file) that fit this part, if needed: work for "a global hedge fund with ~$1B AUM"; "15+ person cross-functional team" (directional leadership, not direct reports); former Head of Physics Department. Use no other numbers about client work.

How the notes line up with the docs:

| Note                                  | Doc support                                                                                                                                                                                                                   |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1, blocklist that reports counts only | `Read` deny keeps the blocklist file out of Claude's context; a script (subprocess) can still read it [SETREF, `permissions.deny`]. Auto mode also blocks sending "internal file paths, code names" to shared systems [MODES] |
| 2, single human publish               | Auto mode blocks "Merging a pull request no human has approved, approving Claude's own pull request" [MODES]; `ask` rules prompt in every mode [MODES]                                                                        |
| 4, secrets and rotation               | Auto mode blocks "Printing a live credential or token into the transcript" [MODES]; transcripts are kept in plaintext for 30 days by default [DATA]; sandbox `credentials` block [SBX]                                        |
| 6, under-18 audiences                 | Consumer Terms minimum age 18 or local age of consent, whichever is higher [TERMS]; AUP minors guideline [AUP]                                                                                                                |

---

## 3. Proposed working example

### 3.1 Shape

Three small, original pieces, all tool-light so a reader can copy them the same day:

1. `AI-WORKING-AGREEMENT.md`: a one-page team agreement committed at the repo root.
2. `.claude/settings.json`: the part of the agreement that Claude Code can enforce.
3. `scripts/check-confidential.sh`: a confidentiality check that fails on blocklisted terms and prints counts only.

Then a one-page "explain it" section for a non-developer and for a new hire.

The design point for the article: **the agreement says what we promise; the settings and the check make some of those promises impossible to forget.** Each line in the agreement is labelled _enforced_ or _by review_, so nobody mistakes a promise for a control.

### 3.2 `AI-WORKING-AGREEMENT.md` (draft for the writer)

```markdown
# How we work with AI coding agents

This agreement covers any AI coding agent used in this repository.
We review it every quarter. Last reviewed: <date>.

## 1. What the agent may do

- Read code in this repository and run our tests, linters and build. _(by review)_
- Propose and make changes on a branch, never directly on `main`. _(enforced by branch protection)_
- Draft commit messages, PR descriptions and docs. _(by review)_

## 2. What the agent may not do

- Read secrets: `.env`, `.env.*`, `secrets/`. _(enforced: `.claude/settings.json` deny rules)_
- Run in bypass-permissions mode on a laptop. _(enforced: `disableBypassPermissionsMode`)_
- Push, publish a package, deploy, or run a migration without a person approving that step. _(enforced: `ask` rules; deploys need a human in CI)_
- Merge its own pull request. _(enforced by branch protection: one human approval)_

## 3. Review gates

- Every change is reviewed by a person who could explain it to a colleague.
- The agent shows evidence: the test command and its output, not "done".
- Risky changes (auth, payments, data deletion, infrastructure) get a second reviewer.
- "I approved the prompt" is not review. Read the diff.

## 4. Secrets

- Secrets live in the deployment platform's encrypted settings. Never in the repo, never in chat.
- If a secret appears in a session, a log or a commit: rotate it first, then clean up.
  Session transcripts are stored on disk, so deleting the message is not enough.

## 5. Confidentiality

- Client and partner names live in a private, git-ignored blocklist (`.confidential-terms`).
- The agent may not open that file. _(enforced: deny rule)_
- `scripts/check-confidential.sh` runs before merge. It fails on any match and prints counts, never the terms.
- Describe client work as anonymised patterns. Use only numbers on the approved list.

## 6. Disclosure

- Keep the agent's co-author line on commits. Do not turn attribution off.
- Say in the PR description when an agent wrote most of a change.
- Anything shown to customers or the public is reviewed and published by a named person.

## 7. When something goes wrong

- Stop the session. Rotate anything that leaked. Write a short note on what happened
  and which rule (or missing rule) would have caught it. Then update this file.
```

Notes for the writer:

- Section 2's "enforced" claims are true only together with the settings in 3.3 and with branch protection configured in the git host. Say so.
- Keep the length. One page is the point.

### 3.3 `.claude/settings.json` (verified shapes)

```json
{
  "permissions": {
    "disableBypassPermissionsMode": "disable",
    "deny": [
      "Read(./.env)",
      "Read(./.env.*)",
      "Read(./secrets/**)",
      "Read(./.confidential-terms)",
      "Edit(./.confidential-terms)"
    ],
    "ask": ["Bash(git push *)", "Bash(npm publish *)"]
  }
}
```

Why each line, with sources:

- `disableBypassPermissionsMode: "disable"`: string value, any scope [SETREF]. Works from a committed project file; managed settings are stronger.
- `Read(...)` denies: hide secrets and the blocklist from file discovery and block reads and edits [SETREF, `permissions.deny`]. A `Read` deny also blocks Edit and Write on that path [PERM]. The explicit `Edit` rule is belt and braces.
- `ask` rules: an explicit ask rule is one of the "actions no mode auto-approves", so it prompts even in auto mode [MODES]. In `claude -p` there is nobody to ask, so the call is denied (observed, 3.5).
- Deny and ask rules in a committed project file apply without the workspace-trust step [PERM]. Good for teams.
- Optional addition for readers on macOS, Linux or WSL2: the `sandbox.credentials` block from section 1.5.

Honest limits to print next to it:

- `Bash(git push *)` doesn't catch `git -C . push` [PERM, "What a Bash rule doesn't match"]. Branch protection on the git host is the real gate.
- Read deny rules don't stop a script from reading a file. That is _why_ the check script can still read the blocklist, and also why the script must never print terms.
- Don't set `defaultMode` to `auto` or `bypassPermissions` in a project file; Claude Code ignores those values there [MODES].

### 3.4 `scripts/check-confidential.sh`

```bash
#!/usr/bin/env bash
# Fails if any term from the private blocklist appears in the given files.
# Prints counts only, never the terms themselves.
set -euo pipefail
terms=".confidential-terms"
[ -f "$terms" ] || { echo "No blocklist found; skipping."; exit 0; }
hits=0
for f in "$@"; do
  n=$(grep -v '^[[:space:]]*\(#\|$\)' "$terms" | grep -o -i -F -f - "$f" | wc -l | tr -d ' ' || true)
  if [ "$n" -gt 0 ]; then
    echo "$f: $n blocked term(s) found"
    hits=$((hits + n))
  fi
done
if [ "$hits" -gt 0 ]; then
  echo "Confidentiality check failed: $hits hit(s). Terms are not shown."
  exit 1
fi
echo "Confidentiality check passed."
```

- Blocklist format: one term per line; blank lines and `#` comments ignored; case-insensitive fixed-string match.
- Add `.confidential-terms` and `.env` to `.gitignore`.
- In CI the blocklist file won't exist (it is git-ignored), so the script skips. To run it in CI, store the list as an encrypted CI secret and write it to the file at job start. Suggest this, don't over-specify.
- Design choice to call out: the "skip if missing" line is a convenience. A stricter team should make a missing list fail.

### 3.5 Live verification (2026-10-04, Claude Code v2.1.289, macOS)

A throwaway repo in a scratch folder with the files above, a dummy `.env` and a dummy two-term blocklist.

| Test                                                                            | Result                                                                                                                                                                                                                                    |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Script on a clean file                                                          | `Confidentiality check passed.` exit 0                                                                                                                                                                                                    |
| Script on a file with two blocked terms                                         | `content/bad.md: 2 blocked term(s) found` / `Confidentiality check failed: 2 hit(s). Terms are not shown.` exit 1                                                                                                                         |
| `claude -p` asked to Read `.env`                                                | Blocked: "File is in a directory that is denied by your permission settings."                                                                                                                                                             |
| `claude -p` asked to Read `.confidential-terms`                                 | Blocked with the same message                                                                                                                                                                                                             |
| `claude -p` asked to run the check script (allowed via `--allowedTools`)        | Ran; exit 1; counts only. Confirms a subprocess can read the blocklist while Claude's file tools can't                                                                                                                                    |
| `claude -p "... git push origin main"`                                          | Not run; permission denied (ask rule, no one to ask in `-p`)                                                                                                                                                                              |
| `claude -p ... --dangerously-skip-permissions` with the project setting present | Bypass did not take effect: a `touch` command still needed approval and the file was not created. No hard error surfaced in the `-p` output, so describe it as "bypass is refused / doesn't take effect", not as a specific error message |

### 3.6 Explaining agentic coding (one page)

Follow production note 5: mental model first, then the tool.

**The mental model (one analogy for both audiences).**
An AI coding agent is like a very fast, very well-read new colleague who has never been inside your building.

- They can read any document you hand them and work tirelessly, but they only know what is in front of them today (the _context_).
- You decide which rooms their key card opens (_permissions_).
- Some jobs always need a supervisor's signature, whoever does them (_ask rules, review gates_).
- The building has walls they can't walk through, whatever they are told (_the sandbox, deny rules_).
- They can be talked into things by a convincing note left on a desk (_prompt injection_). That is why the key card matters more than the instructions.
- You sign off the finished work. Their name goes on it too (_attribution_).

**For a non-developer (manager, client, family member).** Keep it to three sentences and one before/after.

- "It writes and changes software the way a junior engineer would, by reading our code and running our tests. It is fast, but it can be confidently wrong, so a person checks every change before it reaches customers. It can only touch what we have allowed it to touch."
- Before/after (original, generic): _Before:_ adding a "download as spreadsheet" button to a report page took a developer an afternoon of finding the right files, writing code and testing by hand. _After:_ the developer describes the outcome, the agent finds the files, proposes a plan, writes the code and the tests, runs them and shows the results. The developer reads the change, asks for one fix, and approves it. The human time moves from typing to deciding and checking.
- Do not attach a speed-up number. There is no measured evidence for one (and the facts file forbids speed-up claims).

**For a new hire (developer joining the team).** One page they read on day one:

1. Read `AI-WORKING-AGREEMENT.md` and `CLAUDE.md`.
2. Run `/permissions` once to see what the agent may and may not do here, and where each rule comes from.
3. Know your mode. At the time of writing the CLI starts in auto mode; switch with `Shift+Tab`. Use Manual or plan mode for unfamiliar or sensitive code.
4. Ask for evidence. A change isn't done until you have seen the test output.
5. Know your undo buttons: `/rewind` for Claude's file edits; git for everything else (Bash changes aren't in checkpoints).
6. If a secret shows up anywhere, tell someone and rotate it. Don't just delete the message.
7. Your name is on the PR. If you can't explain the change, it isn't ready.

**For under-18 audiences** (one line in the article, linking forward to Track B): teach the mental model without a specific tool, and check each provider's age terms. Anthropic's consumer terms require users to be at least 18, or the local age of consent if higher.

---

## 4. Originality check against the course outline

- The course's last module was role plays (responsible AI, explaining to non-developers, onboarding a new hire, interview prep). This part covers similar _topics_ but not that format: no scripted role plays, no interview prep.
- The worked artefacts (a committed working agreement, enforced settings, a counts-only confidentiality check, a key-card analogy, a spreadsheet-button before/after) are original. No workout tracker, no Clerk, Neon, Ollama or qwen.

## 5. Open questions for the writer or editor

1. Should the article show the `sandbox.credentials` block, or only link it? It is useful but platform-dependent (not native Windows).
2. Part 6 (hooks) is live. Link to it for "turn the check script into a PreToolUse hook" rather than adding a hook here.
3. The help article on agentic use under the Usage Policy was not read in full. Cite it as a pointer only, or ask the researcher to read it if the writer wants examples.

---

## Editor's notes (2026-10-04)

- **Hook:** opening line now leads with the reader's own policy ("Your team's responsible AI policy is probably a paragraph") instead of "Most teams I talk to".
- **Headings:** "The idea" became "The idea: promises and controls", matching the style of Parts 1 and 6. Template sections are present and in order: intro, idea, working example, production, pitfalls, checklist, further reading.
- **Accuracy fix:** the line saying Part 6 "shows how to run the same script as a hook" was wrong (Part 6 uses a different example). It now says Part 6 shows how to turn a check like this into a `PreToolUse` hook.
- **Trims:** cut filler phrases in the intro, idea section, production notes and pitfalls ("it helps to name them", "puts it well", repeated auto-mode explanation in the pitfall). Prose is about 2,430 words, inside the 1,500–2,500 range.
- **Sidecar:** summary reworded for junior readers (names the three deliverables plainly); "interactive sessions start in auto mode" now says "on recent versions" in the key term and key point.
- **Unchanged:** all code blocks (they match sections 3.2–3.5), all links (official `code.claude.com` docs pages), the production claims and numbers.
