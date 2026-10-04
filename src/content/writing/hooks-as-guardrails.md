A rule your coding agent follows nine times out of ten is not a rule. It is a suggestion, and you find the tenth time after it has shipped.

Every team that works with an agent builds up a list of rules. Do not touch that folder. Never use these words in client documents. Always cite a number. The first instinct is to write them into the prompt or into `CLAUDE.md` and trust the model.

That works most of the time. In my experience the misses cluster in the worst places: long sessions, late in the context window, and work handed from one agent to another.

This part moves the rules that matter out of prose and into code. Claude Code calls that code a hook. Prompts are requests. Hooks are rules.

## The idea: hooks are turnstiles

A **hook** is a handler that Claude Code runs automatically at a fixed point in its lifecycle. The most common kind is a shell command. Claude Code passes it a JSON description of what is about to happen (or what just happened) on standard input, and the script answers through its exit code, its error output or a small JSON reply.

The fixed points are called **hook events**. The list grows with each release, so I name only the ones a guardrail usually needs:

| Event              | When it fires                                                       | Can it block?                                             |
| ------------------ | ------------------------------------------------------------------- | --------------------------------------------------------- |
| `PreToolUse`       | After Claude has chosen a tool and its inputs, before the tool runs | Yes                                                       |
| `PostToolUse`      | After a tool has succeeded                                          | No. The tool already ran, but your message reaches Claude |
| `UserPromptSubmit` | Before Claude processes a prompt                                    | Yes                                                       |
| `Stop`             | When Claude finishes responding                                     | Yes. Blocking makes Claude keep working                   |
| `SubagentStop`     | When a sub-agent finishes                                           | Yes. Same idea, for the sub-agent                         |

The mental model I use is a turnstile. The model decides where it wants to go. The hook decides whether the gate opens. The model cannot talk its way past a turnstile, and it does not need to remember the turnstile is there.

Three documented facts make this more than a metaphor:

- **Exit code 2 blocks.** On events that can block, a script that exits with code 2 stops the action, and whatever it printed to standard error is shown to Claude as the reason. Any other non-zero exit code, including the usual 1, is treated as a non-blocking error and the action goes ahead. The docs are blunt about it: if a hook is meant to enforce a policy, use exit 2.
- **A `PreToolUse` deny holds in every permission mode.** It fires before the permission check, so it still blocks when someone runs with permissions bypassed. The reverse is not true: a hook cannot approve something your permission rules deny. Hooks can tighten the rules, never loosen them.
- **Hooks from your settings files also fire inside sub-agents.** A sub-agent's tool calls trigger the same `PreToolUse` and `PostToolUse` hooks as the main conversation, and the input tells you which agent made the call.

Hooks live in the same settings files as everything else. `~/.claude/settings.json` applies to all your projects. `.claude/settings.json` applies to one project and is meant to be committed, which is where shared rules belong. `.claude/settings.local.json` is for your personal, uncommitted tweaks. Hooks from different levels add up rather than replace each other.

A good guardrail has three properties. It runs at a **well-defined moment**, so you know exactly what it can and cannot see. It **fails loudly**, so a block comes with a reason the model (and a human) can act on. And it is **cheap to change** by the people who own the rule, who are often not the people who write the code.

## A working example

Here is a small scenario to build yourself. A project keeps client-facing write-ups in a `reports/` folder. Two rules apply:

1. Reports must not contain promise or hype words.
2. Any figure in Claude's final answer needs a citation marker such as `[1]`.

Both rules used to be sentences in a prompt. We will turn them into code. The layout is:

```text
.claude/
  settings.json
  lexicon.json
  hooks/
    block_banned_phrases.py
    require_citations.py
```

The scripts use only the Python standard library, so you need `python3` on your path and nothing else.

### The rule data

The banned words live in a data file, not in the script. Anyone on the team can edit it without touching code.

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

I used JSON so the hook needs no extra packages. If your editors prefer YAML, `yaml.safe_load` works the same way, but it needs PyYAML installed.

### The wiring

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

The configuration nests three levels deep: the event, then a **matcher group** (which tools it applies to), then one or more handlers. `Write|Edit` is an exact list of tool names. `Stop` does not support matchers, so its group has none.

