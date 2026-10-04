Your team's responsible AI policy is probably a paragraph. It sits on a wiki page or at the bottom of a policy document, and it says the right things: review the output, protect customer data, don't paste secrets. Then a developer opens a terminal, starts an agent, and that paragraph is nowhere near the work.

The gap shows up in small ways. A token gets printed in a session. A pull request goes in that nobody could explain line by line. A client name slips into a public draft. Nobody meant any of it. The paragraph had no way to reach the moment that mattered.

This last part of the series closes that gap. My argument is simple: responsible use is a set of concrete habits and gates, not a disclaimer. And if you cannot explain what your agent does to someone who doesn't write code, you probably don't control it well enough yet.

## The idea: promises and controls

One sentence from the Claude Code permissions docs carries this whole article: permission rules are enforced by Claude Code, not by the model. What you write in a prompt or in `CLAUDE.md` shapes what Claude _tries_ to do. It does not change what Claude Code _allows_.

So there are two kinds of rule.

- **A promise** is a rule written in prose. "We never read production secrets." It depends on everyone, human and model, remembering it.
- **A control** is a rule the tool or the platform enforces whatever anyone remembers. A deny rule in settings. A branch protection rule on your git host. A check that fails the build.

Responsible use means knowing which rules are which, and moving the important ones from promise to control. Some will always stay promises. "Every change is reviewed by someone who could explain it" cannot be enforced by a settings file. That is fine, as long as you are honest that it is a habit and not a wall.

The docs make the same point about things you say in chat. If you tell Claude "don't push", the safety checks in auto mode treat that as a signal. But those boundaries are not stored as rules, and one can be lost when older messages are summarised to free up context (this is called **compaction**). For a hard guarantee, the docs say, add a deny rule.

A few current facts shape the setup. At the time of writing:

- **The starting mode has changed.** A **permission mode** decides what runs without asking you. On recent versions, interactive terminal and VS Code sessions start in **auto mode**. In auto mode a separate classifier model reviews actions before they run and blocks things like `curl | bash`, force pushes, production deploys, and printing a live token into the transcript. Many older tutorials still say Claude Code asks before every edit. That is no longer true for interactive use. You can switch modes with `Shift+Tab`. The docs are clear that auto mode reduces prompts but does not guarantee safety.
- **Some prompts survive every mode.** Explicit `ask` rules are never auto-approved in any mode. In auto mode they still prompt. Where nobody can answer, such as `dontAsk` or `claude -p`, the call is refused. Deny rules apply in every mode, including bypass.
- **Deny rules are not a security boundary on their own.** A `Read` deny hides a file from Claude's file tools and search. It does not stop a shell command or script that reads the file without naming it. The **sandbox** (an operating-system boundary around shell commands) is off by default and covers that gap on macOS, Linux and WSL2. You want both.
- **Checkpoints are not version control.** `/rewind` restores Claude's file edits. It does not track files changed by shell commands. Git does.

So the mental model is layered. Prose sets intent. Settings and the sandbox limit what the agent can touch. Your git host and CI guard what can be merged and shipped. A person reviews and signs off. Each layer catches what the one before misses.

## A working example

Here is a small kit you can drop into a repository today. Three files:

1. `AI-WORKING-AGREEMENT.md`: a one-page team agreement in plain English.
2. `.claude/settings.json`: the part of that agreement Claude Code can enforce.
3. `scripts/check-confidential.sh`: a check that fails if a confidential term appears in a file, and reports counts only.

The design point: the agreement says what you promise, and every line is labelled _enforced_ or _by review_. Nobody should mistake a promise for a control.

### The agreement

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
- Run in bypass-permissions mode. _(enforced: `disableBypassPermissionsMode`)_
- Push or publish a package without a person approving that step. _(enforced: branch protection; ask rules add a prompt)_
- Deploy or run a migration. _(enforced: only CI deploys, after a human approval)_
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

Keep it to one page. Nobody reads a long policy before starting a session.

The "enforced" labels are only true if the controls exist. The settings file below covers the agent side. Branch protection and the deploy rule live on your git host and in CI, so set those up too, or change the labels to _by review_ until you have.

### The settings

Save this as `.claude/settings.json` and commit it:

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

What each part does:

