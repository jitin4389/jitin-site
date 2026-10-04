# Research brief: Part 3, "Sub-agents: delegation without losing the plot"

Researcher notes for the writer. Checked on 2026-10-04 against the official docs and a live run of Claude Code v2.1.289 on macOS.

## 0. Read this first

- **Docs have moved.** `docs.claude.com/en/docs/claude-code/sub-agents` returns a 301 to `https://code.claude.com/docs/en/sub-agents`. Cite the `code.claude.com` URLs.
- **Primary sources** (short tags used below):
  - **[SUB]** Sub-agents: https://code.claude.com/docs/en/sub-agents
  - **[HOOKS]** Hooks reference: https://code.claude.com/docs/en/hooks
  - **[SDK]** Agent SDK sub-agents: https://code.claude.com/docs/en/agent-sdk/subagents
  - **[TOOLS]** Tools reference: https://code.claude.com/docs/en/tools-reference
  - **[CLI]** CLI reference: https://code.claude.com/docs/en/cli-reference
  - **[CMD]** Commands: https://code.claude.com/docs/en/commands
- **The docs change a lot.** The sub-agents page carries many "before v2.1.x" notes. In the article, describe behaviour without version numbers unless a point needs one. Say "at the time of writing".
- **Naming:** the docs write "subagent". The series uses "sub-agent" in prose. Code, field names and quoted UI text must keep the official spelling (`SubagentStop`, `subagent_type`).
- **The example in section 3 was tested live.** All three sub-agents ran, and the `SubagentStop` hook blocked a badly shaped report and made the reviewer rewrite it (section 3.6).

## 1. Fact base

### 1.1 What a sub-agent is

- A sub-agent is a specialised assistant that runs **in its own context window**. It has its own system prompt, its own tool access and its own permissions. Claude hands it a task, it works on its own, and it returns a result. [SUB, intro]
- Docs' one-line reason to use one: a side task "would flood your main conversation with search results, logs, or file contents you won't reference again". The sub-agent does that work in its own context and "returns only the summary". [SUB, intro]
- Benefits the docs list: preserve context, enforce constraints (limit tools), reuse configurations, specialise behaviour, control costs (route to a cheaper model such as Haiku). [SUB]
- Sub-agents send their own model requests. These count toward the same usage limits as the main conversation. [SUB, intro]
- Sub-agents work **within one session**. Separate, parallel sessions are a different feature (background agents, agent teams, cross-session messaging). Mention only to say they are out of scope. [SUB, note]

### 1.2 Where definitions live, and which wins

[SUB, "Choose the subagent scope"] When two definitions share a `name`, the higher priority wins.

| Location                   | Scope                   | Priority    |
| -------------------------- | ----------------------- | ----------- |
| Managed settings           | Organisation            | 1 (highest) |
| `--agents` CLI flag (JSON) | Current session         | 2           |
| `.claude/agents/`          | Current project         | 3           |
| `~/.claude/agents/`        | All your projects       | 4           |
| Plugin's `agents/` folder  | Where plugin is enabled | 5 (lowest)  |

- Project sub-agents: commit `.claude/agents/` so the team shares them. [SUB]
- Folders are scanned **recursively**. Sub-folders (e.g. `agents/review/`) are only for tidiness. Identity comes from the `name` field, not the file name or path. [SUB]
- Project discovery walks up from the working directory. With nested `.claude/agents/` folders, the one closest to the working directory wins. [SUB]
- Duplicate names in the same folder tree: only one loads, chosen by filesystem read order. `/doctor` reports duplicates. [SUB]
- **Hot reload:** Claude Code watches both agent folders and picks up new or edited files within a few seconds. A restart is still needed if the `agents` folder did not exist when the session started. [SUB, note]
- **Plugin sub-agents ignore** `hooks`, `mcpServers` and `permissionMode` frontmatter, for security. [SUB, note]

### 1.3 File format and frontmatter

A sub-agent is a Markdown file. YAML frontmatter holds the settings. The body becomes the sub-agent's system prompt. [SUB, "Write subagent files"]

The sub-agent gets **only** that system prompt plus basic environment details (such as working directory). It does **not** get the Claude Code system prompt. [SUB]

Only `name` and `description` are required. Field names are camelCase and must match exactly; an unknown field is **silently ignored**. [SUB, "Frontmatter reference"]

