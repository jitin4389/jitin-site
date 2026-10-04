# Research brief: Part 5, "Agent Skills: methodology the agent carries with it"

Researcher notes for the writer. Checked on 2026-10-04 against the official docs and live runs of Claude Code v2.1.289 on macOS.

## 0. Read this first

- **Docs have moved.** Claude Code pages now live on `code.claude.com/docs/en/...`. Agent Skills platform pages (overview, best practices, API guide) live on `platform.claude.com/docs/en/...`. Old `docs.claude.com` / `docs.anthropic.com` links redirect. Cite the new URLs.
- **Primary sources** (cited below by tag):
  - **[CC]** Claude Code skills: https://code.claude.com/docs/en/skills
  - **[OV]** Agent Skills overview: https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview
  - **[BP]** Skill authoring best practices: https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
  - **[API]** Using Agent Skills with the API: https://platform.claude.com/docs/en/build-with-claude/skills-guide
  - **[SDK]** Agent SDK skills: https://code.claude.com/docs/en/agent-sdk/skills
  - **[SUB]** Sub-agents: https://code.claude.com/docs/en/sub-agents
  - **[CET]** Code execution tool: https://platform.claude.com/docs/en/agents-and-tools/tool-use/code-execution-tool
- **Biggest recent change: custom slash commands have been merged into skills.** `.claude/commands/deploy.md` and `.claude/skills/deploy/SKILL.md` both create `/deploy`. Old command files keep working; skills add a folder for supporting files, invocation control and automatic loading. [CC, intro note] The old `slash-commands` docs URL now serves the skills page. **This affects Part 2 too** (slash commands). Coordinate so the two parts do not contradict each other.
- **Second big change: the Skills API is out of beta.** It no longer needs the `skills-2025-10-02` beta header (still accepted). The code execution tool also needs no beta header now. [API, "Migrate from skills-2025-10-02"; CET] Older tutorials that show `anthropic-beta: skills-2025-10-02` and `client.beta.skills` are out of date.
- **The docs change often.** Many behaviours carry "v2.1.x or later" notes. Say "at the time of writing". Do not name version numbers unless the point needs one.
- **The example in section 3 was tested live.** The scanner script was run directly, and the skill was run through `claude -p` several times. One permission finding matters for the article. See 3.7.

## 1. Fact base

### 1.1 What a skill is

