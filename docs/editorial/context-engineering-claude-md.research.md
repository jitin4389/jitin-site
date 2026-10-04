# Research: Part 1, "Context engineering: CLAUDE.md, docs and the context window"

Researcher notes for the writer. Checked on 2026-10-04 against the current official Claude Code docs (now served at `code.claude.com/docs/en/...`; the old `docs.claude.com` / `docs.anthropic.com` Claude Code URLs redirect there) and Claude Code v2.1.289 installed locally.

Rule for the writer: if a detail is not in this file, say less rather than guess. Version numbers below are given only so the evaluator can check them; the article does not need them.

## 1. Key facts in one screen

- Every session starts with a fresh context window. Two things carry knowledge across sessions: **CLAUDE.md files** (you write them) and **auto memory** (Claude writes it). [memory]
- CLAUDE.md is **context, not enforced configuration**. To block an action whatever Claude decides, use a hook (PreToolUse) or permission settings. [memory]
- CLAUDE.md content is delivered **as a user message after the system prompt**, not as part of the system prompt. No guarantee of strict compliance. [memory, troubleshooting section]
- Target **under 200 lines per CLAUDE.md**. Longer files use more context and reduce adherence. A file over **4 MiB is skipped**. [memory]
- `@path` imports help organisation but **do not reduce context cost**: imported files load at launch too. [memory]
- Files are **concatenated, not overridden**. If two instructions conflict, "Claude may pick one arbitrarily". [memory]
- The `#` quick-memory shortcut **was removed** (changelog v2.0.70: "Removed # shortcut for quick memory entry (tell Claude to edit your CLAUDE.md instead)"). Do not teach it.

Sources:

- [memory] https://code.claude.com/docs/en/memory
- [ctx] https://code.claude.com/docs/en/context-window
- [cmds] https://code.claude.com/docs/en/commands
- [how] https://code.claude.com/docs/en/how-claude-code-works
- [subs] https://code.claude.com/docs/en/sub-agents
- [wf] https://code.claude.com/docs/en/common-workflows
- [cache] https://code.claude.com/docs/en/prompt-caching
- [costs] https://code.claude.com/docs/en/costs
- [model] https://code.claude.com/docs/en/model-config
- [im] https://code.claude.com/docs/en/interactive-mode
- [log] https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md

## 2. CLAUDE.md locations and scope [memory]

Listed in load order, broadest first. Later content appears later in context.

| Scope          | Location                                                                                                                                           | Shared with                         |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| Managed policy | macOS `/Library/Application Support/ClaudeCode/CLAUDE.md`; Linux/WSL `/etc/claude-code/CLAUDE.md`; Windows `C:\Program Files\ClaudeCode\CLAUDE.md` | Everyone on the machine (set by IT) |
| User           | `~/.claude/CLAUDE.md`                                                                                                                              | Just you, all projects              |
| Project        | `./CLAUDE.md` or `./.claude/CLAUDE.md`                                                                                                             | Team, via git                       |
| Local          | `./CLAUDE.local.md` (add to `.gitignore` yourself)                                                                                                 | Just you, this project              |

Extra facts:

- `CLAUDE.local.md` is **current, not deprecated**. It "loads alongside CLAUDE.md and is treated the same way". It only exists in the worktree where you created it; to share personal notes across worktrees, import a file from your home directory, e.g. `@~/.claude/my-project-instructions.md`.
- Managed content can also be set with the `claudeMd` key in `managed-settings.json` (honoured only in managed/policy settings). Managed CLAUDE.md cannot be excluded.
- Rules files: `.claude/rules/*.md` (discovered recursively) and user-level `~/.claude/rules/`. User rules load before project rules. Neither overrides the other.

## 3. How loading works [memory]

- **Upwards at launch:** Claude Code loads `CLAUDE.md` and `CLAUDE.local.md` from the working directory and **every directory above it**. Example: run in `foo/bar/` and it loads `foo/CLAUDE.md` then `foo/bar/CLAUDE.md`.
- **Order:** from filesystem root down to the working directory, so the file closest to where you launched is read last. Within a directory, `CLAUDE.local.md` comes after `CLAUDE.md`.
- **Downwards on demand:** `CLAUDE.md` files in subdirectories are **not** loaded at launch. They load when Claude reads files in that subdirectory.
- **HTML comments** (block-level `<!-- ... -->`) are stripped before injection, so you can leave notes for humans at no token cost. Comments inside code blocks are kept.
- **`--add-dir`** gives access to extra directories but does **not** load their CLAUDE.md unless `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD=1` is set.
- **`claudeMdExcludes`** (any settings layer; arrays merge) skips specific CLAUDE.md or rules files by absolute-path glob. Useful in monorepos:

```json
{
  "claudeMdExcludes": [
    "**/monorepo/CLAUDE.md",
    "/home/user/monorepo/other-team/.claude/rules/**"
  ]
}
```

- **AGENTS.md** (new in recent versions, v2.1.277+): Claude Code reads `AGENTS.md` by default **only when there is no `CLAUDE.md`, `.claude/CLAUDE.md` or `CLAUDE.local.md`** in the working directory or above. `/config` → **Project instructions** changes this (`claude-md-or-agents-md` default, `claude-md-and-agents-md`, `claude-md`, `managed-only`). A `CLAUDE.md` that contains `@AGENTS.md` still works and never double-loads. Worth one sentence in the article for teams that share files with other coding agents.

## 4. Imports with `@path` [memory]

- Syntax: `@path/to/file` anywhere in a CLAUDE.md, e.g. `- git workflow @docs/git-instructions.md`.
- Relative **and** absolute paths allowed. **Relative paths resolve from the file that contains the import**, not the working directory. (So a file at `.claude/CLAUDE.md` would need `@../docs/x.md` to reach `docs/x.md` at the repo root.)
- Imports can nest, **maximum depth four hops**.
- Paths with spaces: escape each space with a backslash (`@Design\ Docs/api-conventions.md`). A quoted path is not imported at all.
- Import parsing **skips code spans and fenced code blocks**. Writing `` `@README` `` keeps it literal. Important for the article: an import written inside backticks in a real CLAUDE.md will silently not load.
- **External imports** (path outside the working directory) in a project memory file trigger a one-time approval dialog. Declining disables them and the dialog does not reappear. User-scope files (`~/.claude/CLAUDE.md`, `~/.claude/rules/`) load their imports without the dialog (except in Cowork desktop sessions).
- Imported files load at launch, so **imports do not save context**. To save context, use path-scoped rules or skills (section 6).

## 5. Commands and shortcuts

| Command                         | What it does (current docs)                                                                                                                                                                                                                                                                                                                                  | Source           |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------- |
| `/init`                         | Generates a starting CLAUDE.md from the codebase. If one exists, suggests improvements rather than overwriting. Also reads Cursor rules (`.cursor/rules/`, `.cursorrules`) and Copilot rules (`.github/copilot-instructions.md`). Set `CLAUDE_CODE_NEW_INIT=1` for an interactive multi-phase flow that also offers skills, hooks and personal memory files. | [memory], [cmds] |
| `/memory`                       | Lists CLAUDE.md, CLAUDE.local.md and other memory locations (user and project, including ones not yet created); opens a file in your editor; toggles auto memory; opens the auto memory folder.                                                                                                                                                              | [memory]         |
| `/context [all]`                | Coloured grid of current context usage, optimisation suggestions, and a **Memory files** list showing which CLAUDE.md and rules files loaded. The way to confirm your file actually loaded.                                                                                                                                                                  | [cmds], [memory] |
| `/compact [instructions]`       | Summarises the conversation to free space. Optional focus, e.g. `/compact focus on the auth bug fix`.                                                                                                                                                                                                                                                        | [cmds], [ctx]    |
| `/clear [name]`                 | New conversation with empty context. Aliases `/reset`, `/new`. Previous conversation is recoverable with `/resume`.                                                                                                                                                                                                                                          | [cmds]           |
| `/autocompact [auto\|<tokens>]` | Sets how full the window gets before auto-compaction, e.g. `/autocompact 500k`. Newer command (v2.1.221+).                                                                                                                                                                                                                                                   | [cmds]           |
| `/rewind`                       | Can summarise from or up to a selected message (partial compaction).                                                                                                                                                                                                                                                                                         | [ctx]            |
| `/btw [question]`               | Side question answered from current context; question and answer never enter the conversation history; no tool access.                                                                                                                                                                                                                                       | [im]             |
| `/doctor prompt-audit [path]`   | New: audits CLAUDE.md, CLAUDE.local.md, AGENTS.md, rules, skills, etc. for outdated or conflicting instructions; proposes edits, changes nothing until you ask (v2.1.283+). `/doctor` also proposes trims for a checked-in CLAUDE.md.                                                                                                                        | [memory], [cmds] |
| `@` in a prompt                 | File path mention with autocomplete. `@src/utils/auth.js` includes the full file; `@src/components` gives a listing, not contents; `@server:resource` pulls an MCP resource. **An @ file reference also adds the CLAUDE.md files in that file's directory and its parents.**                                                                                 | [wf], [im]       |
| `#` at start of message         | **Removed** in v2.0.70. Ask Claude "add this to CLAUDE.md" or edit via `/memory`.                                                                                                                                                                                                                                                                            | [log], [memory]  |