| Field             | What it does (short)                                                                                                            |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `name`            | Required. Unique id, e.g. `code-reviewer`. Hooks receive it as `agent_type`. No `:` allowed (reserved for plugin-scoped names). |
| `description`     | Required. When Claude should delegate to it.                                                                                    |
| `tools`           | Allowlist, comma string or YAML list. Omitted = inherits every tool available to sub-agents.                                    |
| `disallowedTools` | Denylist, removed from inherited or listed tools. Applied before `tools`.                                                       |
| `model`           | `sonnet`, `opus`, `haiku`, `fable`, a full model id, or `inherit`.                                                              |
| `permissionMode`  | `default`, `acceptEdits`, `auto`, `dontAsk`, `bypassPermissions`, `plan` (`manual` = alias of `default`).                       |
| `maxTurns`        | Cap on agentic turns. At the cap, output is returned marked partial and can be resumed.                                         |
| `skills`          | Skills to **preload** in full at startup.                                                                                       |
| `mcpServers`      | MCP servers for this sub-agent only: a name (reuse an existing server) or an inline definition.                                 |
| `hooks`           | Hooks that run only while this sub-agent runs.                                                                                  |
| `memory`          | Persistent memory folder: `user`, `project` or `local`.                                                                         |
| `background`      | `true` = always run in the background.                                                                                          |
| `omitClaudeMd`    | `true` = start without user/project/local CLAUDE.md (managed policy files still load).                                          |
| `effort`          | `low`, `medium`, `high`, `xhigh`, `max` (depends on model).                                                                     |
| `isolation`       | `worktree` = run in a temporary git worktree; cleaned up if no changes.                                                         |
| `color`           | Display colour: `red`, `blue`, `green`, `yellow`, `purple`, `orange`, `pink`, `cyan`.                                           |
| `initialPrompt`   | First user turn, only when the agent runs as the main session (`--agent`).                                                      |
| `experimental`    | Map; currently only `cacheTtl: 5m` or `1h` (prompt cache lifetime).                                                             |

Newer than many tutorials: `disallowedTools`, `memory`, `background`, `omitClaudeMd`, `effort`, `isolation`, `initialPrompt`, `experimental`, `skills`, `mcpServers`, `hooks`. Several tutorials only show `name`, `description`, `tools`, `model`.

**Files that are skipped silently** (no message in the session, reason in `--debug` log): no `name`; opening `---` not on line 1; `name` starting with `-` or containing `:`; `name` without `description`; YAML that does not parse. `claude plugin validate .claude/agents` checks for parse errors. [SUB, "Subagent files Claude Code skips"] Good pitfall for the article.

### 1.4 Tools and restrictions

[SUB, "Available tools"]

- `tools` is an allowlist; `disallowedTools` a denylist. If both are set, the denylist applies first.
- Example from the docs: `tools: Read, Grep, Glob, Bash` means no edits, no writes and **no MCP tools**.
- `disallowedTools: Write, Edit` keeps everything else, including MCP tools.
- MCP patterns: `mcp__<server>` or `mcp__<server>__*` grant/remove a whole server; `mcp__*` in `disallowedTools` removes all MCP tools.
- **Trap:** a `disallowedTools` entry with a specifier, e.g. `Bash(git push *)`, removes the **whole** Bash tool. To block only some commands, put a Bash deny rule in `permissions.deny` in settings.
- If no `tools` entry resolves to a real tool, the sub-agent usually refuses to launch, with an error naming the bad entries.
- Some tools are never given to sub-agents (e.g. `AskUserQuestion`, `EnterPlanMode`). **Background** sub-agents also get a smaller built-in tool set. So one definition can resolve to different tools in foreground and background. [SUB]
- Fine-grained rules: use a `PreToolUse` hook in the sub-agent's frontmatter (docs example: a `db-reader` that blocks SQL writes with exit code 2). [SUB, "Conditional rules with hooks"]
- To stop Claude using a sub-agent at all: `"permissions": { "deny": ["Agent(Explore)", "Agent(my-custom-agent)"] }`, or `claude --disallowedTools "Agent(Explore)"`. Works for built-in and custom. [SUB, "Disable specific subagents"]

### 1.5 Restricting which sub-agents an agent may spawn (important for production note 3)

[SUB, "Restrict which subagents can be spawned"]

- `tools: Agent(worker, researcher), Read, Bash` is an allowlist of spawnable types.
- **But it only applies to an agent running as the main thread with `claude --agent`.** In a sub-agent definition, listing `Agent` lets it spawn sub-agents (within the depth limit), "but any type list inside the parentheses is ignored."
- This is the documented reason behind production note 3: a declarative allowlist did not apply to nested agents, so the allowlist moved into a pre-tool hook. The writer can say this is now documented behaviour, not a bug.
- Rename: **the `Task` tool became `Agent` in v2.1.63.** `Task(...)` still works as an alias. In the SDK, `tool_use` blocks say `"Agent"` but the `system:init` tools list still says `"Task"`; match both. [SUB, note; SDK, "Detect subagent invocation"]

### 1.6 Built-in sub-agents

[SUB, "Built-in subagents"]

| Name              | Model                                        | Tools                             | Used for                                   |
| ----------------- | -------------------------------------------- | --------------------------------- | ------------------------------------------ |
| Explore           | Main conversation's model (exceptions apply) | Read-only; Write/Edit denied      | File discovery, code search                |
| Plan              | Inherits                                     | Read-only; Write/Edit denied      | Research during plan mode                  |
| general-purpose   | Subagent model order                         | All tools available to sub-agents | Multi-step work that explores and changes  |
| claude            | Model order                                  | All available                     | Catch-all; default for background sessions |
| statusline-setup  | Sonnet                                       | —                                 | `/statusline`                              |
| claude-code-guide | Haiku                                        | —                                 | Questions about Claude Code                |

