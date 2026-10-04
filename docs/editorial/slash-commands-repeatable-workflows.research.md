# Research brief: Part 2, "Slash commands: turning repeated prompts into team workflows"

Researcher notes for the writer. Checked on 2026-10-04 against the official docs and a live run of Claude Code v2.1.289 on macOS.

## 0. Read this first

- **The big change: custom commands have been merged into skills.** The docs now say a file at `.claude/commands/deploy.md` and a skill at `.claude/skills/deploy/SKILL.md` "both create `/deploy` and work the same way". Command files "keep working". Skills add a folder for supporting files, invocation control and automatic loading by Claude. [SKILLS, intro note]
- **What this means for the article.** Teach the command file as the simplest way to turn a repeated prompt into `/something`. Say plainly that it is the older format, that it still works, and that the same file can later move into a skill folder (Part 5) with no change to how people run it. Do not call commands deprecated. The docs say "older format", "still works" and "prefer a skill for new work".
- **Docs have moved.** `docs.claude.com/en/docs/claude-code/...` redirects to `code.claude.com/docs/en/...`. The old `slash-commands` URL now serves the skills page. Cite the `code.claude.com` URLs.
- **Primary sources:**
  - Skills (includes custom commands): https://code.claude.com/docs/en/skills (**[SKILLS]**). Same content at https://code.claude.com/docs/en/slash-commands.
  - Commands reference (built-ins and bundled skills): https://code.claude.com/docs/en/commands (**[CMDS]**)
  - Interactive mode: https://code.claude.com/docs/en/interactive-mode (**[INT]**)
  - Plugins reference: https://code.claude.com/docs/en/plugins-reference (**[PLUG]**)
  - MCP (prompts as commands): https://code.claude.com/docs/en/mcp (**[MCP]**)
  - The .claude directory: https://code.claude.com/docs/en/claude-directory (**[DIR]**)
- **The docs change often.** Many details carry "v2.1.x or later" notes. In the article, write "at the time of writing" and avoid version numbers unless the point needs one.
- **The example in section 3 was run live** in a throwaway repo. Results are recorded there.

## 1. Fact base

### 1.1 What a custom command is

- A custom command is a Markdown file. Its name becomes a slash command. Its body is a prompt that Claude Code hands to Claude when you type the command. [SKILLS]
- Optional YAML frontmatter goes between `---` lines at the very top. Claude Code reads frontmatter only when the opening `---` is the file's first line. If the YAML does not parse, the file still loads with no fields set. [SKILLS, "Frontmatter reference"]
- Built-in commands (such as `/compact`) run fixed logic in the CLI. Bundled skills and your own commands are prompts handed to Claude. [SKILLS, "Bundled skills"; CMDS]
- A command is recognised only at the **start** of a message. Text after the name becomes its arguments. Written later in a sentence ("go ahead and /deploy to staging"), the name does not run anything; it only counts as permission for Claude to run it. [CMDS intro; SKILLS, "Where you write the skill's name"]

### 1.2 Where commands live, and what each place means

| Kind                            | Path                                                               | Who gets it                                                      | Source                                                             |
| ------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------- | ------------------------------------------------------------------ |
| Project command (older format)  | `.claude/commands/<name>.md`                                       | Everyone who clones the repo, once committed                     | [SKILLS, "Choose where skills load"]                               |
| Personal command (older format) | `~/.claude/commands/<name>.md`                                     | You, in every project on this machine                            | [DIR]: "Same as project commands/ but scoped to your user account" |
| Project skill                   | `.claude/skills/<name>/SKILL.md`                                   | Sessions in this repo; commit it to share                        | [SKILLS]                                                           |
| Personal skill                  | `~/.claude/skills/<name>/SKILL.md`                                 | All your projects on this machine (not Cowork or cloud sessions) | [SKILLS]                                                           |
| Enterprise                      | `.claude/skills/<name>/SKILL.md` in the managed settings directory | Everyone on machines where the organisation deploys it           | [SKILLS]                                                           |
| Plugin                          | `<plugin>/skills/<name>/SKILL.md`, or `<plugin>/commands/*.md`     | Wherever the plugin is enabled, as `/plugin-name:name`           | [SKILLS]; [PLUG]                                                   |

