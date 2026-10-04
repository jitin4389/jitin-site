# Research brief: Part 6, "Hooks as guardrails: enforcing rules in code, not prompts"

Researcher notes for the writer. Checked on 2026-10-04 against the official docs and a live run of Claude Code v2.1.289.

## 0. Read this first

- **Docs have moved.** `docs.claude.com/en/docs/claude-code/hooks` now returns a 301 redirect to `https://code.claude.com/docs/en/hooks`. Cite the `code.claude.com` URLs.
- **Primary sources:**
  - Hooks reference: https://code.claude.com/docs/en/hooks (cited below as **[REF]**)
  - Hooks guide: https://code.claude.com/docs/en/hooks-guide (**[GUIDE]**)
  - Agent SDK hooks: https://code.claude.com/docs/en/agent-sdk/hooks (**[SDK]**)
  - Settings: https://code.claude.com/docs/en/settings (**[SET]**)
  - Tools reference: https://code.claude.com/docs/en/tools-reference (**[TOOLS]**)
- **The docs change often.** Many behaviours carry "before v2.1.x" notes. In the article, describe behaviour without naming version numbers unless the point needs one. Say "at the time of writing".
- **The example in section 3 was tested live.** Both hooks worked as described: Claude Code v2.1.289 on macOS, run in `-p` (non-interactive) mode.

## 1. Fact base

### 1.1 What a hook is

- A hook is a handler that Claude Code runs automatically at a fixed point in its lifecycle. There are five handler types: `command` (a shell command), `http` (a POST to a URL), `mcp_tool` (a call to a tool on an MCP server), `prompt` (a one-turn check by a Claude model) and `agent` (a sub-agent verifier, marked experimental). [REF, "Hook handler fields"]
- Configuration has three levels of nesting: the **hook event**, then a **matcher group**, then one or more **hook handlers**. [REF, "Configuration"]
- The same hook events fire in the terminal, IDE extensions, the Desktop app and cloud sessions. [REF, intro]

### 1.2 Where hooks live

[REF, "Hook locations"]

| Location                      | Scope                                         | Shareable                                              |
| ----------------------------- | --------------------------------------------- | ------------------------------------------------------ |
| `~/.claude/settings.json`     | All your projects                             | No                                                     |
| `.claude/settings.json`       | One project                                   | Yes, commit it                                         |
| `.claude/settings.local.json` | One project                                   | No (gitignored when Claude Code saves a setting to it) |
| Managed policy settings       | Organisation                                  | Yes, admin-controlled                                  |
| Plugin `hooks/hooks.json`     | While the plugin is enabled                   | Yes                                                    |
| Skill frontmatter             | Rest of the session once the skill is invoked | Yes                                                    |
| Sub-agent frontmatter         | While that sub-agent runs                     | Yes                                                    |

- **Hooks merge across levels.** They do not replace each other. The same handler defined in more than one settings file runs once. [REF]
- **Settings precedence**, highest first: managed, command line, local project, shared project, user. [SET]
- **Hooks fire inside sub-agents.** Hooks from settings files, managed settings and plugins also run inside sub-agents. A sub-agent's tool calls fire the same `PreToolUse`/`PostToolUse` hooks as the main conversation. The input then carries `agent_id` and `agent_type`. [REF, "Hook locations"] This is the documented basis for production note 5.
- In sub-agent frontmatter, a `Stop` hook is converted to `SubagentStop`. [REF, "Hooks in skills and agents"]
- **Kill switches:**
  - `"disableAllHooks": true` in settings turns all hooks off.
  - `--settings '{"disableAllHooks": true}'` turns them off for one run.
  - You cannot disable a single hook while keeping it in the configuration.
  - Settings below the managed level cannot disable managed hooks.
  - `allowManagedHooksOnly`, set in managed settings, blocks user, project, local and plugin hooks.

  [REF, "Disable or remove hooks"]