Note on "remember this": asking Claude to "remember" something (e.g. "always use pnpm, not npm") now saves to **auto memory**, not CLAUDE.md. To change CLAUDE.md, say "add this to CLAUDE.md". [memory]

## 6. Ways to keep always-on context small

| Mechanism                               | When it loads                                                                                                                                        | Source       |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| CLAUDE.md (+ its imports)               | Every session, at launch                                                                                                                             | [memory]     |
| Unscoped `.claude/rules/*.md`           | At launch, same priority as `.claude/CLAUDE.md`                                                                                                      | [memory]     |
| Path-scoped rule (`paths:` frontmatter) | Only when Claude uses Read, Write or Edit on a matching file                                                                                         | [memory]     |
| Nested CLAUDE.md in a subdirectory      | When Claude reads files there                                                                                                                        | [memory]     |
| Skills                                  | Only a one-line description at start; full body loads when used. Skills with `disable-model-invocation: true` cost nothing until invoked by `/name`. | [ctx]        |
| MCP tools                               | Names only by default; full schemas deferred via tool search                                                                                         | [ctx], [how] |

Path-scoped rule shape (`paths` is the only frontmatter field read; YAML list or comma-separated string; brace expansion allowed):

```markdown
---
paths:
  - "src/api/**/*.ts"
---

# API Development Rules

- All API endpoints must include input validation
```

Docs guidance on what belongs in CLAUDE.md: facts Claude needs every session (build commands, conventions, layout, "always do X"). Multi-step procedures or rules for one part of the codebase go in a skill or a path-scoped rule. Add to CLAUDE.md when Claude makes the same mistake twice, a review catches something it should have known, or you retype the same correction. Write verifiable instructions ("Run `npm test` before committing", not "Test your changes"). [memory]

## 7. Context window and compaction

- **Auto-compaction:** Claude Code manages context as you approach the limit. It "clears older tool outputs first, then summarizes the conversation if needed". Requests and key code snippets are kept; "detailed instructions from early in the conversation may be lost". Put persistent rules in CLAUDE.md. [how]
- **Threshold** depends on model and setup. Default: compacts when the conversation reaches the model's context limit; models with a native 1M window compact at about 967K tokens by default; 200K-window models at the 200K boundary. Writer: keep this general ("when you approach the limit") rather than quoting numbers that vary by model. [model]
- **Thrashing guard:** if one huge file or tool output refills context right after each summary, Claude Code stops auto-compacting after a few attempts and shows an error. [how]
- **Steering the summary:** add a "Compact Instructions" section to CLAUDE.md, or run `/compact` with a focus. Example from the docs [costs]:

```markdown
# Compact instructions

When you are using compact, please focus on test output and code changes
```

**What survives compaction** [ctx]:

| Content                                   | After compaction                                                                                                 |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Project-root CLAUDE.md and unscoped rules | Re-injected from disk                                                                                            |
| Auto memory                               | Re-injected from disk                                                                                            |
| Path-scoped rules, nested CLAUDE.md       | Summarised away; reload when Claude next reads a matching file                                                   |
| Files Claude read or edited               | Up to five re-read, most recently modified first; files over 5,000 tokens come back as a path reference only     |
| Invoked skill bodies                      | Re-injected, capped at 5,000 tokens per skill and 25,000 total; oldest dropped first; truncation keeps the start |
| Instructions given only in chat           | Summarised; may be lost                                                                                          |

Practical lesson from the docs: if a rule must survive compaction, put it in the project-root CLAUDE.md (or drop `paths:`), not in chat.