- **Same name in two places.** For skills: enterprise beats personal, and personal beats project. If a skill and a `.claude/commands/` file share a name, the skill wins. Plugin items never clash because they are namespaced. [SKILLS, "Resolve skills that share a name"] _Say less:_ the docs do not spell out precedence between a personal command file and a project command file. Avoid giving the same name to both.
- **Overriding built-ins.** In a local terminal session, your skill with a built-in's name replaces that built-in but not its aliases. Example from the docs: a project `code-review` skill replaces `/code-review`, but `/review` still runs the bundled one. [SKILLS]
- **Monorepos.** Project skills load from `.claude/skills/` in the start directory and every parent up to the repo root. [SKILLS] (The docs describe this for skills; do not claim it for `commands/`.)
- **Picking up changes.** Claude Code watches skill directories and picks up edits without a restart. `/reload-skills` "re-scans skill and command directories" so items added or changed on disk become available without restarting. [SKILLS, "Edit a skill during a session"; CMDS] Safe advice: if a new command does not appear in the `/` menu, run `/reload-skills` or restart.

### 1.3 Naming and namespacing

[SKILLS, "How a skill gets its command name"]

| File                                     | Command you type                                                                                                           |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `.claude/commands/deploy.md`             | `/deploy`                                                                                                                  |
| `.claude/commands/frontend/component.md` | `/frontend:component` (each `/` in the subfolder path becomes `:`)                                                         |
| `.claude/skills/deploy-staging/SKILL.md` | `/deploy-staging`, or `/deploy` if frontmatter sets `name: deploy`                                                         |
| `my-plugin/skills/review/SKILL.md`       | `/my-plugin:review`                                                                                                        |
| MCP server prompt                        | Listed as `/servername:promptname (MCP)`; `/mcp__servername__promptname` also runs it [MCP, "Use MCP prompts as commands"] |

- Command files accept the same frontmatter as skills **except `name` and `paths`**. So a command's name always comes from its file name. [SKILLS]
- _Changed:_ older tutorials say a subfolder only changes the label shown in the menu. Current docs say the subfolder becomes part of the command, as in `/frontend:component`. Use the current form.

### 1.4 Frontmatter fields worth teaching

All fields are optional. Only `description` is recommended. Unknown field names are ignored silently, so a typo (for example `allowed_tools`) does nothing and gives no error. Booleans accept `true/false`, `yes/no`, `on/off`, `1/0`. [SKILLS, "Frontmatter reference"]

| Field                      | What it does (current docs)                                                                                                                                                                                                                                              |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `description`              | What the command does and when to use it. If omitted, the first non-empty line of the body is used. `description` plus `when_to_use` is cut at 1,536 characters in the listing Claude sees.                                                                              |
| `argument-hint`            | Text shown in autocomplete, e.g. `[issue-number]` or `[filename] [format]`.                                                                                                                                                                                              |
| `arguments`                | Named positional arguments, e.g. `arguments: [since, audience]` makes `$since` the first argument and `$audience` the second. Space-separated string or YAML list.                                                                                                       |
| `allowed-tools`            | Tools Claude may use **without asking**, only during the turn that runs the command. The grant clears when you send your next message. It does not restrict other tools. Deny and ask rules still win. Example: `Bash(git add *) Bash(git commit *) Bash(git status *)`. |
| `disallowed-tools`         | Tools removed while the command is active. Clears on your next message.                                                                                                                                                                                                  |
| `model`                    | Model for the rest of the current turn only. Same values as `/model`, or `inherit`. Not saved to settings.                                                                                                                                                               |
| `effort`                   | `low`, `medium`, `high`, `xhigh`, `max` (depends on model).                                                                                                                                                                                                              |
| `disable-model-invocation` | `true` means only you can run it; Claude cannot run it on its own, and its description is not loaded into Claude's context. Use for anything with side effects. If Claude tries anyway, Claude Code blocks the call.                                                     |
| `user-invocable`           | `false` hides it from the `/` menu so only Claude can use it. Meant for background knowledge, not commands.                                                                                                                                                              |
| `context: fork` + `agent`  | Runs the prompt in a separate sub-agent (default `general-purpose`; also `Explore`, `Plan` or a custom agent). That sub-agent does not see your conversation. Teaser for Part 3.                                                                                         |
| `shell`                    | `bash` (default) or `powershell` for the `!` commands.                                                                                                                                                                                                                   |
| `hooks`                    | Hooks registered when invoked (link to Part 6).                                                                                                                                                                                                                          |