- Claude asks Explore for a thoroughness level: **quick**, **medium** or **very thorough**.
- **Explore and Plan skip CLAUDE.md and the git status snapshot.** Every other built-in and custom sub-agent loads both (unless `omitClaudeMd`).
- A project or user sub-agent named `Explore` overrides the built-in (e.g. to pin it to `haiku`).
- Turn off Explore and Plan: `CLAUDE_CODE_DISABLE_EXPLORE_PLAN_AGENTS=1`. Remove all built-ins in `-p` or SDK: `CLAUDE_AGENT_SDK_DISABLE_BUILTIN_AGENTS=1`.
- Explore and Plan are one-shot: they return no agent id, so they cannot be resumed.

### 1.7 How Claude chooses a sub-agent

[SUB, "Understand automatic delegation"; "Invoke subagents explicitly"]

- Automatic: Claude matches the task in your request against each sub-agent's `description` and the current context. Phrases like "use proactively" encourage delegation.
- **Descriptions cost context.** All custom descriptions load into the main conversation. Above **15,000 tokens** combined, Claude Code warns at startup (and still loads them). Keep descriptions short; put detail in the body, which loads only when the sub-agent runs.
- Docs best practice: "Write descriptions that single out one subagent."
- Three explicit routes, weakest to strongest:
  1. **Natural language**: "Use the test-runner subagent to fix failing tests". Claude decides.
  2. **@-mention**: pick from the `@` typeahead, e.g. `@"code-reviewer (agent)" look at the auth changes`, or type `@agent-<name>`. Guarantees that sub-agent runs. Claude still writes the task prompt.
  3. **Whole session**: `claude --agent code-reviewer`, or `"agent": "code-reviewer"` in `.claude/settings.json`. The sub-agent's system prompt replaces Claude Code's default system prompt; CLAUDE.md still loads.
- The Agent tool's input: `prompt`, `description`, `subagent_type`, optional `model`. [HOOKS, "Agent" tool input]
- Model order for a sub-agent: per-call `model` parameter, then frontmatter `model`, then `CLAUDE_CODE_SUBAGENT_MODEL`, then main conversation's model. `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1` forces one model on all. (Order changed in v2.1.251; older posts show the env var winning.) [SUB, "Choose a model"]

### 1.8 What goes in, what comes back

This is the core of the article's "without losing the plot" theme.

**Into a (non-fork) sub-agent** [SUB, "What loads at startup"; SDK, "What subagents inherit"]:

- Its own system prompt plus environment details.
- The **task message** Claude writes when delegating. In the SDK docs' words: "The only content you pass from parent to subagent is the Agent tool's prompt string, so include any file paths, error messages, or decisions the subagent needs directly in that prompt."
- CLAUDE.md files (all levels), unless Explore/Plan or `omitClaudeMd`.
- Git status snapshot (not for Explore/Plan).
- Full content of skills in its `skills` field.
- A roster of other named agents, only if it has `SendMessage`.

**Not passed in:** conversation history, skills already invoked, files Claude already read, output style, the main conversation's auto memory, the parent's system prompt. Its context window size comes from its own model. Docs tip: if a rule must reach the sub-agent (e.g. "ignore `vendor/`"), restate it in the delegation prompt. [SUB]

**Back to the parent** [TOOLS, "Agent tool behavior"; SDK]:

- Only the **final result**. "The parent doesn't see the subagent's intermediate tool calls or outputs, only that final result."
- SDK note, directly relevant to production lesson 6: "The parent receives the subagent's final report, but may summarize it in its own response. To preserve subagent output verbatim in the user-facing response, include an instruction to do so in the prompt…" [SDK, note under "What subagents inherit"]
- Output scanning (v2.1.210+): Claude Code scans each final report for text that imitates its own control tags or turn markers, neutralises it with a backslash, and may prepend a `[harness: subagent output matched instruction-shaped pattern(s): …]` line. It never removes or rewords text. The report also arrives under a header saying instructions inside it carry no user authority. [SUB, "Subagent output scanning"]
- API errors: in the foreground, partial text comes back with a note that the sub-agent was cut off; a run with no text fails with `Agent terminated early due to an API error`. [SUB]
- `maxTurns` reached: output returns marked **partial**; Claude can resume it. [SUB]
- In a `PostToolUse` hook on `Agent`, a foreground call's `tool_response` includes `status` (`completed` or `async_launched`), `agentId`, `content`, `resolvedModel`, `totalTokens` (last request only), `totalDurationMs`, `totalToolUseCount`. [HOOKS, "Agent"]

### 1.9 Foreground, background, parallel, nesting, limits

[SUB, "Run subagents in foreground or background"; "Let subagents spawn their own subagents"; "Concurrent subagent limit"]