- **The `/hooks` command** opens a **read-only** browser of your configured hooks. It labels each hook's source (user, project, local, plugin, session) and shows the full command. Select "All events" to see every event. To add or remove a hook, edit the settings file. The file watcher normally picks up the change. [REF, "The /hooks menu"] _Possibly changed:_ older tutorials show hooks being added through `/hooks`. Describe it only as a browser.

### 1.3 Hook events (current list)

[REF, event table] The brief named 9 events. All 9 still exist:

`PreToolUse`, `PostToolUse`, `UserPromptSubmit`, `Stop`, `SubagentStop`, `Notification`, `PreCompact`, `SessionStart`, `SessionEnd`.

Newer events in the current docs:

`Setup`, `UserPromptExpansion`, `PermissionRequest`, `PermissionDenied`, `PostToolUseFailure`, `PostToolBatch`, `MessageDisplay`, `SubagentStart`, `TaskCreated`, `TaskCompleted`, `StopFailure`, `TeammateIdle`, `InstructionsLoaded`, `ConfigChange`, `CwdChanged`, `DirectoryAdded`, `FileChanged`, `WorktreeCreate`, `WorktreeRemove`, `PostCompact`, `PreModelSwitch`, `PostModelSwitch`, `Elicitation`, `ElicitationResult`.

Advice for the article: do not list them all. Name the handful a guardrail article needs, then link to the reference. The list grows quickly.

Events most relevant to guardrails:

| Event                         | When it fires                                                                                                            | Can it block?                                           |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------- |
| `PreToolUse`                  | After Claude builds the tool parameters, before the tool runs                                                            | Yes                                                     |
| `PostToolUse`                 | After a tool succeeds                                                                                                    | No. The tool already ran. Exit 2 shows stderr to Claude |
| `UserPromptSubmit`            | Before Claude processes a prompt. Also fires on scheduled tasks, background sub-agent reports and cross-session messages | Yes                                                     |
| `Stop`                        | When the main agent finishes responding. Not on user interrupt. API errors fire `StopFailure` instead                    | Yes. Blocking keeps Claude working                      |
| `SubagentStop`                | When a sub-agent finishes                                                                                                | Yes. Blocking keeps the sub-agent working               |
| `PreCompact`                  | Before context compaction                                                                                                | Yes                                                     |
| `SessionStart` / `SessionEnd` | Session begins or resumes / ends                                                                                         | No                                                      |
| `Notification`                | Claude Code sends a notification                                                                                         | No                                                      |

Source: [REF], "Exit code 2 behavior per event".

### 1.4 Matchers

[REF, "Matcher patterns"]

- **Match everything:** `"*"`, `""`, or no matcher.
- **Exact match:** a matcher made only of letters, digits, `_`, `-`, spaces, `,` and `|` is an exact string or a list. For example, `Edit|Write` and `Edit, Write` each match exactly those two tools.
- **Regex:** any other character makes the matcher an unanchored JavaScript regular expression. `Edit.*` also matches `NotebookEdit`. Use `^Edit$` for an exact whole-name match.
- **Case-sensitive.** [GUIDE, "Hook not firing"]
- **MCP tools:** names follow `mcp__<server>__<tool>`. To cover every tool on a server you need `mcp__memory__.*`. The bare `mcp__memory` matches nothing.
- **What each event matches on:** tool events match the tool name. `SessionStart` matches the source (`startup|resume|clear|compact|fork`). `PreCompact` matches `manual|auto`. `SubagentStop` matches the agent type.
- **Events with no matcher support:** `UserPromptSubmit` and `Stop` have none. A matcher on them is silently ignored.
- **Newer `if` field:** set on a handler for tool events only. It uses permission-rule syntax, such as `"Bash(git *)"` or `"Edit(*.ts)"`, so the script only spawns when the tool and its arguments match. It holds one rule only. The docs call it best-effort for Bash: "use the permission system rather than a hook to enforce a hard allow or deny." [REF, "Common fields"]

### 1.5 Handler fields (command hooks)

[REF, "Common fields", "Command hook fields"]