- **Security note from the docs.** Workspace trust does not gate `allowed-tools`. A project command's grant applies even in a `-p` run in a folder you never trusted. Review `allowed-tools` in commands checked into a repo before running Claude Code there. Organisations can ignore these grants with `allowManagedPermissionRulesOnly` in managed settings. [SKILLS, "Pre-approve tools for a skill"]
- **Tip worth one line.** The word `ultrathink` anywhere in the body asks for deeper reasoning when the command runs. [SKILLS, Tip under "Inject dynamic context"] (The course has a "thinking mode" lesson; keep this to one sentence.)

### 1.5 Arguments

[SKILLS, "Available string substitutions" and "Pass arguments to skills"]

| Placeholder             | Expands to                                                                       |
| ----------------------- | -------------------------------------------------------------------------------- |
| `$ARGUMENTS`            | Everything typed after the command name, as typed                                |
| `$ARGUMENTS[N]` or `$N` | One argument by 0-based position: `$0` is the first, `$1` the second             |
| `$name`                 | A named argument from `arguments:` frontmatter                                   |
| `${CLAUDE_PROJECT_DIR}` | Project root (useful in `!` commands that must not depend on the current folder) |
| `${CLAUDE_SESSION_ID}`  | Current session ID                                                               |

- **Zero-based, not one-based.** `$0` is the first argument. Older community posts use `$1` for the first argument. Flag this clearly.
- Indexed arguments use shell-style quoting: `/my-cmd "hello world" second` gives `$0` = `hello world`.
- A missing **indexed** argument (e.g. `$2` with one argument) stays in the text literally. A missing **named** argument becomes an empty string. This is why the example uses `arguments:`.
- If the body has no placeholder at all, Claude Code appends `ARGUMENTS: <what you typed>` so Claude still sees it.
- Escape a literal dollar before a digit with a backslash: `\$1.00`.
- **Chaining (new).** You can start a message with several commands, e.g. `/write-tests /fix-issue 123`. Each loads, and the trailing text goes to each as arguments. Up to six can be chained. [CMDS intro; SKILLS] Only inline user-invocable skills/commands chain; a forked one ends the chain.

### 1.6 Running shell commands before the prompt (`!`)

[SKILLS, "Inject dynamic context"]