- `disableBypassPermissionsMode` takes the string `"disable"`, not `true`. With it set, Claude Code refuses the `--dangerously-skip-permissions` flag. Organisation-wide managed settings are stronger still, because a project file can't override them.
- The `Read` deny rules hide the files from Claude's file discovery and search and block reads. A `Read` deny also blocks edits on those paths; the explicit `Edit` rule is belt and braces.
- The `ask` rules are never auto-approved in any mode. In auto mode they still prompt. A trailing ` *` also matches the bare command, so `git push` on its own is caught. Where nobody can answer, such as `dontAsk` or `claude -p`, the call is refused.
- Committed deny and ask rules apply straight away. Allow rules in a project file only apply after someone accepts the workspace trust dialog. Restrictions are safe to share.

Two honest limits. `Bash(git push *)` does not catch every way of writing a push, such as `git -C . push`. Your branch protection is the real gate. And the `Read` deny does not stop a script from reading the blocklist. That is exactly why the check below works, and why it must never print a term.

If you are on macOS, Linux or WSL2, turn on the sandbox as well (`/sandbox`) and list the credential files and environment variables it should hide. There is no built-in list, so only what you name is protected. The [sandboxing page](https://code.claude.com/docs/en/sandboxing) has the exact shape.

### The confidentiality check

```bash
#!/usr/bin/env bash
# Fails if any term from the private blocklist appears in the given files.
# Prints counts only, never the terms themselves.
set -euo pipefail
terms=".confidential-terms"
[ -f "$terms" ] || { echo "No blocklist found; skipping."; exit 0; }
[ "$#" -gt 0 ] || { echo "No files given."; exit 2; }
hits=0
for f in "$@"; do
  [ -f "$f" ] || { echo "$f: not found"; exit 2; }
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

The blocklist is one term per line. Blank lines and lines starting with `#` are ignored, and matching is case-insensitive. Try it:

```bash
chmod +x scripts/check-confidential.sh
printf '.env\n.env.*\n.confidential-terms\n' >> .gitignore
printf '# client names\nAcme Capital\nProject Falcon\n' > .confidential-terms
echo "Built for acme capital under Project Falcon." > draft.md
./scripts/check-confidential.sh draft.md
```

You should see:

```text
draft.md: 2 blocked term(s) found
Confidentiality check failed: 2 hit(s). Terms are not shown.
```

Two design choices to make on purpose. First, "skip if the list is missing" is a convenience for people who don't have the list. A stricter team should make a missing list fail. Second, the list is git-ignored, so CI won't have it. If you want the check in CI, store the list as an encrypted CI secret and write it to the file when the job starts. Part 6 of this series shows how to turn a check like this into a `PreToolUse` hook, so it runs before a write rather than before a merge.

### Explaining it to others

The last piece of the kit is not a file: it is the explanation. I use one analogy for developers and non-developers alike.

An AI coding agent is like a very fast, very well-read new colleague who has never been inside your building.

- They can read anything you hand them, but they only know what is in front of them today. That is the **context**.
- You decide which rooms their key card opens. Those are the **permissions**.
- Some jobs always need a supervisor's signature, whoever does them. Those are **ask rules and review gates**.
- The building has walls they cannot walk through, whatever they are told. That is the **sandbox**.
- They can be talked into things by a convincing note left on a desk. That is **prompt injection**: hostile text in a web page, issue or file that tries to steer the agent. It is why the key card matters more than the instructions.
- You sign off the finished work, and their name goes on it too. That is **attribution**.

For a manager, client or family member, three sentences are enough: "It writes and changes software the way a junior engineer would, by reading our code and running our tests. It is fast, but it can be confidently wrong, so a person checks every change before it reaches customers. It can only touch what we have allowed it to touch."

Then give one before and after. Before: adding a "download as spreadsheet" button to a report page meant an afternoon of finding the right files, writing code and testing by hand. After: the developer describes the outcome, the agent finds the files, proposes a plan, writes the code and tests, runs them, and shows the results. The developer reads the change, asks for one fix, and approves it. The human time moves from typing to deciding and checking. I don't attach a speed-up number, because I have no measurement to back one.

For a new hire, a short day-one list:

1. Read `AI-WORKING-AGREEMENT.md` and `CLAUDE.md`.
2. Run `/permissions` once to see what the agent may do here, and which settings file each rule comes from.
3. Know your mode. Use Manual or plan mode for unfamiliar or sensitive code.
4. A change isn't done until you have seen the test output.
5. Know your undo buttons: `/rewind` for Claude's file edits, git for everything else.
6. If a secret shows up anywhere, tell someone and rotate it.
7. Your name is on the PR. If you can't explain the change, it isn't ready.

## How I use this in production

These come from my own work, including client work for a global hedge fund with ~$1B AUM. I describe them as patterns on purpose.

**If I could keep only one guardrail, it would be the confidentiality check.** Every public piece on this site passes an automated check against a private, git-ignored blocklist of names. A second check only allows numbers I have approved. When either fails, the report gives counts, never the terms. A check that prints what it found has just copied the confidential term into a log, a CI output or an agent's context. The lesson: design your guardrails so they cannot become the leak.

**One human publish, however many agents.** This series is researched, written, edited and evaluated by a team of agents. Nothing goes live until I press publish. The agents do a lot of the work; they cannot ship. The lesson: more automation upstream makes a single, named human gate downstream more valuable, not less.

**Anonymised patterns, not names.** When I write or talk about client work, I describe what we did and what we learned, never who it was for or numbers beyond an approved list. A check is more reliable than taste, which fails at the end of a long day.

**Secrets live in the platform, and a leak means rotation.** Secrets sit in the deployment platform's encrypted settings, never in the repo or in chat. Once, a token was printed in a session. We rotated it rather than scrolling up to delete the message. Session transcripts are kept on disk in plain text (30 days by default, at the time of writing), and the conversation had already gone to the model provider. Deleting the line on screen fixes nothing. Rotation does.

**Mental model first, then the tool.** Before I worked in AI, I taught physics and later ran a physics department. The same rule held there. If a student can't explain why a formula works, knowing which button to press on the calculator won't save them. With agents, I explain the key card and the supervisor's signature before I show anyone a settings file.

**Under-18 audiences get tool-agnostic material.** Anthropic's consumer terms require users to be at least 18, or the local age of consent if that is higher. So when I teach younger learners, I teach the mental model without tying it to one product, and I check each provider's own age rules before suggesting any of them.

## Pitfalls

**Treating the policy page as the control.** A paragraph in a wiki enforces nothing. Label every rule as enforced or by review, and turn the important ones into settings, branch protection or a failing check.

**Assuming the agent asks before every change.** Interactive sessions now start in auto mode, so "it always asks" is out of date. Check the mode in each session, and use Manual or plan mode for sensitive work.

**Treating a deny rule as a wall.** `Read` deny rules do not stop a script that reads files, and Bash rules can be written around. Use permission rules for Claude's own tools, the sandbox for shell commands, and your git host for anything that must not reach `main`.

**Clicking approve on autopilot.** As the best-practices guide notes, after the tenth approval you are clicking through rather than reviewing. Approving a prompt is not a review. Allow the safe, boring commands so the prompts that remain mean something. Then read the diff and ask for evidence.

**Deleting a leaked secret instead of rotating it.** The secret has already left your screen. Rotate it first, then clean up.

**Turning off attribution to look tidier.** The co-author line on commits is the cheapest disclosure you will ever get. Keep it in shared repos, and say in the PR when an agent wrote most of a change.

## Checklist

- [ ] Write a one-page `AI-WORKING-AGREEMENT.md` and label each rule _enforced_ or _by review_.
- [ ] Commit `.claude/settings.json` with deny rules for secrets and `disableBypassPermissionsMode` set to `"disable"`.
- [ ] Add `ask` rules for push, publish and anything else that leaves your machine.
- [ ] Turn on branch protection with at least one human approval.
- [ ] Add a counts-only confidentiality check and git-ignore its blocklist.
- [ ] Run `/permissions` and confirm what the agent can and cannot do.
- [ ] Turn on the sandbox if you are on macOS, Linux or WSL2.
- [ ] Practise the three-sentence explanation on one non-developer this week.

## Further reading

- [Security](https://code.claude.com/docs/en/security): Claude Code's safeguards, prompt injection and your responsibilities.
- [Configure permissions](https://code.claude.com/docs/en/permissions): allow, ask and deny rules, precedence and their limits.
- [Choose a permission mode](https://code.claude.com/docs/en/permission-modes): Manual, auto, plan and bypass, and what each one blocks.
- [Sandboxing](https://code.claude.com/docs/en/sandboxing): the operating-system boundary for shell commands, including credential protection.
- [Data usage](https://code.claude.com/docs/en/data-usage): training, retention and local transcripts by plan.
- [Best practices](https://code.claude.com/docs/en/best-practices): verification, review and avoiding approval fatigue.