- **Common to all handler types:**
  - `type` (required)
  - `if`
  - `timeout` (seconds)
  - `statusMessage` (spinner text)
  - `once` (honoured only in skill frontmatter)
- **Command hooks also take:**
  - `command` (required)
  - `args` (newer). When present, `command` is spawned directly with no shell ("exec form").
  - `async`
  - `asyncRewake`
  - `shell` (`"bash"` or `"powershell"`)
- **Path placeholder:** `${CLAUDE_PROJECT_DIR}` is substituted into `command` and `args`. It is also exported as an environment variable. The docs prefer exec form for any hook that uses a path placeholder.
- **Parallel runs:** all matching hooks run in parallel. A `deny` from one does not stop a sibling hook's side effects. [GUIDE, "Combine results from multiple hooks"]

### 1.6 Input on stdin

[REF, "Common input fields"]

- **Common fields:** `session_id`, `transcript_path`, `cwd`, `permission_mode`, `hook_event_name`. Newer fields: `prompt_id`, `scratchpad_dir`, `effort`. Inside a sub-agent, or with `--agent`, the input also carries `agent_id` and `agent_type`.
- **`PreToolUse` adds** `tool_name`, `tool_input` and `tool_use_id`. For `Write`, `Edit` and `Read`, `tool_input.file_path` is **always absolute**. [REF, "PreToolUse input"]
  - `Write.tool_input`: `file_path`, `content`
  - `Edit.tool_input`: `file_path`, `old_string`, `new_string`, `replace_all`
- **`Stop` adds:**
  - `stop_hook_active`: `true` when Claude is already continuing because of a stop hook
  - `last_assistant_message`: the text of Claude's final response
  - `background_tasks` and `session_crons`

  The docs say to use `last_assistant_message` rather than reading `transcript_path`. The transcript is written asynchronously and may lag. [REF, "Stop input", "Common input fields"]

- **`SubagentStop` adds** `stop_hook_active`, `agent_id`, `agent_type`, `agent_transcript_path` and `last_assistant_message`.
- **`UserPromptSubmit` adds** `prompt`. **`PreCompact` adds** `trigger` and `custom_instructions`. **`SessionEnd` adds** `reason`.
- **`MultiEdit` is gone.** It does not appear in the current hooks reference or tools reference. Older blog posts use the matcher `Edit|MultiEdit|Write`. Use `Edit|Write`. [TOOLS]

### 1.7 Exit codes

[REF, "Exit code output"]

- **Exit 0.** Success. Stdout is parsed as JSON if it starts with `{` and ends with `}`. Otherwise it is treated as plain text.
  - For most events, plain stdout goes to the debug log only.
  - The exceptions are `UserPromptSubmit`, `UserPromptExpansion`, `SessionStart` and `PostModelSwitch`, where plain stdout is added as context for Claude.
  - Stderr on exit 0 goes to the debug log only. Claude never sees it.
- **Exit 2.** A blocking error on events that can block.
  - JSON cannot override it, not even `permissionDecision: "allow"`.
  - The block message is the JSON reason if the JSON makes a blocking decision. Otherwise it is **stderr**.
  - For `PreToolUse`, Claude sees the stderr as the denial reason.
  - For `Stop`, Claude receives it as the reason to keep going.
  - For `PostToolUse`, stderr is shown to Claude, but the tool has already run.
- **Any other code, including 1.** A **non-blocking** error for most events. The action proceeds and the transcript shows `<hook> hook error` with the first line of stderr. A missing or non-executable script (shell exit 127) lands here too.
  - Docs warning, worth quoting in your own words: "If your hook is meant to enforce a policy, use `exit 2`." A mistyped path leaves the gate silently disabled.
  - The worktree events are the exception: any non-zero exit fails them.

### 1.8 JSON output

[REF, "JSON output", "Decision control"]

- **Universal fields:**
  - `continue` (default `true`). If `false`, Claude stops entirely. It takes precedence over event decisions.
  - `stopReason`: shown to the user when `continue` is `false`.
  - `suppressOutput`: **now has no effect**. It is accepted but ignored.
  - `systemMessage`: a warning shown to the user, not to Claude.
  - `terminalSequence`: newer. Lets a hook trigger desktop notifications or set the window title.