- Syntax: `` !`git status` `` on a line. Claude Code runs it **before** Claude sees anything, and replaces the line with the output. Claude receives data, not the command.
- Multi-line form: a fenced block opened with ` ```! `.
- The `!` must be at the start of a line or after whitespace. `` KEY=!`cmd` `` is left as literal text.
- Output is inserted once and not re-scanned.
- Runs in the session's current working directory, with stderr merged into stdout, under the Bash tool's default 2-minute timeout.
- **Failure aborts the whole command.** Claude never sees the prompt. The message is `Shell command failed for pattern "..."`. Any non-zero exit counts as failure, except exit code 1 from search and comparison commands such as `grep` and `git diff`. Append `|| true` to a command you expect to fail.
- **Permissions.** These commands never prompt. Each is checked against your permission rules. A deny rule aborts with `Shell command permission check failed for pattern "..."`. Outside auto mode, anything other than "allow" (including an "ask" rule) also aborts. Pre-approve the exact commands with `allowed-tools`.
- **Kill switch.** `"disableSkillShellExecution": true` in settings replaces each command with `[shell command execution disabled by policy]` for user, project, plugin and additional-directory commands. Most useful in managed settings.
- This is the documented basis for production note 5: fetch context at the start instead of trusting memory.

### 1.7 File references (`@`)

- In the prompt box, `@` triggers file-path autocomplete and attaches the file. [INT, keyboard table]
- Inside a local command or skill, an `@path` reference attaches that file. The docs state this indirectly: for skills synced from claude.ai, Claude Code "doesn't attach the files that `@` references name the way it does for a local skill". [SKILLS, "How Claude Code handles the body of a synced skill"]
- _Say less:_ the current skills page has no dedicated section on `@` in command bodies. Show it once in the example (it was tested, see 3.3) and do not describe edge cases such as missing files.

### 1.8 How commands relate to context

- The rendered command enters the conversation as one message and stays there. Claude Code does not re-read the file on later turns. Write rules that should hold for the whole task as standing instructions. [SKILLS, "Skill content lifecycle"]
- After compaction, invoked skills are re-attached within a budget (first 5,000 tokens each, 25,000 combined). Put the most important instructions near the top. [SKILLS] Link back to Part 1.
- Descriptions of model-invocable commands sit in context every turn; `disable-model-invocation: true` keeps a command's description out. [SKILLS, "Control who invokes a skill"] Useful line: "manual-only commands cost nothing until you run them."
- `/skills` lists what is available; `/context` shows what the listing costs; `/skill-doctor` reports unused ones. [CMDS; SKILLS]

### 1.9 Built-in commands worth knowing (verified in [CMDS])

`/help`, `/clear`, `/compact [instructions]`, `/context`, `/init`, `/memory`, `/permissions`, `/model`, `/mcp`, `/hooks` (view only), `/plugin`, `/skills`, `/reload-skills`, `/btw` (side question that does not join the history), `/code-review` (bundled skill; `/review` is an alias), `/security-review`.

- Keep this list short in the article. The course covers `/btw` in its own lesson; mention it at most once.
- _Changed:_ `/agents` now only prints a reminder to ask Claude to create sub-agents (interactive UI removed after v2.1.197). Do not describe an `/agents` wizard. `/doctor` is now a bundled skill rather than a built-in.

### 1.10 Plugin-provided commands

- A plugin can ship `commands/` (flat Markdown command files) and `skills/`. The plugins reference says: "Prefer `skills/` for new plugins". [PLUG, file locations table]
- Plugin items are namespaced `/plugin-name:name`, so they never collide with yours. The bare name may also work when nothing else uses it. [SKILLS]
- Manage with `/plugin` (list, install, enable, disable). `skillOverrides` in settings does not affect plugin skills. [CMDS; SKILLS]
- A team that wants the same commands in many repos can package them as a plugin instead of copying files. One sentence; details belong to a later part.

### 1.11 Recently changed (for the "if your tutorial says otherwise" box)

- Custom commands merged into skills; `.claude/commands/` is the "older format" but still works.
- Subfolders now namespace the command name (`/frontend:component`).
- `$0` is the first argument (0-based). `$ARGUMENTS[N]` and named `arguments:` exist.
- Chaining several commands at the start of one message.
- `allowed-tools` grant lasts one turn and can be switched off org-wide.
- `/agents` is no longer an interactive builder.

## 2. How the production notes map to the docs

| Note (anonymised, as given)                                                                                                                                                                                                     | Doc feature that supports it                                                                                                                                                                                                                                             |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1. Data-update chore as a staged command (scan, search, extract, validate, append, report), refuses to append without agreement across independent sources, append-only, never guesses a gap, resumes from a saved session file | Body as numbered stages with explicit stop conditions; `disable-model-invocation: true` because it has side effects; `!` to load the saved session file at the start. Hard rules that must hold every time belong in a hook (docs: "move the rule into a hook"), Part 6. |
| 2. A content-gathering command reads recent git history across several repositories and writes a stakeholder summary; a second command turns that into a slide deck                                                             | `!` git commands for context; chaining or running one command after another; outputs as files the next command reads. Message: commands compose.                                                                                                                         |
| 3. Personal planning workflow (brief, design options, decision record, plan, review, release check) as personal commands; team-relied steps committed as project commands                                                       | `~/.claude/commands/` vs `.claude/commands/` scopes (1.2).                                                                                                                                                                                                               |
| 4. Commands that write anything sensitive end with an explicit review gate                                                                                                                                                      | `disable-model-invocation: true`; body ends with "stop and show me"; example in 3.1 does exactly this.                                                                                                                                                                   |
| 5. Commands drift when they rely on the model remembering context; reliable ones fetch what they need at the start                                                                                                              | `!` injection runs before Claude sees the prompt (1.6); content is not re-read on later turns (1.8).                                                                                                                                                                     |

Do not add numbers, tool counts, names or repo names to these notes.

## 3. Proposed original example (tested)

Not git branching or merging (the course covers that). Not a workout app. Domain: a small generic project with a reports API.

### 3.1 Project command: `/release-notes`

File: `.claude/commands/release-notes.md` (commit it so the whole team runs the same steps).

```markdown
---
description: Draft release notes from git history since a ref, ending with a review checklist
argument-hint: <since-ref> [audience]
arguments: [since, audience]
disable-model-invocation: true
allowed-tools: Bash(git log *) Bash(git diff *)
---