Because `args` is present, Claude Code starts `python3` directly with no shell in between, and fills in `${CLAUDE_PROJECT_DIR}` with the project root. The docs prefer this "exec form" for any hook that uses a path placeholder. If your version of Claude Code predates `args`, the shell form is `"command": "python3 \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/block_banned_phrases.py"`.

### The gate before a write

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
    folder = lexicon.get("guarded_folder", "").strip()
    if not folder:
        # Guard a folder, not the world: no folder configured means nothing to check.
        print("banned-phrases hook: no guarded_folder in lexicon.json", file=sys.stderr)
        return 0
    guarded = (PROJECT / folder).resolve()
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

Three choices are worth calling out.

The path check lives inside the script. Matchers only see tool names, never file paths, so the script reads `tool_input.file_path` (always an absolute path for `Write` and `Edit`) and resolves it. Resolving means a sneaky `reports/../elsewhere/` path is judged by where it really points.

The error message tells Claude what to do next. Claude reads the standard error text as the reason for the block, so "Blocked" alone would leave it guessing. A list of the offending phrases, with the reason for each, lets it rewrite in one attempt.

It fails open. If the input or the lexicon cannot be read, the hook steps aside. That is a choice, not an accident, and I come back to it in the pitfalls.

### The check before Claude stops

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

This one uses the JSON route instead of exit 2. A `Stop` hook that prints `{"decision": "block", "reason": "..."}` and exits 0 tells Claude not to stop yet, and the `reason` becomes its instruction. Claude Code hands the hook the final answer in `last_assistant_message`, so there is no need to dig through the transcript file.

The `stop_hook_active` check is what makes this "send back once". When Claude is already continuing because of a stop hook, that flag is `true`, and the hook lets it finish. Claude Code also has its own cap on how many times in a row stop hooks can keep a turn going, but treat that as a backstop, not a design.

### Try it by hand, then live

Test the scripts by hand before you trust them. Pipe in a sample event and check the exit code:

```bash
printf '%s' '{"tool_name":"Write","tool_input":{"file_path":"'"$PWD"'/reports/q3.md","content":"Our plan is guaranteed to work."}}' \
  | CLAUDE_PROJECT_DIR="$PWD" python3 .claude/hooks/block_banned_phrases.py
echo "exit code: $?"
```

You should see the block message and `exit code: 2`. I use `printf '%s'` rather than `echo` because some shells rewrite escape sequences inside `echo`, which quietly breaks the JSON.

Then start Claude Code in the project and ask it to write "Our plan is guaranteed to work." into `reports/note.md`. The write is refused, no file appears, and Claude repeats the hook's reason. Next ask a question whose answer will include a figure. Watch Claude revise its answer and add a citation marker before the turn ends. Type `/hooks` to see both hooks listed with their source. That menu is a read-only browser; you change hooks by editing the settings file.

## How I use this in production

My production experience with hooks comes from client work for a global hedge fund with around $1B in assets under management. We built agents that research and explain sector forecasting models. The details stay private; the lessons travel.

**Rules start as sentences and end as code.** Nearly every rule we have began as a line in a prompt. The ones that mattered ended up as hooks or validators, because prompt-only rules were followed inconsistently. The surprise was where breaches came from: often not the model ignoring the rule, but one agent asking another to do what the rule forbids. A hook does not care who asked.

**Guard a folder, not the world.** One pre-tool hook blocks banned vocabulary and forecast language in written output. It scans only the folder it guards. In our case it fails open if it cannot parse its input, because a broken hook stopping every edit was worse for us than a missed check that CI would catch later. That was a deliberate trade-off. For a hard policy, failing closed is the safer default.

**Let the rule owners own the rule.** The banned vocabulary lives in a lexicon file that non-engineers edit. Changing the list needs no code review of the hook. This mattered more than any clever matching logic. The people who know which words are risky are rarely the people who write Python.

**Send it back once, with a precise reason.** A stop hook returns an answer once to fix numbers that have no citation. It replaced an earlier approach that threw the answer away and retried from scratch. Retrying made answers worse: the model lost the good parts along with the bad. A targeted "fix only these lines" kept what worked.