- **`hookSpecificOutput`** must include `hookEventName`.
- **`PreToolUse` decision fields:**
  - `hookSpecificOutput.permissionDecision`: `"allow"`, `"deny"`, `"ask"` or `"defer"` (`defer` works only in `-p` mode)
  - `permissionDecisionReason`: for `deny`, shown to Claude; for `ask`, shown to the user
  - `updatedInput`: replaces the whole input object
  - `additionalContext`
  - When hooks disagree, the precedence is deny > defer > ask > allow.
- **Deprecated for `PreToolUse`:** top-level `decision`/`reason`. The old values `"approve"` and `"block"` map to `allow` and `deny`. Other events still use top-level `decision`/`reason` as their current format.
- **`Stop` and `SubagentStop`:**
  - `decision: "block"` plus `reason`. `reason` is required when blocking and tells Claude why to continue.
  - Newer alternative: `hookSpecificOutput.additionalContext` gives non-error feedback that also keeps the conversation going. The transcript labels it "Stop hook feedback" instead of a hook error.
- **`UserPromptSubmit` and `PostToolUse`:** top-level `decision: "block"` plus `reason`. `PostToolUse` can also return `updatedToolOutput`.
- **Size cap:** `additionalContext`, `systemMessage` and plain stdout are capped at 10,000 characters each. Longer output is saved to a file, and Claude gets a path plus a 2,000-character preview.
- **Common pitfall:** a field at the wrong level is silently ignored, for example `permissionDecision` at the top level. So is JSON preceded by text from a shell profile. [GUIDE, "Hook JSON has no effect"]

### 1.9 Loop protection on Stop hooks

- Check `stop_hook_active` and exit early if it is `true`. [REF, "Stop input"; GUIDE, "Stop hook hits the block cap"]
- **Newer safety net:** after stop hooks have continued the turn 8 times in a row, Claude Code overrides the next block and ends the turn. The env var `CLAUDE_CODE_STOP_HOOK_BLOCK_CAP` raises the cap. [REF]
- `Stop` fires whenever Claude finishes responding, not only at task completion. [GUIDE, "Limitations"]

### 1.10 Timeouts

[REF, "Common fields", "Timeouts"; GUIDE, "Limitations"]

- **Defaults:**
  - `command`, `http` and `mcp_tool`: 600 s
  - `prompt`: 30 s
  - `agent`: 60 s
  - `UserPromptSubmit`, `PreModelSwitch` and `PostModelSwitch`: lowered to 30 s
  - `MessageDisplay`: 10 s
  - `SessionEnd`: hooks share a 1.5 s budget. A per-hook `timeout` raises it, up to 60 s. So does `CLAUDE_CODE_SESSIONEND_HOOKS_TIMEOUT_MS`.
- **Important for guardrails:** a timed-out `command`/`http`/`mcp_tool` hook on `PreToolUse` **does not block**. The call continues through normal permissions. "Don't count on a stalled hook to act as a gate."
- **The SDK differs:** an Agent SDK callback hook on `PreToolUse` that times out **blocks** the tool call.

### 1.11 Hooks vs permission modes

[GUIDE, "Hooks and permission modes"]

- `PreToolUse` fires before any permission-mode check. A hook `deny` blocks even in `bypassPermissions` mode and with `--dangerously-skip-permissions`.
- The reverse does not hold. A hook `allow` does not bypass deny rules in settings. Hooks "can tighten restrictions but not loosen them past what permission rules allow."
- **Writer note:** this is the strongest documented argument for "rules in code, not prompts". The hook holds whatever mode the session runs in.

### 1.12 Security

[REF, "Security considerations"]