## Commits since $since

!`git log --no-merges --pretty=format:'- %h %s' $since..HEAD`

## Files changed

!`git diff --stat $since..HEAD`

## House style

Follow the format of the most recent entry in @CHANGELOG.md.

## Your task

Draft release notes for the commits above. Audience: $audience. If the audience is blank, write for developers who use this project.

Rules:

1. If the commit list is empty, stop. Say no ref was given or nothing changed, and suggest `/release-notes v1.2.0`.
2. Use only the commits listed above. Do not invent changes. Every bullet ends with its short commit hash.
3. Group under: Breaking changes, Added, Fixed, Other. Leave out a group that would be empty.
4. Put breaking changes first, each with one line on what users must do.

Then print this checklist, marking each item [x] or [ ] with a short reason:

- [ ] Every bullet maps to a listed commit
- [ ] Breaking changes are first and have a migration step
- [ ] No internal names, ticket IDs, secrets or customer names
- [ ] Wording suits the stated audience

Do not edit CHANGELOG.md, create a tag or push anything. Stop after the draft and checklist so a person can review it.
```

Usage: `/release-notes v0.1.0 customers`

Why each part is there (for the writer):

- `arguments: [since, audience]` rather than `$0`/`$1`: a missing named argument becomes empty, whereas a missing `$1` stays as literal text.
- `!` lines gather facts before Claude reads the prompt (production note 5).
- `allowed-tools` lists exactly the two git commands so the pre-run step is not blocked by a permission check.
- `disable-model-invocation: true`: release notes are something you decide to run.
- The last paragraph is the review gate (production note 4).

### 3.2 Personal command: `/brief`

File: `~/.claude/commands/brief.md`. Keep it personal because it encodes how **I** like to start work. Nobody else's process depends on it. If the team adopts it as a required step, move it to `.claude/commands/` and commit it.

```markdown
---
description: Turn a rough feature idea into my one-page brief before any design or code
argument-hint: <feature idea>
disable-model-invocation: true
---

Write a one-page brief for: $ARGUMENTS

Use these headings: Problem, Who it is for, What success looks like, Constraints, Out of scope, Open questions.