**Editing CLAUDE.md mid-session** [cache]: project-root and user CLAUDE.md are read once at session start and held in memory. An edit mid-session **does not apply** until `/clear`, `/compact` or a restart. (It also does not invalidate the cache.) Nested CLAUDE.md and path-scoped rules that have not loaded yet will pick up edits.

**Prompt caching** [cache]: Claude Code orders each request so stable content comes first: system prompt, then project context (CLAUDE.md, auto memory, unscoped rules), then the conversation. Caching matches on an exact prefix, so a change early in the request recomputes everything after it. Switching model, changing effort on most models, connecting/removing an MCP server and compacting can cause a slower uncached turn. This maps neatly to production note (2) below.

**Other tips from the docs:** `/clear` between unrelated tasks; delegate large reads to a sub-agent; be specific in prompts so Claude reads fewer files ("File reads dominate context usage"). [ctx], [costs]

## 8. Auto memory (brief; the article should mention it, not dwell) [memory]

- On by default in local sessions. Toggle in `/memory` (saves `autoMemoryEnabled` in `~/.claude/settings.json`), per project with `"autoMemoryEnabled": false`, or env `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1`.
- Stored at `~/.claude/projects/<project>/memory/` with a `MEMORY.md` index plus topic files. Shared across worktrees of one git repo. Machine-local.
- First **200 lines or 25KB** of `MEMORY.md` (whichever first) loads each session. Topic files are read on demand.
- Types recorded in frontmatter: `user`, `feedback`, `project`, `reference`.
- Location override: `autoMemoryDirectory` (absolute path or `~/`).

## 9. Sub-agents and context [subs], [ctx]

- Each sub-agent starts with a **fresh, isolated context window**. It does not see your conversation history, skills you already invoked, or files already read. Exception: a **fork**, which inherits the parent conversation.
- Its starting context: its own system prompt (not the Claude Code system prompt), the **task message Claude writes when delegating**, the CLAUDE.md hierarchy (user, project, rules, local, managed), a git status snapshot, and any skills named in its `skills` field.
- Built-in **Explore** and **Plan** skip CLAUDE.md and git status to stay fast and cheap. A custom sub-agent can skip user/project/local CLAUDE.md with `omitClaudeMd: true`.
- The main session's auto memory is **not** loaded into sub-agents (except forks). A sub-agent can have its own memory via the `memory` frontmatter field.
- **Only the sub-agent's final text response comes back** to your context (plus a small metadata trailer). Its file reads stay in its own window. This is the context saving.
- Docs advice: if a rule must reach the sub-agent (their example: "ignore the `vendor/` directory"), restate it in the delegation prompt.

This is the hook for production note (6): the handover message is the only bridge in both directions.

## 10. Recently changed or deprecated (do not get caught out)

- `#` quick-memory shortcut: **removed** (v2.0.70).
- "Remember X" now goes to **auto memory**, not CLAUDE.md.
- **AGENTS.md** read natively when no CLAUDE.md exists (v2.1.277+); `/config` → Project instructions.
- `/doctor prompt-audit` for instruction-file audits (v2.1.283+); `/doctor` trims checked-in CLAUDE.md.
- `/autocompact` command (v2.1.221+).
- Docs moved to `code.claude.com/docs/en/...`. Link there.
- Older articles describe CLAUDE.local.md as deprecated. The current docs present it as a normal, supported option. Treat it as current.

## 11. Proposed working example: a layered CLAUDE.md for a small Python service

Original example; nothing from the course. A small Python 3.12 service, `reminders-service`, that schedules appointment reminders and sends them by email or SMS.

Layout:

```text
reminders-service/
├── CLAUDE.md
├── CLAUDE.local.md        # optional, gitignored, personal
└── docs/
    ├── architecture.md
    └── testing.md
```

`CLAUDE.md` (about 40 lines):