- Command hooks run "with your full user permissions". Review and test every hook before adding it.
- **Workspace trust:**
  - In an **interactive** session, hooks from all settings files are held back until you accept the trust dialog for the folder.
  - In **`-p` / SDK** sessions there is no dialog, and the folder is treated as trusted. A repo's committed `.claude/settings.json` hooks therefore run.
  - Before scripting `claude -p` over a repo you did not write, review its `.claude/` folder, use `--bare`, or pass `--settings '{"disableAllHooks": true}'`.
- **Best practices from the docs:** validate inputs, quote shell variables, block path traversal (`..`), use absolute paths or `${CLAUDE_PROJECT_DIR}`, and skip sensitive files (`.env`, `.git/`, keys).
- **PreToolUse does not fire** for files pulled in with `@` in a prompt. To block those, use a `Read` deny rule. [REF, "PreToolUse"]
- **Blocked prompts stay on disk.** A `UserPromptSubmit` block does not keep the prompt text off disk. It still lands in the transcript and history.

### 1.13 Debugging

[REF, "Debug hooks"; GUIDE, "Debug techniques"]

- `claude --debug-file <path>`, or `claude --debug` (log at `~/.claude/debug/<session-id>.txt`).
- `/debug` turns on logging mid-session.
- `Ctrl+O` opens the transcript view.
- `CLAUDE_CODE_DEBUG_LOG_LEVEL=verbose` adds matcher detail.
- **Manual test:** pipe sample JSON into the script and check `$?`. One gotcha found while testing: zsh's `echo` turns `\n` inside the JSON into real newlines, which makes the JSON invalid. Use `printf '%s'` or build the JSON with Python or `jq`.

### 1.14 Hooks in the Agent SDK

[SDK]

- **Shape:** hooks are async callback functions passed in `options.hooks`. Python uses `ClaudeAgentOptions(hooks={"PreToolUse": [HookMatcher(matcher="Write|Edit", hooks=[cb])]})`. TypeScript uses `hooks: { PreToolUse: [{ matcher, hooks: [cb] }] }`.
- **Callback arguments:** `(input_data, tool_use_id, context)`.
  - Return `{}` to allow.
  - Otherwise return the same JSON shape as shell hooks.
  - Python spells `continue` as `continue_` and `async` as `async_`.
- **Settings hooks load too:** shell hooks from settings files also run when `setting_sources`/`settingSources` includes them. They do by default for `query()`.
- **Event coverage:** Python covers fewer events than TypeScript. Python has `PreToolUse`, `PostToolUse`, `PostToolUseFailure`, `UserPromptSubmit`, `Stop`, `SubagentStart`, `SubagentStop`, `PreCompact`, `PermissionRequest` and `Notification`. **`SessionStart`/`SessionEnd` are TypeScript-only as callbacks.**
- **Matcher limits:** matchers match tool names only, never file paths. Filter paths inside the callback.
- **Timeouts:** set `timeout` (seconds) on the `HookMatcher`. A timed-out `PreToolUse` callback blocks the tool. A timed-out `UserPromptSubmit` callback blocks the prompt. A timed-out `Stop` callback counts as no decision.

## 2. How the production notes map to the docs

Use the notes exactly as supplied. Do not add numbers or detail. Each note is paired with the documented mechanism that makes it work, so the writer can explain _why_.