- A skill is a folder with a `SKILL.md` file. The file has YAML frontmatter between `---` markers, then Markdown instructions. Claude uses a skill when it is relevant, or you invoke it with `/skill-name`. [CC]
- When to make one (Anthropic's own wording, paraphrase it): when you keep pasting the same instructions, checklist or multi-step procedure into chat, or when a section of CLAUDE.md has grown into a procedure rather than a fact. Unlike CLAUDE.md, a skill's body loads only when used, "so long reference material costs almost nothing until you need it." [CC]
- Claude Code skills follow the **Agent Skills open standard** (https://agentskills.io). Claude Code adds extensions: invocation control, running in a sub-agent, and dynamic context injection. [CC]
- Two kinds of content [CC, "Types of skill content"]:
  - **Reference content**: conventions, patterns, domain knowledge, applied alongside current work.
  - **Task content**: step-by-step instructions for an action such as a deploy. Often invoked by hand.
- Claude Code also ships **bundled skills** (for example `/code-review`, `/debug`, `/loop`, `/claude-api`, `/run`, `/verify`). They can be turned off with the `disableBundledSkills` setting. [CC, "Bundled skills"]

### 1.2 Where skills live (Claude Code)

[CC, "Choose where skills load"]

| Location             | Path                                                               | Loads in                                                                     |
| -------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| Enterprise           | `.claude/skills/<name>/SKILL.md` in the managed settings directory | All users on machines where the organisation deploys it                      |
| Personal             | `~/.claude/skills/<name>/SKILL.md`                                 | All your projects on this machine (not Cowork or cloud sessions)             |
| Project              | `.claude/skills/<name>/SKILL.md`                                   | This repository. Commit it to share with the team                            |
| Nested               | `<subdir>/.claude/skills/<name>/SKILL.md`                          | Sessions started in or below `<subdir>`, or once Claude works on files there |
| Additional directory | `.claude/skills/` inside a directory passed with `--add-dir`       | That session                                                                 |
| Plugin               | `<plugin>/skills/<name>/SKILL.md`                                  | Wherever the plugin is enabled, as `/plugin-name:skill-name`                 |
| claude.ai account    | Skills enabled on your claude.ai account                           | Cowork, cloud sessions, and terminal sessions signed in with that account    |

- **Same name in several places:** enterprise beats personal, personal beats project. A skill beats a `.claude/commands/` file of the same name. Plugin skills never clash because they are namespaced. [CC, "Resolve skills that share a name"]
- **Monorepos:** project skills load from `.claude/skills/` in the start directory and every parent up to the repo root. [CC]
- **Live reload:** Claude Code watches skill directories, so editing `SKILL.md` takes effect in the current session without a restart. A brand-new top-level skills directory needs `/reload-skills`. [CC, "Edit a skill during a session"]
- **Cloud sessions and routines do not read `~/.claude/skills/`.** Commit the skill to the repo, or enable it on your claude.ai account. [CC, "Use skills in Cowork and cloud sessions"]
- **Command name:** the directory name, or the frontmatter `name` if set. Plugin skills are `/plugin-name:skill-name`. [CC, "How a skill gets its command name"]
- **Personal vs project rule of thumb for the article** (my framing, consistent with the docs): personal = your own habits across all repos; project = the team's agreed way of doing things in this repo, reviewed in pull requests like code.

### 1.3 SKILL.md frontmatter (Claude Code)

[CC, "Frontmatter reference"] **All fields are optional in Claude Code. Only `description` is recommended.** Unknown field names are silently ignored, so a typo fails quietly. If the YAML does not parse, the skill still loads with no fields set. Frontmatter is only read if `---` is the very first line.

| Field                                  | What it does (short)                                                                                                                           |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`                                 | Command name. Defaults to the directory name                                                                                                   |
| `description`                          | What it does and when to use it. Claude matches requests against this                                                                          |
| `when_to_use`                          | Extra trigger phrases, appended to `description`                                                                                               |
| `argument-hint`                        | Autocomplete hint, e.g. `[issue-number]`                                                                                                       |
| `arguments`                            | Named positional arguments for `$name` substitution                                                                                            |
| `disable-model-invocation`             | `true` = only you can invoke it. Also removes the description from Claude's context                                                            |
| `user-invocable`                       | `false` = hidden from the `/` menu; only Claude invokes it                                                                                     |
| `allowed-tools`                        | Tools Claude may use **without asking** during the turn that invokes the skill. Clears on your next message. **Does not restrict** other tools |
| `disallowed-tools`                     | Tools removed from Claude's pool while the skill is active                                                                                     |
| `model`, `effort`                      | Model or effort level while the skill is active                                                                                                |
| `context: fork` + `agent`              | Run the skill in an isolated sub-agent (`Explore`, `Plan`, `general-purpose`, or a custom one)                                                 |
| `background`                           | With `context: fork`: `false` waits for the result instead of running in the background                                                        |
| `hooks`                                | Hooks registered when the skill is invoked, kept for the rest of the session                                                                   |
| `paths`                                | Glob patterns. Claude loads the skill automatically only when working with matching files                                                      |
| `shell`                                | `bash` (default) or `powershell` for injected commands                                                                                         |
| `metadata`, `license`, `compatibility` | From the open standard. Claude Code accepts but does not act on them                                                                           |

**Portability trap (important for the article).** Outside Claude Code (claude.ai uploads, the Skills API, packaging with `package_skill.py`), only six fields are allowed: `name`, `description`, `license`, `compatibility`, `metadata`, `allowed-tools`. Any other field is a **hard error** on upload: `Unexpected key(s) in SKILL.md frontmatter: ...`. [CC, "Using skill frontmatter outside Claude Code"]

**Validation rules for `name` and `description`** apply on the platform side (claude.ai, API). [OV, "Skill structure"; API, "Limits and constraints"]

- `name`: required there; max 64 characters; lowercase letters, numbers and hyphens only; no XML tags; must not contain "anthropic" or "claude".
- `description`: required there; non-empty; max 1,024 characters; no XML tags.

In Claude Code, the combined `description` + `when_to_use` is truncated at **1,536 characters** in the skill listing (configurable with `skillListingMaxDescChars`). Put the key use case first. [CC]

**String substitutions in the body** [CC]: `$ARGUMENTS`, `$ARGUMENTS[N]`, `$N`, `$name`, `${CLAUDE_SESSION_ID}`, `${CLAUDE_EFFORT}`, `${CLAUDE_SKILL_DIR}` (the skill's own folder), `${CLAUDE_PROJECT_DIR}`, and for plugins `${CLAUDE_PLUGIN_ROOT}` and `${CLAUDE_PLUGIN_DATA}`. `${CLAUDE_SKILL_DIR}` is substituted in both the body and `allowed-tools` Bash rules, which is how a skill pre-approves its own bundled script.

### 1.4 Progressive disclosure (how skills save context)

[OV, "How Skills work"]

| Level           | When loaded             | Token cost (Anthropic's figures) | Content                                                                         |
| --------------- | ----------------------- | -------------------------------- | ------------------------------------------------------------------------------- |
| 1: Metadata     | Always, at startup      | ~100 tokens per skill            | `name` and `description`                                                        |
| 2: Instructions | When the skill triggers | Under 5k tokens                  | `SKILL.md` body                                                                 |
| 3+: Resources   | As needed               | None until accessed              | Reference files are read; scripts are run, and only their output enters context |

- "The script's code never loads into the context window. Only its output ... consumes tokens." [OV]
- Claude Code specifics [CC]:
  - The listing of all skill descriptions has a budget of **1% of the model's context window**. With many skills, the least-used skills lose their descriptions first. Raise it with `skillListingBudgetFraction` or `SLASH_COMMAND_TOOL_CHAR_BUDGET`. `/doctor` estimates the cost; `/skill-doctor` shows cost and usage per skill.
  - Once invoked, the rendered `SKILL.md` enters the conversation as one message and **stays** for later turns. It is not re-read. Write standing instructions, not one-off steps.
  - After auto-compaction, Claude Code re-attaches the most recent invocation of each skill, keeping the **first 5,000 tokens** of each, within a combined **25,000-token** budget. **Put the most important rules at the top of `SKILL.md`.** This is the documented reason for "mandatory rules first" (production note 2).
  - Sub-agents with a `skills:` list get the **full** skill content injected at startup, not just the description. [CC; SUB, "Preload skills into subagents"]

### 1.5 How Claude decides to use a skill

- Claude sees every skill's name and description in its system prompt and matches the request against the description. "The `description` is what Claude matches your request against ... so it must say both what the Skill does and when to use it." [OV, Level 1]
- Best practice [BP, "Writing effective descriptions"]:
  - **Write in the third person** ("Processes Excel files", not "I can help you"). The description is injected into the system prompt and mixed point of view "can cause discovery problems".
  - Be specific and include key terms and triggers. Bad: "Helps with documents".
  - Claude may be choosing from 100+ skills, so the description must stand out.
- When Claude reads the skill: it reads `SKILL.md` from the filesystem with bash, then reads referenced files only when needed. [OV]
- Troubleshooting [CC, "Skill not triggering" / "Skill triggers too often"]: add the words users actually say; ask "What skills are available?"; invoke with `/name`; run with `--debug` to see YAML errors; `claude plugin validate .claude/skills` finds unparseable frontmatter. Triggering too often: make the description more specific, or set `disable-model-invocation: true`.

### 1.6 Invoking skills explicitly and controlling who can

[CC, "Control who invokes a skill"]

| Frontmatter                      | You can invoke | Claude can invoke | Description in context? |
| -------------------------------- | -------------- | ----------------- | ----------------------- |
| (default)                        | Yes            | Yes               | Always                  |
| `disable-model-invocation: true` | Yes            | No                | No                      |
| `user-invocable: false`          | No             | Yes               | Always                  |

- Use `disable-model-invocation: true` for anything with side effects (deploy, commit, send a message): "You don't want Claude deciding to deploy because your code looks ready." [CC]
- `/name args` at the **start** of a message runs the skill. Later in a message (e.g. "go ahead and /deploy"), the name only gives Claude permission to run it. [CC, "Where you write the skill's name"]
- Arguments: `/fix-issue 123` fills `$ARGUMENTS`. Several skills can be stacked at the start of one message. [CC, "Pass arguments to skills"]
- Permission rules: deny the `Skill` tool to disable all skills; `Skill(name)` exact and `Skill(name *)` prefix rules allow or deny specific ones. [CC, "Restrict Claude's skill access"]
- `skillOverrides` in settings sets a skill to `"on"`, `"name-only"`, `"user-invocable-only"` or `"off"` without editing the file. Not for plugin skills. [CC]

### 1.7 Scripts, reference files and dynamic context

- **Supporting files:** keep `SKILL.md` focused; link reference files from it "so Claude knows what each file contains and when to load it". Keep `SKILL.md` **under 500 lines**. [CC; BP]
- **Keep references one level deep** from `SKILL.md`. Nested references may only be partly read. Reference files over 100 lines should start with a table of contents. [BP]
- **Say whether to run or read a script.** "Execute the script (most common)" vs "Read it as reference". [BP, "Provide utility scripts"]
- **Scripts should solve, not defer**: handle errors explicitly and explain every constant (no "voodoo constants"). [BP, "Solve, don't defer"]
- **Plan-validate-execute**: for batch or destructive work, have Claude write a plan file, validate it with a script, then execute. [BP, "Create verifiable intermediate outputs"]
- **Dynamic context injection (Claude Code only):** a line `` !`git diff HEAD` `` runs before Claude sees the skill and is replaced by the output. Multi-line form: a fenced block opened with ` ```! `. Rules [CC, "Inject dynamic context"]:
  - A non-zero exit code **aborts the whole skill invocation** (`Shell command failed for pattern "..."`). Exit 1 from search/compare commands (like `grep`) is treated as normal. Append `|| true` to a check script that exits non-zero when it finds problems.
  - Injected commands never prompt. They must already be allowed (permission rules or the skill's `allowed-tools`), or the invocation aborts.
  - `"disableSkillShellExecution": true` replaces them with `[shell command execution disabled by policy]`.
  - Does not work in claude.ai or through the API.
- **Hooks for hard rules:** if Claude skips a rule that must hold every time, move it into a hook, optionally in the skill's own `hooks` frontmatter. [CC, "Claude stops following a skill"] (Links naturally to Part 6.)

### 1.8 Skills in the Agent SDK

[SDK]

- Skills are files on disk. There is **no programmatic API to register a skill** in the SDK (unlike sub-agents).
- Loaded from the filesystem setting sources: `settingSources` (TypeScript) / `setting_sources` (Python). Default `query()` options load user and project sources. If you set it explicitly, include `"project"` and/or `"user"`.
- The `skills` option: omit it (all discovered skills enabled), pass `"all"`, a list of names, or `[]`. Setting `skills` adds the `Skill` tool to `allowedTools` automatically. If you pass an explicit `tools` list, include `"Skill"`.
- The `system`/`init` message has a `skills` array (user-invocable skills) and a `slash_commands` array.
- Send `/<name>` in the prompt to dispatch a skill directly. This works even if the skill is not in the `skills` list.

```python
options = ClaudeAgentOptions(
    setting_sources=["user", "project"],
    skills="all",
    allowed_tools=["Read", "Write", "Bash"],
)
```

### 1.9 Skills on the Claude API (Skills API + code execution)

[API; OV; CET]

- Skills on the API **require the code execution tool**; skills run in its sandboxed container.
- In a Messages request, list skills in `container.skills`, each with `type` (`"anthropic"` or `"custom"`), `skill_id`, and optional `version`:

```json
"container": {
  "skills": [{ "type": "custom", "skill_id": "skill_01AbCd...", "version": "latest" }]
},
"tools": [{ "type": "code_execution_20250825", "name": "code_execution" }]
```

- Pre-built Anthropic skills: `pptx`, `xlsx`, `docx`, `pdf` (date versions such as `20251013`). These are **not** available in Claude Code. [OV]
- Custom skills are uploaded through `/v1/skills` (zip or individual files; the Python SDK has `files_from_dir`; the `ant` CLI has `ant apply <dir>`). Versions: `skver_...` IDs or `"latest"`. A new version is a **complete snapshot**, not a delta. [API]
- **Pin versions in production.** `latest` means anyone in the workspace who uploads a new version changes what production runs. [API, "Version management strategy"]
- Limits [API, "Limits and constraints"]: max **20 skills per request**; max upload **30 MB** (uncompressed); **no network access**; **no runtime package installation** (pre-installed packages only).
- **Scope:** API custom skills are shared **workspace-wide**. The workspace is the isolation boundary; use one workspace per tenant for multi-tenant products. [API]
- **Skills do not sync across surfaces.** Claude Code (filesystem), claude.ai (per user, zip upload) and the API (per workspace) are separate. [OV, "Cross-surface availability"] (Exception in Claude Code: a terminal session signed in with a claude.ai account now downloads that account's enabled skills into `~/.claude/skills/synced/`. [CC, "Skills synced from claude.ai"])
- Changing the skills list in `container` breaks prompt caching. [API]
- Agent Skills are **not covered by zero data retention** arrangements. [OV; API]
- Runtime differences [OV]: API = no network; claude.ai = varies with settings; **Claude Code = full network access**, same as any program on your machine.

### 1.10 Security

[OV, "Security considerations"; CC]

- Use skills only from trusted sources. "A malicious Skill can direct Claude to invoke tools or execute code in ways that don't match the Skill's stated purpose." Audit every file, including scripts and images. Treat it like installing software.
- **Workspace trust does not gate `allowed-tools`.** A project skill's `allowed-tools` applies even in a `-p` run in a folder you never trusted. Review `allowed-tools` in skills checked into any repository before running Claude Code there. Organisations can ignore them with `allowManagedPermissionRulesOnly`. [CC, "Pre-approve tools for a skill"]

### 1.11 Testing a skill

- Baseline comparison: run realistic prompts in fresh sessions with the skill on and off (`skillOverrides` `"off"`), and check separately (a) does it trigger and (b) is the output right. [CC, "Evaluate and iterate on a skill"]
- The `skill-creator` plugin automates this (`/plugin install skill-creator@claude-plugins-official`), including description tuning against should-trigger and should-not-trigger prompts. `claude plugin eval` does the same for skills shipped in plugins and can gate CI. [CC]
- [BP] says: build evaluations **before** writing lots of documentation; at least three evaluation scenarios; test with every model you plan to use.

## 2. Mapping the anonymised production notes to the docs

Use only the eight notes given. Do not add numbers. Each note lines up with a documented feature, which makes the "how I use this in production" section credible without revealing anything.

| Note | What we did                                                                                                                                                                                | Documented basis                                                                                                                                                                                                               |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1    | Each forecasting domain is one skill folder: instructions, a parameter file (defaults, allowed ranges, a reason for each), reference methodology, data and code                            | Supporting files [CC]; level 3 resources [OV]; "no voodoo constants" [BP]                                                                                                                                                      |
| 2    | Only the short description is always visible. Instructions open with non-negotiable rules (no fabrication, no mental maths, use the parameters, load the data) and an intent routing table | Progressive disclosure [OV]; compaction keeps only the start of a skill, so rules go first [CC]; one-level-deep references [BP]                                                                                                |
| 3    | A dependency map says which sections a question needs, so a narrow question runs one step, not the whole model                                                                             | "Claude reads only the files each task needs" [OV]; conditional workflow pattern [BP]                                                                                                                                          |
| 4    | A small CLI validates, versions and uploads skills, skipping any whose content hash has not changed                                                                                        | Skills API versions are full snapshots [API]; frontmatter validation rules [OV]. The hash-skip is our own tooling, not an Anthropic feature. Say so                                                                            |
| 5    | A machine-readable index of every skill's parameters, functions and datasets lets other agents cite where a value came from                                                                | Our own convention. No direct doc feature. Present it as a pattern                                                                                                                                                             |
| 6    | A report-first lookup checks pre-computed research and runs the skill only for the gaps                                                                                                    | Our own orchestration. Present it as a pattern                                                                                                                                                                                 |
| 7    | Moved from "run this script" skills to methodology-only skills with canonical reference implementations, for consistent results                                                            | [BP] distinguishes "execute the script" vs "read it as reference", and "degrees of freedom". Our move was towards a tighter methodology with a reference implementation Claude must match. Frame it as a trade-off, not a rule |
| 8    | A structured review of skill issues, with release gates, blocked external use until business-logic defects were fixed                                                                      | [BP] "Build evaluations first"; [CC] evaluation loop. Our gate was a review and release decision, not only an eval                                                                                                             |

Notes for the writer:

- Note 7 sits in tension with the example in section 3, which runs a script. That is fine and makes a good point: **scripts are best for deterministic checks** (pattern matching, validation, arithmetic); **methodology plus a canonical reference implementation** worked better for us when the same question had to give the same answer every time and the logic itself was the product. Present both; do not claim one is always right.
- Note 2 ("no mental maths") pairs well with the documented advice that scripts are "more reliable than generated code". [BP]
- Keep the domain generic: "forecasting models", "a sector model". Do not name sectors beyond what the approved facts list allows, and do not name tools, repos or the client.

## 3. Proposed working example: `database-migration-review`

**Why this example:** common for every backend team; easy to understand; has a real deterministic part (pattern checks) and a real judgement part (what to do instead). It is original and unrelated to the course's project and tools. PostgreSQL only, stated in the skill.

### 3.1 Folder layout

```text
.claude/skills/database-migration-review/
├── SKILL.md                    # description, rules, routing table
├── scripts/
│   └── scan_migration.py       # deterministic checks, prints JSON
└── reference/
    ├── adding.md               # columns, defaults, NOT NULL, constraints
    ├── breaking-changes.md     # rename, drop, type change (expand and contract)
    └── indexes.md              # CREATE/DROP INDEX CONCURRENTLY
```

How it maps to the docs:

- Description: third person, says what and when, includes the words people use ("migration", "ALTER TABLE", "index", "safe to deploy"). 276 characters, under the 1,024 limit. [BP; OV]
- `name`: lowercase and hyphens, under 64 characters, no reserved words. [OV]
- Frontmatter uses only `name`, `description`, `allowed-tools`, so the same folder would also upload to claude.ai or the API. [CC portability table] (On the API the script would still run, since it needs no network or extra packages.)
- Rules first (survive compaction), routing table points to one file per case, references one level deep. [CC; BP]
- `allowed-tools` uses `${CLAUDE_SKILL_DIR}` so the rule matches the command the body tells Claude to run. This is the documented pattern. [CC, "Available string substitutions"]
- The script exits 0 when the scan ran, 2 when it cannot read the file. If someone later moves it into a `` !`...` `` injection line, a non-zero exit would abort the skill, so 0-on-findings is the right design. [CC, "When an injected command fails"]

### 3.2 `SKILL.md`

```markdown
---
name: database-migration-review
description: Reviews PostgreSQL schema migrations for locking, table rewrites and changes that break running code. Use when the user asks to review, check or approve a migration, a .sql file under migrations/, an ALTER TABLE, a new index, or asks whether a schema change is safe to deploy.
allowed-tools: Bash(python3 ${CLAUDE_SKILL_DIR}/scripts/scan_migration.py *)
---

# Database migration review

## Rules (always apply)

1. Run the scanner first, as its own command, exactly as written. Do not judge lock or rewrite risk from memory:
   `python3 ${CLAUDE_SKILL_DIR}/scripts/scan_migration.py <file.sql>`
2. Report every scanner finding. Never drop one because the table "looks small".
3. Do not invent table sizes, row counts or timings. If size matters, ask.
4. For each finding, read only the reference file the routing table names.
5. Suggest a safer rewrite in SQL, not in prose.

## Route each finding

| Finding `case` | Kind of change                               | Read                            |
| -------------- | -------------------------------------------- | ------------------------------- |
| `add`          | New columns, defaults, NOT NULL, constraints | `reference/adding.md`           |
| `breaking`     | Rename, drop, change column type             | `reference/breaking-changes.md` |
| `index`        | Create or drop an index                      | `reference/indexes.md`          |
| `session`      | Missing `lock_timeout`                       | No file. Add `SET lock_timeout` |

## Output

A table with: line, statement (shortened), risk, safer version. End with one line: "Safe to deploy as written: yes/no".
```

### 3.3 `scripts/scan_migration.py`

Pattern-based on purpose: it finds candidates; the reference files explain them. Standard library only.

```python
#!/usr/bin/env python3
"""Flag risky statements in a PostgreSQL migration file.

Prints a JSON list of findings. Exit 0 when the scan ran (with or without
findings), 2 when the file cannot be read. Pattern-based on purpose: it
finds candidates, the reference files explain them.
"""
import json
import re
import sys

# (rule id, case, regex, message). Order does not matter.
RULES = [
    ("index-not-concurrent", "index",
     r"\bCREATE\s+(UNIQUE\s+)?INDEX\s+(?!CONCURRENTLY)",
     "CREATE INDEX without CONCURRENTLY blocks writes to the table while it builds."),
    ("drop-index-not-concurrent", "index",
     r"\bDROP\s+INDEX\s+(?!CONCURRENTLY)",
     "DROP INDEX without CONCURRENTLY takes an ACCESS EXCLUSIVE lock on the table."),
    ("add-column-not-null-no-default", "add",
     r"\bADD\s+(COLUMN\s+)?\w+\s+[\w\(\), ]+?\bNOT\s+NULL\b(?![^;]*\bDEFAULT\b)",
     "ADD COLUMN ... NOT NULL without DEFAULT fails if the table has rows."),
    ("add-column-volatile-default", "add",
     r"\bADD\s+(COLUMN\s+)?[^;]*\bDEFAULT\s+(random|gen_random_uuid|clock_timestamp)\s*\(",
     "A volatile DEFAULT rewrites the whole table."),
    ("set-not-null", "add",
     r"\bALTER\s+COLUMN\s+\w+\s+SET\s+NOT\s+NULL\b",
     "SET NOT NULL scans the table under an ACCESS EXCLUSIVE lock."),
    ("constraint-not-valid-missing", "add",
     r"\bADD\s+CONSTRAINT\s+\w+\s+(FOREIGN\s+KEY|CHECK)\b(?![^;]*\bNOT\s+VALID\b)",
     "Adding a FOREIGN KEY or CHECK without NOT VALID checks every row while holding a lock."),
    ("column-type-change", "breaking",
     r"\bALTER\s+COLUMN\s+\w+\s+(SET\s+DATA\s+)?TYPE\b",
     "Changing a column type usually rewrites the table and can break readers."),
    ("rename", "breaking",
     r"\bRENAME\s+(COLUMN\s+)?\w+\s+TO\b|\bALTER\s+TABLE\s+\w+\s+RENAME\s+TO\b",
     "Renaming breaks any running code that still uses the old name."),
    ("drop-column-or-table", "breaking",
     r"\bDROP\s+(COLUMN|TABLE)\b",
     "Dropping breaks any running code that still reads it, and cannot be undone."),
]


def scan(sql: str) -> list[dict]:
    findings = []
    # Strip line comments so commented-out SQL is not flagged.
    clean = re.sub(r"--[^\n]*", "", sql)
    for rule_id, case, pattern, message in RULES:
        for m in re.finditer(pattern, clean, flags=re.IGNORECASE):
            line = clean.count("\n", 0, m.start()) + 1
            end = clean.find(";", m.start())
            stmt_start = clean.rfind(";", 0, m.start()) + 1
            statement = " ".join(clean[stmt_start:end if end != -1 else None].split())
            findings.append({"line": line, "rule": rule_id, "case": case,
                             "message": message, "statement": statement[:120]})
    if re.search(r"\b(ALTER|CREATE|DROP)\b", clean, re.IGNORECASE) and not re.search(
            r"\bSET\s+(LOCAL\s+)?lock_timeout\b", clean, re.IGNORECASE):
        findings.append({"line": 1, "rule": "no-lock-timeout", "case": "session",
                         "message": "No lock_timeout: a blocked ALTER queues every query behind it.",
                         "statement": ""})
    return sorted(findings, key=lambda f: f["line"])


def main() -> int:
    if len(sys.argv) != 2:
        print("usage: scan_migration.py <migration.sql>", file=sys.stderr)
        return 2
    try:
        with open(sys.argv[1], encoding="utf-8") as fh:
            sql = fh.read()
    except OSError as err:
        print(f"cannot read {sys.argv[1]}: {err}", file=sys.stderr)
        return 2
    print(json.dumps(scan(sql), indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

### 3.4 `reference/adding.md`

````markdown
# Adding columns and constraints (PostgreSQL 12+)

## New column with NOT NULL

A `NOT NULL` column with no default fails on a table that has rows. Since PostgreSQL 11, a column with a constant (non-volatile) default is added without rewriting the table:

```sql
ALTER TABLE orders ADD COLUMN status text NOT NULL DEFAULT 'pending';
```

A volatile default such as `gen_random_uuid()` or `clock_timestamp()` still rewrites every row. Add the column as nullable, backfill in batches, then enforce NOT NULL.

## Making an existing column NOT NULL

`SET NOT NULL` scans the whole table under an ACCESS EXCLUSIVE lock. Prove the rule first with a constraint that is validated under a weaker lock. Since PostgreSQL 12, `SET NOT NULL` then skips the scan:

```sql
ALTER TABLE orders ADD CONSTRAINT orders_status_nn CHECK (status IS NOT NULL) NOT VALID;
ALTER TABLE orders VALIDATE CONSTRAINT orders_status_nn;
ALTER TABLE orders ALTER COLUMN status SET NOT NULL;
ALTER TABLE orders DROP CONSTRAINT orders_status_nn;
```

## Foreign keys and CHECK constraints

Add them `NOT VALID`, then `VALIDATE CONSTRAINT` in a separate statement. Validation takes a SHARE UPDATE EXCLUSIVE lock, so normal reads and writes continue.
````

### 3.5 `reference/breaking-changes.md` and `reference/indexes.md`

```markdown
# Renames, drops and type changes

These are fast or slow in the database, but all of them can break application code that is still running the old version during a deploy.

Use expand and contract:

1. **Expand.** Add the new column or table. Deploy code that writes to both old and new.
2. **Migrate.** Backfill the new column in batches.
3. **Switch.** Deploy code that reads only the new column.
4. **Contract.** Drop the old column in a later release.

Notes:

- `RENAME COLUMN` is instant in the database. The risk is entirely in the code.
- `DROP COLUMN` is instant but cannot be undone without a backup. Remove all code reads first.
- `ALTER COLUMN ... TYPE` rewrites the table under an ACCESS EXCLUSIVE lock in most cases. Some changes avoid the rewrite, for example `varchar(50)` to `varchar(100)` or to `text`. If unsure, treat it as a rewrite and use expand and contract.
```

````markdown
# Indexes

`CREATE INDEX` blocks inserts, updates and deletes on the table until the build finishes. Use:

```sql
CREATE INDEX CONCURRENTLY orders_customer_id_idx ON orders (customer_id);
```

Rules for `CONCURRENTLY`:

- It cannot run inside a transaction block. Many migration tools wrap each file in a transaction, so put the statement in its own non-transactional migration.
- If it fails, it leaves an INVALID index behind. Drop it with `DROP INDEX CONCURRENTLY` and retry.
- It takes longer than a normal build, because it scans the table twice.

Drop indexes with `DROP INDEX CONCURRENTLY` for the same reason.
````

PostgreSQL facts in the reference files were checked against the current (v18) PostgreSQL docs:

- Non-volatile `DEFAULT` is stored in metadata (no rewrite); volatile `DEFAULT` such as `clock_timestamp()` rewrites the table and its indexes. https://www.postgresql.org/docs/current/sql-altertable.html
- `SET NOT NULL` skips the full scan "if a valid CHECK constraint exists ... which proves no NULL can exist". Same page.
- `VALIDATE CONSTRAINT` "acquires only a SHARE UPDATE EXCLUSIVE lock". `ADD FOREIGN KEY` takes SHARE ROW EXCLUSIVE on both tables. Same page.
- Type change "will normally cause the entire table and its indexes to be rewritten", except binary-coercible changes. Same page.
- Plain `CREATE INDEX` blocks inserts, updates and deletes but not reads; `CONCURRENTLY` does two scans, cannot run in a transaction block, and leaves an "invalid" index on failure (drop and retry). https://www.postgresql.org/docs/current/sql-createindex.html
- The "since PostgreSQL 11" (fast default) and "since PostgreSQL 12" (NOT NULL scan skip) version notes come from those releases' notes. If the evaluator wants to be strict, drop the version numbers and say "in current PostgreSQL".

### 3.6 Test migration used

`migrations/0042_order_status.sql`:

```sql
-- Add order status and speed up customer lookups
ALTER TABLE orders ADD COLUMN status text NOT NULL;
CREATE INDEX orders_customer_id_idx ON orders (customer_id);
ALTER TABLE orders RENAME COLUMN total TO total_amount;
ALTER TABLE orders ADD CONSTRAINT orders_customer_fk FOREIGN KEY (customer_id) REFERENCES customers (id);
```

Scanner output (abridged): five findings, `no-lock-timeout` (line 1, `session`), `add-column-not-null-no-default` (line 2, `add`), `index-not-concurrent` (line 3, `index`), `rename` (line 4, `breaking`), `constraint-not-valid-missing` (line 5, `add`). Exit code 0.

A second file with the safe forms (`SET lock_timeout`, `DEFAULT 'pending'`, `CONCURRENTLY`, `NOT VALID`, a commented-out `DROP TABLE`) produced no findings for those lines. It still correctly flagged an `ALTER COLUMN ... TYPE` and a `DEFAULT gen_random_uuid()`. A missing file printed `cannot read ...` to stderr and exited 2.

### 3.7 Live test results (Claude Code v2.1.289, `claude -p`)

| Run                                                                                     | How invoked                                                   | Did the skill load?                                                                               | Did the script run without a prompt?                                                                                                                                                              |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Model-invoked, no `Skill` permission                                                    | Prompt: "Is migrations/0042_order_status.sql safe to deploy?" | Claude chose the skill, but the `Skill` tool call was refused in `-p` mode (no one to approve it) | n/a. Claude reviewed by hand                                                                                                                                                                      |
| Model-invoked, `--allowedTools "Skill"`, documented `${CLAUDE_SKILL_DIR}` rule (5 runs) | Natural-language prompt                                       | **Yes, every time.** Claude picked the right skill from its description                           | **Mostly no.** Blocked ("This command requires approval") in 4 of 5 runs. In the one that worked, Claude's first attempt chained `; echo` and was blocked, and its second, standalone attempt ran |
| Same, with a broader `Bash(python3 *)` rule (2 runs)                                    | Natural-language prompt                                       | Yes                                                                                               | No, blocked both times                                                                                                                                                                            |
| User-invoked (2 runs)                                                                   | `/database-migration-review migrations/0042_order_status.sql` | Yes                                                                                               | **Yes, both times** (once after a first chained attempt was blocked). The scanner ran, then Claude read only the reference files the findings pointed to, and produced the table                  |

A project `.claude/settings.json` allow rule, tried in an untrusted temporary folder, was inconclusive (even the `Skill` call was refused). It is not verified, so do not present it as a tested fix.

What the writer should take from this:

1. **Triggering from the description works.** Every natural-language prompt about the migration picked this skill. Good evidence for the "description is the trigger" section.
2. **The routing table works.** Claude ran the scanner, then opened the reference files the findings named.
3. **Do not promise that `allowed-tools` removes every prompt.** In my tests it did so reliably when _I_ invoked the skill with `/name`, but not when Claude invoked it on its own in `-p` mode. I could not pin down why, and I did not test interactive mode. Safe wording: "`allowed-tools` pre-approves the listed tools for the turn that invokes the skill. If Claude still asks, approve it, or add a permission rule." Recommend explicit `/database-migration-review <file>` in the walkthrough.
4. **Tell Claude to run the command exactly as written and on its own.** When Claude rewrote it as a relative path or chained `; echo`, it no longer matched the rule. Rule 1 in the skill says this now.
5. **Even when the script was blocked, the rules held.** Claude said it could not run the scanner, said what it did instead, and offered the exact command. That is "no fabrication" in action, and a nice small story for the article.

## 4. Pitfalls worth a section

- **Vague description**, so the skill never triggers or triggers on everything. [BP; CC]
- **Unknown frontmatter keys are silently ignored** in Claude Code (e.g. `allowed_tools` with an underscore). The same keys are a **hard error** on claude.ai/API upload. [CC]
- **Rules buried at the bottom.** After compaction only the first 5,000 tokens of a skill are kept. [CC]
- **Giant `SKILL.md`.** Keep it under 500 lines; move detail to reference files. [CC; BP]
- **References that point to references.** Keep them one level deep. [BP]
- **Side-effect skills Claude can trigger itself.** Use `disable-model-invocation: true` for deploys, commits, messages. [CC]
- **Injected command exits non-zero** and silently kills the whole skill. Use `|| true` or exit 0 on findings. [CC]
- **Trusting third-party skills.** They run code with your permissions; `allowed-tools` is not gated by workspace trust. [OV; CC]
- **Assuming skills sync.** Claude Code, claude.ai and the API are separate stores (apart from claude.ai account sync into Claude Code). [OV; CC]
- **`latest` in production on the API.** Pin a version. [API]
- **Too many skills.** Every description costs context on every turn; the listing budget is 1% of the context window. `/skill-doctor` finds unused ones. [CC]

## 5. Checklist candidates (for the end of the article)

- Description in the third person, says what and when, uses the words people actually type.
- Non-negotiable rules at the top of `SKILL.md`.
- One routing table, one reference file per case, one level deep.
- Deterministic work in a script; the script handles its own errors and exits 0 when it ran.
- `${CLAUDE_SKILL_DIR}` in both the body and `allowed-tools`.
- Side effects behind `disable-model-invocation: true`.
- Only portable frontmatter fields if the skill may go to claude.ai or the API.
- Tested with the skill on and off, in a fresh session, with at least three realistic prompts.
- Reviewed like code: project skills go through pull requests.

## 6. Do not say

- That skills are "loaded into the system prompt" in full. Only name and description are; the body loads on use.
- That `allowed-tools` **restricts** tools. It pre-approves; use `disallowed-tools` or permission rules to restrict. [CC]
- That `name` is required in Claude Code. It is optional there (defaults to the folder name) but required on claude.ai/API.
- That the Skills API needs a beta header. Not any more (still accepted). [API]
- That pre-built `pptx`/`xlsx`/`docx`/`pdf` skills work in Claude Code. They do not. [OV]
- That skills on the API can call the internet or `pip install`. They cannot. [API]
- Any numbers about the production work beyond the approved public facts.
- Anything about the course's project, auth provider, database MCP or local-model walkthrough.

## 7. Example file locations (tested copy)

(a local scratch copy, not included in this repo) (scratchpad; the full text of every file is in section 3 above, so the writer does not need the folder).

## Editor's notes (2026-10-04)

- **Opening:** led with the "confident number worked out in its head" story as the hook, then the CLAUDE.md growth problem. Removed the repeated "packages the method as a folder" line.
- **Headings:** "The idea" is now "The idea: a folder the agent opens when needed"; "The mental model: a field manual, not a textbook" shortened to "The mental model: a field manual". Template order unchanged: hook, idea, working example, production, pitfalls, checklist, further reading.
- **Jargon:** defined "compacts" inline (summarises a long session to free up space).
- **Filler:** tightened sentences across the idea, example and production sections. Prose (outside code blocks) went from about 2,390 to about 2,300 words. No claims or numbers added; production section still uses only the approved public facts.
- **Accuracy:** "separate stores" in the sync pitfall now says "mostly separate", noting the documented exception (a terminal session signed in to a claude.ai account picks up that account's enabled skills), per section 1.9.
- **Code:** all code blocks unchanged. Re-ran the scanner from the article on the sample migration: five findings as stated, exit 0.
- **Links:** all six point to official Anthropic docs (code.claude.com, platform.claude.com).
- **Sidecar:** simplified the `summary` wording for junior readers ("description" instead of "label", plainer last sentence). Other fields unchanged.
- **Checks:** confidentiality blocklist scan of article and sidecar returned no matches. No JSX or import/export lines in the body.