```markdown
# reminders-service

A small Python 3.12 web service that schedules appointment reminders and sends them by email or SMS.

## Commands

- Install: `uv sync`
- Run locally: `uv run uvicorn reminders.app:app --reload`
- Test: `uv run pytest -q`
- Lint and format: `uv run ruff check --fix . && uv run ruff format .`
- Type check: `uv run mypy src`

## Conventions

- Code lives in `src/reminders/`; tests mirror it under `tests/`.
- Type hints on every public function.
- Store and compare times as timezone-aware UTC. Convert to local time only when rendering a message.
- Ask before adding a dependency.

## Instruction hierarchy

If two instructions conflict, follow the higher one and tell me about the conflict:

1. What I ask in the current conversation
2. This file
3. The docs imported below
4. Your general defaults

## When unsure

- If a requirement is ambiguous, ask one question before writing code.
- Don't guess commands. Check `pyproject.toml`, or ask.
- Don't do date, time-zone or money arithmetic in your head. Write a test or run code.

## Reference docs

- Architecture and module boundaries: @docs/architecture.md
- How we test: @docs/testing.md

## Compact instructions

When compacting, keep failing test names, files changed and open decisions.
```

`docs/architecture.md`:

```markdown
# Architecture

- `api/` receives HTTP requests and validates input. It never sends messages directly.
- `scheduler/` decides when a reminder is due. Pure functions; it takes the current time as an argument.
- `channels/` sends email and SMS. One module per provider, behind the `Channel` protocol.
- `store/` is the only package that talks to the database.

Dependencies point inwards: `api` -> `scheduler` -> `store`. `channels` is called only by `scheduler/dispatch.py`.
```

`docs/testing.md`:

```markdown
# Testing

- Run one test: `uv run pytest tests/scheduler/test_due.py::test_due_at_boundary -q`
- Tests never touch the network. Use the `fake_channel` fixture from `tests/conftest.py`.
- Tests never call the real clock. Pass a fixed `now` into scheduler functions.
- Every bug fix starts with a failing test that reproduces it.
```

### Verification against the docs

| Claim the example relies on                                                                  | Status                                                                                                                                                                                                                                                                                            | Source         |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| `./CLAUDE.md` at repo root is a project memory file loaded every session                     | Correct                                                                                                                                                                                                                                                                                           | [memory]       |
| `@docs/architecture.md` resolves relative to the CLAUDE.md that contains it (repo root here) | Correct. If the writer moves the file to `.claude/CLAUDE.md`, the imports must become `@../docs/...`                                                                                                                                                                                              | [memory]       |
| Imports are written outside backticks so they load                                           | Correct. Wrapping them in backticks would stop them loading                                                                                                                                                                                                                                       | [memory]       |
| Imported docs are counted in context at launch                                               | Correct, so the article must not claim imports "save tokens"                                                                                                                                                                                                                                      | [memory]       |
| Under 200 lines                                                                              | Yes, about 40 lines including imports                                                                                                                                                                                                                                                             | [memory]       |
| "Compact instructions" section steers compaction                                             | Documented ([how], [costs])                                                                                                                                                                                                                                                                       | [how], [costs] |
| The "Instruction hierarchy" section is enforced                                              | **No.** It is guidance written in the file. Claude Code itself concatenates files and does not rank them; conflicts "may" be resolved arbitrarily. The article should present the hierarchy as a way to reduce ambiguity, not as a guarantee. Hard rules belong in hooks or permissions (Part 6). | [memory]       |
| `/context` shows the files under **Memory files**                                            | Correct; this is the check to show readers                                                                                                                                                                                                                                                        | [memory]       |

**Live check (done):** I created these three files in a scratch git repo and ran Claude Code v2.1.289 headless with all tools disabled (`claude -p "..." --tools ""`). Without reading any files, it correctly answered "which fixture replaces the network" (`fake_channel`, from `docs/testing.md`) and "which package talks to the database" (`store/`, from `docs/architecture.md`), and listed both docs as loaded through the root CLAUDE.md's `@` imports. So the imports load at launch as documented.

### Optional variation for the article (saves context)

To show the difference between imports and on-demand loading, move testing guidance into a path-scoped rule so it loads only when Claude touches tests:

```markdown
---
paths:
  - "tests/**/*.py"
---

# Testing rules

- Tests never touch the network. Use the `fake_channel` fixture.
- Tests never call the real clock. Pass a fixed `now`.
```

Saved as `.claude/rules/testing.md`. Caveat to state: path-scoped rules are summarised away by compaction and reload only when a matching file is read again.

Suggested reader exercise: run `/context`, check **Memory files**, then ask a question only the imported doc can answer.

## 12. Anonymised production notes, mapped to doc features