| Note                                                                                                                                                                                                                              | Documented mechanism                                                                                                                                                                                                                                           |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Rules started as prompt sentences and ended as hooks or validators. Prompt-only rules were followed inconsistently, and many breaches came from one agent asking another to break them                                         | Hooks run whatever the model decides. A `PreToolUse` deny holds even in bypass mode (1.11). Hooks also fire inside sub-agents (1.2)                                                                                                                            |
| 2. A pre-tool hook blocks banned vocabulary or forecast language. It scans only the folder it guards and fails open if it cannot parse its input                                                                                  | `PreToolUse` with an `Edit\|Write` matcher, plus a path check inside the script (matchers cannot filter paths). Exit 2 and stderr give the reason. Failing open = exit 0 on a parse error. The docs show non-2 exits and crashes are non-blocking anyway (1.7) |
| 3. Banned vocabulary lives in a lexicon file that non-engineers can edit                                                                                                                                                          | The script reads a data file at run time, so editing the list needs no code change                                                                                                                                                                             |
| 4. A Stop hook sends an answer back once to fix uncited numbers. It replaced retry-from-scratch, which made answers worse                                                                                                         | `Stop` + `last_assistant_message` + `decision: "block"` with a targeted `reason`, guarded by `stop_hook_active` (1.6, 1.8, 1.9)                                                                                                                                |
| 5. A web-research gate refuses figures for unfinished periods. A per-turn tool roster switches web access on or off. It is enforced in a hook as well as the disallowed-tools list, because the hook also fires inside sub-agents | Documented: settings hooks fire inside sub-agents with `agent_id`/`agent_type` (1.2)                                                                                                                                                                           |
| 6. A hook enforces which sub-agent may call which data source, because declarative restrictions did not apply to nested agents _in our setup_                                                                                     | Use `agent_type` in the `PreToolUse` input to decide. Keep the "in our setup" qualifier. The docs do not say declarative restrictions fail for nested agents, so don't generalise                                                                              |
| 7. Hooks and validators also run in CI. A separate validator turns block-severity violations into hard failures and warnings into events                                                                                          | Hooks are plain scripts, so the same script can run in CI on the files themselves. Hooks run in `-p` mode with no trust dialog (1.12), which is relevant to CI                                                                                                 |

**Wording risk:** note 2 says "fails open". Make clear this was a deliberate, documented trade-off. Also say the safer default for a policy gate is to fail closed (exit 2), which the docs imply with "use `exit 2`".

## 3. Proposed original example (tested)

**Scenario (original, not from the course):** a project keeps client-facing write-ups in `reports/`. Two rules apply:

1. Reports must not contain promise or hype words.
2. Any figure in Claude's final answer needs a citation marker.

Both rules used to be prompt sentences. Now they are code.

### 3.1 Files

```
.claude/
  settings.json
  lexicon.json              # editable by non-engineers
  hooks/
    block_banned_phrases.py # PreToolUse
    require_citations.py    # Stop
```

`.claude/lexicon.json`:

```json
{
  "guarded_folder": "reports",
  "banned": [
    { "phrase": "guaranteed", "why": "we never promise outcomes" },
    { "phrase": "will definitely", "why": "state likelihood, not certainty" },
    {
      "phrase": "game-changing",
      "why": "hype word; describe the effect instead"
    },
    { "phrase": "risk-free", "why": "nothing is risk-free; name the risk" }
  ]
}
```

JSON keeps the hook on the Python standard library. If the article prefers YAML for non-engineers, `yaml.safe_load` works the same way. It needs PyYAML, which ships with many installs but not all, so mention that.

`.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "python3",
            "args": [
              "${CLAUDE_PROJECT_DIR}/.claude/hooks/block_banned_phrases.py"
            ],
            "timeout": 10
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "python3",
            "args": [
              "${CLAUDE_PROJECT_DIR}/.claude/hooks/require_citations.py"
            ],
            "timeout": 10
          }
        ]
      }
    ]
  }
}
```

- **Exec form.** With `args` present, `python3` is spawned directly with no shell. The docs prefer this form for path placeholders.
- **Shell-form equivalent** for older versions: `"command": "python3 \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/block_banned_phrases.py"`.
- **`Stop` takes no matcher**, so the matcher group is left out.

`.claude/hooks/block_banned_phrases.py`:

```python
#!/usr/bin/env python3
"""PreToolUse hook: block Write/Edit calls that put banned phrases into the guarded folder.

Exit 0  = no objection (normal permission flow continues).
Exit 2  = block the tool call; stderr is shown to Claude as the reason.
"""
import json
import os
import re
import sys
from pathlib import Path

PROJECT = Path(os.environ.get("CLAUDE_PROJECT_DIR", ".")).resolve()
LEXICON = PROJECT / ".claude" / "lexicon.json"


def main() -> int:
    try:
        event = json.load(sys.stdin)
        lexicon = json.loads(LEXICON.read_text(encoding="utf-8"))
    except (ValueError, OSError) as err:
        # Deliberate trade-off: fail open. A broken hook should not stop all work.
        print(f"banned-phrases hook skipped: {err}", file=sys.stderr)
        return 0

    tool_input = event.get("tool_input", {})
    path = Path(tool_input.get("file_path", "")).resolve()
    guarded = (PROJECT / lexicon.get("guarded_folder", "")).resolve()
    if guarded != path and guarded not in path.parents:
        return 0  # outside the folder this hook protects

    if event.get("tool_name") == "Write":
        text = tool_input.get("content", "")
    else:  # Edit
        text = tool_input.get("new_string", "")

    hits = []
    for entry in lexicon.get("banned", []):
        pattern = r"\b" + re.escape(entry["phrase"]) + r"\b"
        if re.search(pattern, text, flags=re.IGNORECASE):
            hits.append(f'- "{entry["phrase"]}": {entry.get("why", "banned")}')

    if hits:
        print(
            f"Blocked: {path.name} would contain banned phrases.\n"
            + "\n".join(hits)
            + "\nRewrite the text without them. The list lives in .claude/lexicon.json.",
            file=sys.stderr,
        )
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

`.claude/hooks/require_citations.py`:

````python
#!/usr/bin/env python3
"""Stop hook: if the final answer states figures without a citation marker,
send it back once so Claude can fix it in the same turn."""
import json
import re
import sys

FIGURE = re.compile(r"\d[\d,]*(?:\.\d+)?\s?%|\d{1,3}(?:,\d{3})+|\d+\.\d+|\b\d{2,}\b")
CITATION = re.compile(r"\[\d+\]|\[source:[^\]]+\]", re.IGNORECASE)
CODE = re.compile(r"```.*?```|`[^`]*`", re.DOTALL)


def main() -> int:
    try:
        event = json.load(sys.stdin)
    except ValueError:
        return 0  # fail open: never trap the session on a bad payload

    if event.get("stop_hook_active"):
        return 0  # already sent back once this turn; let Claude stop

    answer = CODE.sub(" ", event.get("last_assistant_message") or "")
    sentences = re.split(r"(?<=[.!?])\s+|\n+", answer)
    uncited = [s.strip() for s in sentences if FIGURE.search(s) and not CITATION.search(s)]
    if not uncited:
        return 0

    examples = "\n".join(f"- {s[:120]}" for s in uncited[:3])
    print(json.dumps({
        "decision": "block",
        "reason": (
            "Some figures have no citation marker. Add [1]-style markers with a "
            "source list, or remove the figure. Do not restart the answer; fix "
            "only these lines:\n" + examples
        ),
    }))
    return 0


if __name__ == "__main__":
    sys.exit(main())
````

Design choices to explain in the article:

- **PreToolUse uses exit 2 + stderr.** This is the simplest documented path. The stderr text becomes Claude's denial reason, so it should say what to do next, not just "no".
- **Stop uses JSON `decision: "block"` + `reason` with exit 0.** This is the documented Stop shape. The reason asks for a targeted fix, not a restart. That echoes production note 4 without adding detail to it.
- **`stop_hook_active` gives "once".** On the second stop in the same turn the hook steps aside. Claude Code's 8-in-a-row cap is a backstop, not the design.
- **The path check sits inside the script** because matchers only see tool names.

### 3.2 Verification done

**Unit tests:** sample JSON piped into each script.

| Case                                                                     | Result                                                     |
| ------------------------------------------------------------------------ | ---------------------------------------------------------- |
| Write to `reports/` containing "Guaranteed … risk-free"                  | exit 2, both phrases listed                                |
| Write to `reports/` with clean text                                      | exit 0                                                     |
| Write outside `reports/` containing a banned word                        | exit 0 (out of scope)                                      |
| Edit whose `new_string` has "will definitely"                            | exit 2                                                     |
| Path `reports/../reports_evil/q.md`                                      | resolves outside the guarded folder, exit 0                |
| Malformed stdin                                                          | exit 0, message on stderr (fail open)                      |
| Stop: "Revenue grew 12% in 2025." plus a cited sentence and a code block | blocks, listing only the uncited sentence. Code is ignored |
| Same input with `stop_hook_active: true`                                 | exit 0                                                     |
| Answer with no figures                                                   | exit 0                                                     |

**Live runs (Claude Code v2.1.289, `claude -p`):**

1. **PreToolUse.** Asked Claude to write "Our plan is guaranteed to work." to `reports/note.md`. The write was blocked, the file was not created, and Claude quoted the hook's stderr reason back word for word.
2. **Stop.** Asked a one-sentence question whose answer contains figures. The debug log shows the Stop hook returned `decision: block` on the first stop. Claude revised the answer in the same turn and added a `[1]` marker and source line. The turn then ended normally.

**Checked against the docs:**

- Exit-2 semantics (1.7)
- `Write`/`Edit` input fields and absolute `file_path` (1.6)
- Stop JSON shape and `stop_hook_active` (1.8, 1.9)
- Exec-form `args` with `${CLAUDE_PROJECT_DIR}` (1.5)

### 3.3 Limits the article should state honestly

- **The Bash bypass.** A `Write|Edit` matcher does not see files written through `Bash` (for example `echo … > reports/x.md`). The docs make the same point for `PostToolUse`. To close the gap:
  - add a permission deny rule for Bash writes into `reports/`, or
  - also run the scanner in CI on the files themselves (production note 7), or
  - use a `FileChanged` hook for detection only (it cannot block).
- **Edit sees only the fragment.** The script checks `new_string`, not the resulting file. A banned phrase split across an old/new boundary would slip through. The CI check catches it.
- **`NotebookEdit` is not covered** by this matcher.
- **Fail-open is a choice.** A missing lexicon also fails open. For a hard policy, flip both `except` branches to `return 2`. The docs warn that only exit 2 blocks, and that a timed-out command hook does not block.
- **The Stop hook fires on every turn**, including coding answers. Numbers like port 8080 or line numbers in plain prose will trigger it, although code spans are stripped. Suggest scoping in a real project, for example running only when a `reports/` file changed this turn, or using a stricter figure pattern. Keep the article example simple and name the trade-off.
- **Workspace trust.** Hooks in a committed `.claude/settings.json` run automatically in `-p`/SDK runs. Readers should treat hook scripts as code that runs with their permissions.

## 4. Originality and confidentiality check

- **Not from the course:** the scenario (report folder, promise/hype lexicon, citation-marker Stop hook) shares nothing with the course's project, sequence or tools.
- **Blocklist and claims:** no client, people, product, vendor or repo names. No numbers about the client work were added. The only numbers in this brief are from the docs (timeouts, caps, version numbers) and from the example's test data.
- **Blocklist scan:** this file was checked against the confidential-terms list after writing (see return summary).

## Editor's notes (2026-10-04)

- **Opening:** led with the "nine times out of ten is a suggestion" line, then the rule list; trimmed repetition ("The trouble is 'most of the time'").
- **Headings:** "The idea" became "The idea: hooks are turnstiles"; "Try it" became "Try it by hand, then live". Template order checked: idea, working example, production, pitfalls, checklist, further reading.
- **Filler cut:** removed "ten minutes" build-time claim, "There are many", and several wordy phrases in the production and pitfalls sections. No claims or numbers added; production notes keep their meaning and the "in our setup" qualifier.
- **Length:** prose (excluding code) now about 2,330 words, inside the 1,500–2,500 range.
- **Code:** all code blocks unchanged; they match section 3 of this brief.
- **Links:** all five are official `code.claude.com/docs/en/...` pages, as cited in section 0.
- **Sidecar:** summary now defines "hook" in plain words for juniors; the first video beat lost a mild overstatement ("makes it every time").
- **Checks:** article and sidecar re-scanned against the confidential-terms list: no matches.