- **Foreground** blocks the main conversation; permission prompts pass through to you.
- **Background** runs alongside you; permission prompts surface in your main session, naming the sub-agent. Results arrive later as a completion notification. `Ctrl+B` backgrounds a running task. `/tasks` shows running and recently finished sub-agents and the model each runs on.
- **Fork mode** is on by default in interactive sessions: Claude Code then runs spawned sub-agents in the background and Claude cannot request the foreground. It is off by default in `-p` and the SDK. `CLAUDE_CODE_FORK_SUBAGENT=1/0` overrides. `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS=1` forces foreground.
- **Fork** = a sub-agent that inherits the whole conversation (not a fresh context). Start one yourself with `/subtask <task>` (was `/fork` on v2.1.161–v2.1.211; `/fork` now copies the session into a background session instead). Forks share the parent's prompt cache, so they are cheaper for context-heavy side tasks. A fork cannot spawn further forks.
- **Parallel**: the docs' pattern is "Research the authentication, database, and API modules in parallel using separate subagents". Works best when paths do not depend on each other. Warning: many detailed results returning can still fill the main context.
- **Chaining**: "Use the code-reviewer subagent to find performance issues, then use the optimizer subagent to fix them." Claude passes relevant context from one to the next. (That hand-over is Claude's summary, which is where things get lost.)
- **Nesting**: sub-agents can spawn their own, up to **3 layers** below the main conversation by default. `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` changes it; `1` turns nesting off. Defaults changed several times (5, then 1, then 3) between v2.1.172 and v2.1.219, so older posts disagree.
- **Concurrency**: by default, at **20 running** sub-agents, spawning another fails with `Concurrent subagent limit reached`. `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS` changes it. There is no cap on the total across a session.
- **Resume**: each invocation is a new instance. To continue one, Claude uses `SendMessage` with the agent id or name; the sub-agent keeps its full history. Transcripts: `~/.claude/projects/{project}/{sessionId}/subagents/agent-{agentId}.jsonl`; deleted after `cleanupPeriodDays` (30 by default). Main-conversation compaction does not touch them.
- When **not** to delegate (docs): lots of back-and-forth, phases sharing much context, quick targeted changes, latency matters. Use sub-agents when output is verbose, when you want tool restrictions, or when work is self-contained and can return a summary. For a quick question about the current conversation, `/btw` is lighter. [SUB, "Choose between subagents and main conversation"]

### 1.10 The `/agents` command (recently changed)

- **Changed:** on current versions `/agents` only **prints a reminder** to ask Claude to create a sub-agent or to edit `.claude/agents/` / `~/.claude/agents/` directly. On v2.1.197 and earlier it opened an interactive wizard with **Running** and **Library** tabs. [SUB, note; CMD]
- Many tutorials still show the wizard. The article should say: ask Claude to write the file, or write it by hand.
- Do not confuse with `claude agents` (CLI subcommand), which opens **agent view** for parallel background sessions, a different feature. [CLI]
- `--agents '<json>'` defines session-only sub-agents. Each key is a name; the value takes `prompt` (= body) plus most frontmatter fields (`description`, `tools`, `disallowedTools`, `model`, `permissionMode`, `mcpServers`, `hooks`, `maxTurns`, `skills`, `initialPrompt`, `memory`, `effort`, `background`, `omitClaudeMd`, `isolation`). `color` and `experimental` are ignored there. In `-p` mode it can be a path to a JSON file. [SUB; CLI]

```bash
claude --agents '{
  "code-reviewer": {
    "description": "Expert code reviewer. Use proactively after code changes.",
    "prompt": "You are a senior code reviewer. Focus on code quality, security, and best practices.",
    "tools": ["Read", "Grep", "Glob", "Bash"],
    "model": "sonnet"
  }
}'
```

### 1.11 Hooks and sub-agents

[SUB, "Define hooks for subagents"; HOOKS]

- Two places: **frontmatter** (runs only while that sub-agent runs) and **settings files** (session-wide; also fire inside sub-agents).
- Settings, managed and plugin hooks all apply inside sub-agents. A sub-agent's tool calls fire the normal `PreToolUse`/`PostToolUse` hooks, and the input carries `agent_id` and `agent_type`. [HOOKS, "Hook locations"; "Common input fields"]
  - `agent_id`: present only when the hook fires inside a sub-agent. Use it to tell sub-agent calls from main-thread calls.
  - `agent_type`: the agent name; present inside a sub-agent or when the session runs with `--agent`. The sub-agent's type wins over the session's `--agent` value.
  - This is how a pre-tool hook can enforce "which sub-agent may launch which librarian" (production note 3).
- In frontmatter, a `Stop` hook is converted to `SubagentStop` at runtime.
- **Trust rule:** frontmatter hooks in a **project** sub-agent run only after you accept the workspace trust dialog for that folder. A `-p` session does not count as trusted; a parent folder's trust does not count. Until trusted, the sub-agent runs but its frontmatter hooks are skipped (logged in debug). User-level (`~/.claude/agents/`) and `--agents` definitions are exempt. This is stricter than settings-file hooks. Same rule for inline `mcpServers` in project agent files. Pitfall worth a line.

**`SubagentStart`** [HOOKS]

- Fires when Claude spawns a sub-agent, when it resumes one, and for in-process agent-team teammates.
- Matcher = agent type (`general-purpose`, `Explore`, `Plan`, custom `name`, or plugin-scoped `my-plugin:reviewer`; anchor plugin names as `^my-plugin:reviewer$` because the colon makes it a regex).
- Input adds `agent_id`, `agent_type`.
- **Cannot block.** Can inject context: `hookSpecificOutput.additionalContext` is added to the sub-agent's context before its first prompt. Exit 2: stderr shown to the user only.

```json
{
  "hookSpecificOutput": {
    "hookEventName": "SubagentStart",
    "additionalContext": "..."
  }
}
```

**`SubagentStop`** [HOOKS]

- Fires when a sub-agent finishes responding. Same matcher values.
- Input adds `stop_hook_active`, `agent_id`, `agent_type`, `agent_transcript_path`, `last_assistant_message`, plus `background_tasks` and `session_crons`. Docs example:

```json
{
  "session_id": "abc123",
  "transcript_path": "~/.claude/projects/.../abc123.jsonl",
  "cwd": "/Users/...",
  "permission_mode": "default",
  "hook_event_name": "SubagentStop",
  "stop_hook_active": false,
  "agent_id": "def456",
  "agent_type": "Explore",
  "agent_transcript_path": "~/.claude/projects/.../abc123/subagents/agent-def456.jsonl",
  "last_assistant_message": "Analysis complete. Found 3 potential issues...",
  "background_tasks": [],
  "session_crons": []
}
```

- **Can block** = keeps the sub-agent running. `{"decision": "block", "reason": "..."}` or **exit code 2**: the reason / stderr is delivered to the sub-agent as its next instruction.
- Non-error nudge: `hookSpecificOutput.additionalContext` with `hookEventName: "SubagentStop"`.
- Loop protection: `stop_hook_active` is true when the stop was already continued by a hook; there is also an 8-consecutive-continuation cap.
- To add context to the **parent** after a sub-agent returns, use `PostToolUse` on the `Agent` tool instead.
- **Gotcha:** `SubagentStop` also fires for Claude Code's internal agents (prompt suggestions, `/btw`). Then `agent_type` is the session's `--agent` name or an empty string. A matcher that names a type never matches the empty string; an omitted / `""` / `"*"` matcher does. So always use a named matcher (as the example does).
- Observed in the live run: the logged `SubagentStart` input also had `prompt_id`; `SubagentStop` also had `permission_mode`, `prompt_id` and (for some agents) `effort`. Do not document these unless needed; they match the common-fields table.

### 1.12 Sub-agents in the Agent SDK

[SDK]

- Three ways: programmatic `agents` option in `query()` (recommended for SDK apps), filesystem `.claude/agents/`, or the built-in `general-purpose` (always available unless disabled).
- Programmatic definitions override filesystem ones with the same name.
- Include `"Agent"` in `allowedTools` so delegation is auto-approved (docs examples do this).
- `AgentDefinition` fields: `description` and `prompt` required; optional `tools`, `disallowedTools`, `model`, `skills`, `memory`, `mcpServers`, `initialPrompt`, `maxTurns`, `background`, `omitClaudeMd` (TypeScript only), `effort`, `permissionMode`. Python keeps camelCase for multi-word fields (`disallowedTools`, `mcpServers`).

```python
from claude_agent_sdk import query, ClaudeAgentOptions, AgentDefinition

options = ClaudeAgentOptions(
    allowed_tools=["Read", "Grep", "Glob", "Agent"],
    agents={
        "code-reviewer": AgentDefinition(
            description="Expert code review specialist. Use for quality, security, and maintainability reviews.",
            prompt="You are a code review specialist...",
            tools=["Read", "Grep", "Glob"],
            model="sonnet",
        ),
    },
)
```

- Detect delegation: `tool_use` blocks with `name == "Agent"` (also match `"Task"` for older versions); messages from inside a sub-agent carry `parent_tool_use_id`.
- Sub-agents run in the background by default; Claude sets `run_in_background: false` when it needs the result first; `background: true` forces background.
- **Caps** (useful for production note 1, call budgets):

| Limit       | Set with                                        | Default    | At the limit                                                                          |
| ----------- | ----------------------------------------------- | ---------- | ------------------------------------------------------------------------------------- |
| Depth       | `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`          | 3 layers   | Bottom layer cannot spawn; does the work itself                                       |
| Concurrency | `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS`          | 20 running | `Concurrent subagent limit reached`                                                   |
| Spend       | `maxBudgetUsd` (TS) / `max_budget_usd` (Python) | No limit   | `Budget limit reached`, stops background sub-agents, ends with `error_max_budget_usd` |

- Note from [SDK]: Claude Opus 5 delegates more readily than earlier models; with the `claude_code` preset Claude Code adds a line telling it not to call the Agent tool unless asked. Set the limits anyway. Optional detail; only use if the article mentions model behaviour.
- For dozens or hundreds of agents, the docs point to the `Workflow` tool (dynamic workflows) rather than turn-by-turn delegation. Out of scope; one line at most.

## 2. Mapping the production notes to documented features

The six anonymised notes below are the only production material. Do not add to them. No numbers about the client work beyond the approved facts file.

| Note                                                                                                                                                                | What it is                      | Closest documented feature                                                                                                              | Writer's angle                                                                                                                                                                                                             |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Supervisor delegates to specialists exposed as tools, each with a call budget                                                                                    | Orchestrator pattern            | Agent tool + `maxTurns` per agent; SDK depth/concurrency/spend caps                                                                     | Budgets are not optional; the platform now ships caps, but per-specialist budgets were our own.                                                                                                                            |
| 2. Each sector specialist runs isolated with exactly one domain skill loaded                                                                                        | Isolation of methodology        | `skills` frontmatter (full preload) + fresh context per sub-agent                                                                       | Caveat: `skills` controls preloading, not access. A sub-agent can still invoke other skills via the Skill tool unless `Skill` is removed from `tools` or added to `disallowedTools`. "Exactly one" needs that second step. |
| 3. Librarian sub-agents for data access; launch allowlist enforced by a pre-tool hook                                                                               | Access control between agents   | `Agent(type)` allowlist works only for `--agent` main thread; ignored in sub-agent definitions. `PreToolUse` input carries `agent_type` | Documented limitation, so a hook on `Agent` matching `agent_type` → allowed `subagent_type` is the right fix.                                                                                                              |
| 4. Per-run pipeline from a registry: each agent declares output file, inputs, criticality; critical failure stops, non-critical continues with a confidence penalty | Orchestration outside the model | Not a Claude Code feature; custom code. Related: `maxTurns` partial output, API-error partial output                                    | Present as our design, not a product feature.                                                                                                                                                                              |
| 5. Hand-offs through structured files with a standard header, never chat history                                                                                    | Contract between agents         | Docs: only the prompt string goes in; only the final message comes back; chaining relies on Claude's summary                            | Files make hand-offs inspectable and immune to summarisation.                                                                                                                                                              |
| 6. A sub-agent selected the right context; the orchestrator dropped it while rewriting, because it only kept what its brief asked for                               | Loss at the hand-back           | SDK docs: parent "may summarize it in its own response"; ask for verbatim if needed                                                     | Lead lesson: decide what must survive the hand-back, and say so in the brief and in the orchestrator's instructions.                                                                                                       |

## 3. Proposed working example: a three-agent team for a small repo

Original, small, and tested. A tiny Python pricing module with one deliberate inconsistency (docstring says "10 or more units", code checks `> 10`). Not related to the Udemy course project or tools.

### 3.1 Layout

```text
.
├── CLAUDE.md
├── .claude/
│   ├── agents/
│   │   ├── investigator.md
│   │   ├── test-writer.md
│   │   └── reviewer.md
│   ├── hooks/
│   │   └── check-review-shape.sh
│   └── settings.json
├── src/
│   ├── __init__.py
│   └── pricing.py
└── tests/
    └── test_pricing.py
```

### 3.2 Seed code

`src/pricing.py`

```python
def apply_discount(price: float, percent: float) -> float:
    """Return price after a percentage discount."""
    if percent < 0 or percent > 100:
        raise ValueError("percent must be between 0 and 100")
    return round(price * (1 - percent / 100), 2)


def bulk_price(unit_price: float, quantity: int) -> float:
    """10% off for 10 or more units."""
    total = unit_price * quantity
    if quantity > 10:
        return apply_discount(total, 10)
    return round(total, 2)
```

`tests/test_pricing.py`

```python
from src.pricing import apply_discount


def test_apply_discount_basic():
    assert apply_discount(100, 25) == 75
```

### 3.3 The three sub-agents

`.claude/agents/investigator.md` — read-only, cheap model, fixed evidence format.

```markdown
---
name: investigator
description: Read-only code investigator. Use proactively to find where something lives or how it works before changing it. Returns file paths, line numbers and short quotes, never edits.
tools: Read, Grep, Glob
model: haiku
---

You investigate a codebase and report facts. You never change files.

When invoked:

1. Restate the question in one line.
2. Search with Grep and Glob, then Read only the files you need.
3. Stop as soon as you can answer.

Return exactly this shape:

## Answer

One or two sentences.

## Evidence

- `path/to/file.py:LINE` - short quote or paraphrase

## Not checked

Anything you did not look at that could change the answer. Write "Nothing" if none.
```

`.claude/agents/test-writer.md` — can edit and run tests; scope limited by its prompt.

```markdown
---
name: test-writer
description: Writes or extends pytest tests for a named function or behaviour, runs them, and reports results. Use when asked to add tests. Only edits files under tests/.
tools: Read, Grep, Glob, Edit, Write, Bash
model: sonnet
---

You write focused pytest tests. You only create or edit files under `tests/`.
Never change source files, even if a test reveals a bug. Report the bug instead.

When invoked:

1. Read the function under test and any existing tests for it.
2. Add tests for normal cases, boundaries and invalid input.
3. Run `python -m pytest -q` and read the output.

Return:

- Tests added (file and test names)
- Pytest summary line
- Any failing test that points at a real bug, with the expected and actual values
```

Honesty note for the writer: "only edits `tests/`" is an **instruction**, not enforcement. `tools` cannot restrict paths. To enforce it, add a `PreToolUse` hook on `Edit|Write` that rejects paths outside `tests/` (link back to Part 6), or permission rules. Say this plainly in the article.

`.claude/agents/reviewer.md` — no Edit/Write; fixed report shape.

```markdown
---
name: reviewer
description: Reviews the current uncommitted diff and returns a fixed-format verdict. Use after code or tests change and before committing.
tools: Read, Grep, Glob, Bash
model: inherit
---

You review the uncommitted changes in this repository. You do not edit files.

Steps:

1. Run `git diff` and `git status --short` to see what changed. Include untracked files.
2. Read surrounding code where the diff alone is not enough.

Your final message must use exactly these headings, in this order, and nothing else:

## Verdict

One of: APPROVE, REQUEST CHANGES.

## Blocking issues

Numbered list with `file:line` and why it matters. Write "None" if there are none.

## Non-blocking suggestions

Short bullets. Write "None" if there are none.
```

Note: the reviewer has Bash, so it _could_ run commands that change files. It is "read-only by intention". For strict read-only, drop Bash (and lose `git diff`) or add a Bash `PreToolUse` guard. Mention as a trade-off.

### 3.4 Enforcing the report shape with `SubagentStop`

`.claude/settings.json` (settings-file hook, so it runs in `-p` too; frontmatter hooks in a project agent would need workspace trust):

```json
{
  "hooks": {
    "SubagentStop": [
      {
        "matcher": "^reviewer$",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/check-review-shape.sh"
          }
        ]
      }
    ]
  }
}
```

`.claude/hooks/check-review-shape.sh` (needs `jq`; `chmod +x`):

```bash
#!/bin/bash
# SubagentStop hook: make the reviewer return the agreed report shape.
INPUT=$(cat)
MSG=$(echo "$INPUT" | jq -r '.last_assistant_message // empty')
ACTIVE=$(echo "$INPUT" | jq -r '.stop_hook_active // false')

# Already sent back once: let it stop rather than loop.
[ "$ACTIVE" = "true" ] && exit 0

for h in "## Verdict" "## Blocking issues" "## Non-blocking suggestions"; do
  if ! grep -qF "$h" <<< "$MSG"; then
    echo "Your report is missing the heading '$h'. Rewrite your final message using the exact report format from your instructions." >&2
    exit 2
  fi
done
exit 0
```

Why the anchored matcher `^reviewer$`: it avoids matching other names containing "reviewer", and a named matcher never fires for the internal agents that report an empty `agent_type`.

### 3.5 CLAUDE.md note on when to delegate

```markdown
## When to delegate

- Questions like "where is X" or "how does Y work": use the `investigator` sub-agent. Keep its file:line evidence in your answer.
- Adding tests: use the `test-writer` sub-agent. It only touches `tests/`.
- Before any commit: use the `reviewer` sub-agent and show its report unchanged.
- Small edits you can make in one or two steps: do them yourself, no sub-agent.
- When you brief a sub-agent, include the file paths and decisions it needs. It cannot see this conversation.
```

### 3.6 Verification (live, Claude Code v2.1.289, macOS, `claude -p`, main model Sonnet)

Checked against docs:

- File locations, required fields, `tools` comma-string format, `model` aliases (`haiku`, `sonnet`, `inherit`): [SUB, frontmatter reference]. ✔
- `SubagentStop` matcher on agent type, `last_assistant_message`, `stop_hook_active`, exit 2 keeps the sub-agent running and feeds stderr to it: [HOOKS, SubagentStop; exit-code table]. ✔
- Settings-file hook (not frontmatter) chosen because project frontmatter hooks need workspace trust and `-p` does not count. [SUB, "Hooks in subagent frontmatter"]. ✔

Live run 1 (full flow). Prompt: "Use the investigator to find where the bulk discount threshold is defined. Then have the test-writer add tests for bulk_price. Then run the reviewer on the uncommitted changes. Report what each sub-agent returned." Flags: `--permission-mode acceptEdits --allowedTools "Read,Grep,Glob,Edit,Write,Bash(python -m pytest*),Bash(python3 -m pytest*),Bash(git diff*),Bash(git status*),Agent"`. Note: put the prompt **before** `--allowedTools`, because that flag takes several values and swallows a trailing prompt.

- A logging hook confirmed `SubagentStart` and `SubagentStop` fired for `investigator`, `test-writer`, `reviewer` in order, each with its own `agent_id`.
- Investigator returned the three headings and pointed at `src/pricing.py:11` (`> 10`) and the docstring at line 9.
- Test-writer added `bulk_price` tests, ran pytest (all passed), did not touch `src/`, and reported the `>` vs `>=` mismatch as a probable bug instead of "fixing" it.
- Reviewer returned the exact three-heading report (`APPROVE`, no blocking issues, suggestions).
- **Useful real observation for the article:** CLAUDE.md said "show its report unchanged", yet the main agent **reformatted** the reviewer's report in its final answer (bold "Verdict: APPROVE", merged headings). The content survived but the shape did not. This is a small, safe, first-hand illustration of production lesson 6 and the SDK note that the parent "may summarize" the report. One run only; present it as an observation, not a rule.

Live run 2 (hook test). Reviewer temporarily changed to "reply in two or three plain sentences with no headings" on `haiku`; a one-line change made in `src/pricing.py`. Prompt asked to show the report "exactly as returned".

- First `SubagentStop`: `stop_hook_active: false`, plain-sentence message → hook exited 2.
- Reviewer continued and rewrote; second `SubagentStop`: `stop_hook_active: true`, message had all three headings → hook allowed the stop.
- The main agent then showed the report unchanged in a code block. With the "verbatim" instruction in the **prompt itself**, the shape survived.
- Files restored afterwards.

Requirements to state in the article: Claude Code with project trust accepted (interactive) or `-p`; `jq`; Python 3 with pytest; a git repo.

## 4. Pitfalls worth a line each

1. Vague or overlapping descriptions → wrong sub-agent or none. Make each description single out one agent.
2. Long descriptions eat main-context budget (15,000-token warning).
3. Assuming the sub-agent "knows" what you discussed. It only gets the delegation prompt (+ CLAUDE.md). Put paths and decisions in the brief.
4. Losing detail at the hand-back: the parent may summarise. Ask for verbatim output, or hand off through files.
5. Typos in frontmatter field names are silently ignored; a missing `description` silently skips the file.
6. `disallowedTools: Bash(git push *)` removes all of Bash.
7. `tools` cannot restrict paths; "only edit tests/" needs a hook or permission rules.
8. `Agent(a, b)` allowlists do nothing inside a sub-agent definition; only for `--agent` main thread.
9. Project frontmatter hooks silently skipped until the folder is trusted (and never in `-p`).
10. `/agents` no longer opens a wizard; old screenshots mislead.
11. Background sub-agents get a smaller tool set; a definition that works in the foreground can behave differently in the background.
12. Explore and Plan ignore CLAUDE.md, so project rules do not reach them.
13. Too many parallel sub-agents returning detailed results can still flood the main context.

## 5. Suggested checklist items (for the writer to adapt)

- Each sub-agent has one job and a description that names when to use it.
- Tools are the minimum needed; read-only agents have no Edit/Write.
- Each sub-agent returns a fixed, short report shape.
- The brief includes every path and decision the sub-agent needs.
- Anything that must survive the hand-back is marked "return verbatim" or written to a file.
- CLAUDE.md says when to delegate and when not to.
- A hook enforces the rules that matter (`SubagentStop` for shape, `PreToolUse` for access).
- Definitions are committed in `.claude/agents/` and reviewed like code.

## 6. Originality check

- Course outline has "Sub agents", "Running bash commands" and "Agent Skills" as topics only. Nothing here uses the course project (workout tracker), its tools (Clerk, Neon, Ollama/qwen) or its sequence.
- The example (pricing module, investigator / test-writer / reviewer team, `SubagentStop` shape check) is original.
- Docs examples (`code-reviewer`, `debugger`, `data-scientist`, `db-reader`) were read but not reused; the article's agents are different in purpose and wording.

## 7. Open questions for the editor

- Should the article show the `Agent`-tool `PreToolUse` allowlist hook for production note 3 as code? It would be original, but it was not tested here. If included, the hook would match `Agent` and check `agent_type` (caller) against `tool_input.subagent_type` (callee). Test before publishing, or describe it in prose only.
- Whether to mention forks / `/subtask` at all. Suggest one short paragraph as "the exception to fresh context".

## Editor's notes (2026-10-04)

- **Opening:** tightened the hook to start from the reader's own experience ("You ask your agent for one change...") and cut the "more agents" paragraph to two sentences.
- **Headings:** renamed "The idea" to "The idea: a contract with two edges". Added scannable sub-headings "The email test", "Where sub-agents live" and "What the first run taught me". Template order unchanged: idea, working example, production, pitfalls, checklist, further reading.
- **Filler cut:** removed "That is the whole mechanism", merged short repeated sentences in the hand-back and investigator paragraphs, and split the long "should this be a sub-agent?" paragraph in two.
- **Hook explanation:** turned the two "deliberate details" (anchored matcher, `stop_hook_active`) into a two-item list; same facts, easier to read.
- **Anonymisation:** replaced the quoted internal-sounding label for the data-access sub-agents with a plain description. No client names, numbers or code names added.
- **Summary (sidecar):** replaced "clean slate" with plain wording for junior readers. Other sidecar fields unchanged; JSON still parses.
- **Checked, no change needed:** all code blocks match sections 3.1–3.5 of this brief; all five links are official `code.claude.com/docs` pages; prose is about 2,260 words (excluding code); blocklist scan of article, sidecar and this file is clean; British spelling kept.