Before drafting, read the README and any docs folder so the brief uses this project's real terms.
If the problem or the user is unclear, ask me up to three questions first and wait for answers.
Keep it under 400 words. Do not write code, create files or propose a design yet.
```

Suggested rule of thumb for the article: personal = your habits and preferences; project = anything a teammate, reviewer or CI step expects to be done the same way.

### 3.3 Test results (Claude Code v2.1.289, macOS, `claude -p`)

Throwaway repo: tag `v0.1.0`, then four commits (a feature, a fix, a chore, and a breaking endpoint rename), plus a one-entry `CHANGELOG.md`.

| Run                                                   | Result                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/release-notes v0.1.0 customers`                     | Worked. Breaking change listed first with a migration step, then Added and Fixed, each bullet ending with its hash. Checklist printed. It also noted the CHANGELOG format (the `@` reference was read). It did not edit any file. It left the chore commit out as not relevant to customers and said so. |
| `/release-notes` (no argument)                        | `$since` became empty, so `git log ..HEAD` returned nothing. Claude stopped as rule 1 says and suggested a ref. No files changed.                                                                                                                                                                        |
| `/release-notes v9.9.9` (ref does not exist)          | `git log` exited non-zero, so the whole command aborted before Claude ran: zero turns, empty result in `-p` mode. This matches the documented "failed command aborts the invocation" behaviour. In an interactive session the docs say you see `Shell command failed for pattern "..."`.                 |
| `/brief let report users schedule a weekly CSV email` | Worked. It read the repo, found no README, listed the terms it found, and asked three questions before drafting, as instructed.                                                                                                                                                                          |

Notes for the writer:

- A copy without `allowed-tools` also ran in my environment, so I cannot show a failure caused by a missing grant. Keep `allowed-tools` in the example and describe it as the documented way to make sure the pre-run commands are allowed; do not claim it fails without it.
- The model judged that the chore commit did not belong in customer-facing notes despite the "Other" group. That is reasonable, but if the writer wants strict behaviour, add "Include every commit" to rule 3. Good material for a pitfall: commands are prompts, not scripts; hard rules belong in hooks.

## 4. Originality and confidentiality check

- No course sequence, project or example tools are used. The examples are release notes and a feature brief over a generic reports API.
- Production notes are used only as given in the brief, with no names, numbers or repo names added.
- I checked this file against the private blocklist after writing it; no term from it appears.

## 5. Suggested pitfalls (for the writer to pick from)

- A typo in a frontmatter field is ignored silently.
- `$1` is the second argument, not the first.
- A failing `!` command aborts the whole command; use `|| true` for commands that may exit non-zero, or design the failure as a useful stop.
- `allowed-tools` lasts one turn and is not a sandbox; deny rules still apply, and checked-in grants deserve review.
- A command written as "remember to..." drifts; fetch the facts with `!` at the start.
- Personal commands that the team quietly depends on: if a teammate needs it, commit it.
- Commands with side effects without `disable-model-invocation: true` can be run by Claude on its own.

## Editor's notes (2026-10-04)

- Opening: led with a one-line hook ("Your best prompt works for you and drifts for everyone else.") and tightened the next two paragraphs.
- Headings: shortened "The idea" heading to "The idea: a command is a contract". Template order confirmed: idea, working example, production, pitfalls, checklist, further reading.
- Filler and tone: trimmed "That is useful, but", "Each part of the file earns its place", "Our most valuable command" (now "The command I rely on most"), and softened "many older posts get it wrong" to "older posts often count from one" (per 1.5).
- Accuracy: the hard-rules pitfall said the release-notes test showed a command is "followed most of the time"; the test (3.3) actually showed a judgement call (the chore commit was left out). Reworded to match.
- Code blocks: unchanged; they match sections 3.1 and 3.2.
- Links: all six point to code.claude.com/docs/en pages listed in section 0. No change.
- Sidecar: simplified the summary wording slightly; added `date` and `series` (part 2 of 10) to match the other parts' sidecars.
- Checks: prose about 2,050 words (within 1,500–2,500); no blocklist terms; no new claims or numbers.