Use only the notes as given; no extra numbers. The client may be described only as "a global hedge fund with ~$1B AUM"; other allowed facts: "12+ sector forecasting models", "15+ person team".

| Production note                                                                                                                                             | Doc feature it illustrates                                                          | Suggested angle                                                                                                    |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| (1) Layered prompts: agent instructions, shared terminology rules, explicit instruction hierarchy where a domain skill outranks general guidance            | CLAUDE.md layers (user/project/local) + rules + the in-file "Instruction hierarchy" | Claude Code concatenates layers and does not rank them. Writing the ranking down is what removed ambiguity for us. |
| (2) Large static prompt part cached, small time-sensitive part (date, session facts) not                                                                    | Prompt caching: stable content first, exact-prefix match                            | Keep CLAUDE.md stable. Do not put dates or "current sprint" details in it; edits mid-session do not apply anyway.  |
| (3) Methodology packaged so only a short description is always visible; detail loads on demand; a routing table points each kind of question to one section | Skills (description always loaded, body on use), path-scoped rules                  | Bridge to Part 5 (Agent Skills). A routing table is a cheap way to keep the always-on part small.                  |
| (4) "Context packs" for agents with no prior context: explicit reading order and conflict-resolution order                                                  | Sub-agents start fresh; only the delegation message and CLAUDE.md reach them        | A reading order is a delegation message you write once.                                                            |
| (5) Mined real chat sessions for context users kept retyping; turned it into standing context                                                               | Docs: "add to CLAUDE.md when you type the same correction you typed last session"   | Same rule, applied with evidence rather than memory.                                                               |
| (6) Sub-agent picked exactly the right context; orchestrator dropped it while rewriting, because its brief did not ask for it                               | Only the sub-agent's final text returns; the brief shapes what comes back           | Handover matters as much as retrieval. Ask sub-agents to return the evidence, not only the answer.                 |
| (7) "Run the code, don't think it": the model never does maths itself                                                                                       | "When unsure" rule in the example                                                   | Mirror it in the example's "Don't do date or money arithmetic in your head" line.                                  |

## 13. Pitfalls worth a section

1. Writing an `@` import inside backticks, so it never loads.
2. Assuming imports reduce context. They do not; path-scoped rules and skills do.
3. Expecting a mid-session CLAUDE.md edit to apply. It waits for `/clear`, `/compact` or a restart.
4. Giving an important rule only in chat; compaction can lose it.
5. Contradictions between user, project and nested files; Claude may pick either. Use `/doctor prompt-audit` or review periodically.
6. Treating CLAUDE.md as enforcement. Use hooks or `permissions.deny` for hard rules (link forward to Part 6).
7. Teaching the `#` shortcut from older tutorials. It is gone.
8. Expecting a sub-agent to know what was said in the main chat. Restate key rules in the delegation.
9. A CLAUDE.md that repeats what Claude can work out from the code (directory listings, dependency lists). `/doctor` now proposes trimming exactly this.

## 14. Originality check versus the course outline

The course covers context through a workout-tracker app, auth customisation and "influence code output with doc files". This research uses a reminders service, a written instruction hierarchy, compaction survival, caching order and sub-agent handover. No course project, tools (auth vendor, database MCP, local-model walkthrough) or sequence are reused.

## Editor's notes (2026-10-04)

- Opening: tightened the second and third paragraphs of the hook; cut "This part of the series is about..." filler.
- Headings: renamed "The idea" to "The idea: what Claude sees, and when". Template order confirmed: concept, working example (with step two), production, pitfalls, checklist, further reading.
- Filler and hype: removed "original" and "in five minutes" from the example intro; softened "removes a whole class of confident mistakes" to "heads off".
- Paragraphs: split three long production paragraphs (hierarchy, caching, handover) into shorter ones.
- Accuracy: sub-agent sentence now says "Most get their own instructions, the CLAUDE.md files..." because built-in Explore and Plan skip CLAUDE.md (section 9).
- Summary (meta.json): reworded "missing, outdated or buried instructions" into plainer words for juniors.
- Checked: prose about 2,040 words (code blocks excluded); all links are official docs at code.claude.com/docs/en/ (where the old docs.claude.com / docs.anthropic.com Claude Code URLs now redirect); code blocks unchanged and match section 11; no blocklist terms; client facts limited to the approved ones; no new claims or numbers.