**Enforce in the hook as well as the configuration.** A web-research gate refuses figures for periods that have not finished yet. A per-turn roster decides whether web access is on at all. We enforce that in a hook as well as in the disallowed-tools list, because the hook also fires inside sub-agents.

**Use the agent's identity to scope access.** Another hook enforces which sub-agent may call which data source. The hook input carries the agent's type, so the check is a simple lookup. We did this because declarative restrictions did not apply to nested agents in our setup. Check your own setup rather than assuming either way.

**Run the same checks in CI.** Hooks are plain scripts, so the same logic runs in continuous integration against the files themselves. A separate validator turns block-level violations into hard failures and records warnings as events. That covers the paths a hook cannot see.

## Pitfalls

**Exiting with 1 instead of 2.** Exit 1 is the Unix habit for failure, but Claude Code treats it as a non-blocking error and lets the action through. So does a crash or a mistyped script path, which leaves the gate silently disabled. Use exit 2 (or a JSON deny) for anything that must block, and test the block path by hand.

**Believing a stalled hook is a gate.** If a command hook on `PreToolUse` times out, the tool call is not blocked; it carries on through the normal permission flow. Keep guardrail hooks fast, set an explicit `timeout`, and do not put network calls in the critical path unless you have to. (The Agent SDK behaves differently here: a timed-out `PreToolUse` callback blocks.)

**Forgetting the side doors.** A `Write|Edit` matcher does not see a file written by a shell command such as `echo ... > reports/x.md`, and it does not cover `NotebookEdit`. An `Edit` check sees only the new fragment, not the whole file. Close the gaps with a permission deny rule for shell writes into the folder, and run the same scanner in CI on the finished files.

**Copying old matchers and fields.** Older blog posts use `Edit|MultiEdit|Write` or a top-level `decision: "approve"` on `PreToolUse`. The current reference uses `Edit|Write` and puts `permissionDecision` inside `hookSpecificOutput`. A field at the wrong level does not do what you expect, and JSON preceded by stray text from a shell profile is ignored. Check the reference, not a tutorial.

**Stop hooks that never let go.** A `Stop` hook fires every time Claude finishes responding, not just at the end of a task. Without the `stop_hook_active` check it can keep sending Claude back, and if its pattern is too broad it will fire on ordinary coding answers too. In the example, a port number or a line number in plain prose can trigger it. Scope it in a real project, for example by checking only when a report file changed.

**Trusting hooks you did not write.** Command hooks run with your full user permissions. In an interactive session Claude Code holds back a project's hooks until you accept the folder's trust prompt, unless you have already trusted a parent folder. In non-interactive runs (`claude -p` or the SDK) there is no prompt, so a repository's committed hooks run. Read the `.claude/` folder of any repo before you script against it, or pass `--settings '{"disableAllHooks": true}'`.

## Checklist

- [ ] List the three rules your team repeats most often in prompts, and pick one that would hurt if broken.
- [ ] Decide which event fits it: before a tool runs (`PreToolUse`), or before Claude finishes (`Stop`).
- [ ] Move the rule's data (words, paths, sources) into a file the rule owner can edit.
- [ ] Write the hook so a block exits 2 (or returns a JSON deny) with a reason that says what to do next.
- [ ] Decide on purpose whether it fails open or closed, and write the choice in a comment.
- [ ] Test it by piping sample JSON in and checking the exit code, including the "should block" case.
- [ ] Commit it in `.claude/settings.json` so the whole team gets it, and confirm it in `/hooks`.
- [ ] Run the same script in CI against the files, to catch what the hook cannot see.

## Further reading

- [Hooks reference](https://code.claude.com/docs/en/hooks): every event, input field, exit code and JSON output.
- [Automate actions with hooks](https://code.claude.com/docs/en/hooks-guide): the guide, with worked examples and troubleshooting.
- [Settings](https://code.claude.com/docs/en/settings): where settings files live and how they take precedence.
- [Permissions](https://code.claude.com/docs/en/permissions): deny rules and permission modes, which work alongside hooks.
- [Hooks in the Agent SDK](https://code.claude.com/docs/en/agent-sdk/hooks): the same idea as callback functions in your own agents.
