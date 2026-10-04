You ask your agent for one change. It searches the codebase, reads a dozen files, runs the tests twice and pastes the logs. By the time it starts the edit, the context window is full of material it will never use again, and the rule you set an hour ago is buried under it.

The usual fix is "more agents": a reviewer, a tester, a researcher, all talking to each other. In my experience that makes things worse unless you are clear about two things: what each agent is told, and what each agent hands back.

This part is about sub-agents in Claude Code. My argument is simple: sub-agents are not about having more AI. They are about **context isolation** and **clear contracts**. Delegate a task when you can describe it in a short brief and check it from its output. Keep the main agent responsible for the final answer.

## The idea: a contract with two edges

A **sub-agent** is a specialised assistant that Claude Code runs in its own context window. It has its own system prompt, its own list of allowed tools and, optionally, its own model. The main conversation (I will call it the **orchestrator**, the agent that hands out the work) gives it a task. The sub-agent works on its own and returns one final message.

The useful part is what it leaves out. At the time of writing, a normal sub-agent starts with:

- its own system prompt (the body of its definition file),
- the task message the orchestrator writes when it delegates,
- your `CLAUDE.md` files and a git status snapshot,
- the full text of any skills listed in its definition.

It does **not** get the conversation so far, the files the orchestrator already read, or the decisions you agreed ten minutes ago. The Agent SDK docs put it plainly: the only content passed from parent to sub-agent is the prompt string. If the sub-agent needs a file path, an error message or a decision, it has to be in the brief. The exception is a fork (`/subtask`), which inherits the whole conversation and so gives up input isolation.

On the way back, the orchestrator sees only the sub-agent's final message, not the searches, file reads or failed attempts. That is why sub-agents keep the main context clean. It is also where things go missing.

So I think of it as a **contract with two edges**:

| Edge          | What crosses it                    | What can go wrong                                          |
| ------------- | ---------------------------------- | ---------------------------------------------------------- |
| The brief     | One task message, plus `CLAUDE.md` | The sub-agent lacks a path or decision you assumed it knew |
| The hand-back | One final message                  | The orchestrator summarises away the detail you needed     |

Everything in between is the sub-agent's business. If both edges are well defined, you can delegate with confidence. If either is vague, you have swapped one confused agent for two.

### The email test

My test for "should this be a sub-agent?" is whether you could give the task to a contractor by email. "Find where the discount threshold is defined and quote the lines" passes. "Help me with the pricing work" does not.

The docs say the same in a different form. Keep work in the main conversation when it needs lots of back-and-forth, when phases share a lot of context, or when it is a quick, targeted change. Use a sub-agent when the work is self-contained, its output is verbose, or you want to restrict its tools.

### Where sub-agents live

Sub-agents are defined as Markdown files. Project ones live in `.claude/agents/` and should be committed so the team shares them. Personal ones live in `~/.claude/agents/`. The YAML frontmatter at the top holds settings. Only `name` and `description` are required. The body becomes the sub-agent's system prompt.

Claude decides when to delegate by matching your request against each sub-agent's `description`. You can also name one directly ("use the reviewer sub-agent") or @-mention it to guarantee it runs.

## A working example

Here is a small team for a small repo, with three sub-agents and three different jobs:

- an **investigator** that only reads and returns evidence,
- a **test-writer** that adds tests and reports bugs instead of fixing them,
- a **reviewer** that returns a verdict in a fixed format, enforced by a hook.

You need Claude Code, Python 3 with `pytest`, `jq`, and a git repository. If you run it interactively, accept the workspace trust prompt for the folder.

### The layout

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

`src/__init__.py` is an empty file.

### The code under test

The module has one deliberate inconsistency. The docstring says "10 or more units", but the code checks `> 10`.

`src/pricing.py`:

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

`tests/test_pricing.py`:

```python
from src.pricing import apply_discount


def test_apply_discount_basic():
    assert apply_discount(100, 25) == 75
```

### The investigator

Read-only tools, a cheap model and a fixed evidence format. The "Not checked" section matters more than it looks: it tells the orchestrator where the answer might be incomplete.

`.claude/agents/investigator.md`:

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

### The test-writer

This one can edit files and run tests. Its prompt keeps it inside `tests/` and tells it to report bugs rather than fix them.

`.claude/agents/test-writer.md`:

```markdown
---
name: test-writer
description: Writes or extends pytest tests for a named function or behaviour, runs them, and reports results. Use when asked to add tests. Only edits files under tests/.
tools: Read, Edit, Write, Bash
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

Be honest about one thing: "only edits `tests/`" is an instruction, not enforcement. The `tools` field controls which tools a sub-agent has, not which paths it may touch. If the boundary matters, add a `PreToolUse` hook on `Edit|Write` that rejects paths outside `tests/`, as in Part 6 on hooks.

### The reviewer

No `Edit` or `Write`. It keeps `Bash` so it can run `git diff`, which makes it read-only by intention rather than by force. That is a trade-off worth knowing about.

`.claude/agents/reviewer.md`:

```markdown
---
name: reviewer
description: Reviews the current uncommitted diff and returns a fixed-format verdict. Use after code or tests change and before committing.
tools: Read, Bash
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

### Enforcing the hand-back with a hook

A prompt asks for a format. A hook makes sure of it. Claude Code fires a `SubagentStop` hook event when a sub-agent finishes. If the hook exits with code 2, the sub-agent keeps going, and the hook's error output becomes its next instruction.

I put this hook in the project settings file rather than in the sub-agent's frontmatter. Frontmatter hooks in a project sub-agent only run once the folder is trusted, and a non-interactive `claude -p` run does not count as trusted. Settings-file hooks do not have that restriction.

`.claude/settings.json`:

```json
{
  "hooks": {
    "SubagentStop": [
      {
        "matcher": "reviewer",
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

`.claude/hooks/check-review-shape.sh` (run `chmod +x` on it):

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

Two details are deliberate.

- **The matcher is a plain name** (`reviewer`). Plain names match exactly, so it does not catch other agents with "reviewer" in the name. It also skips Claude Code's internal helpers, which fire `SubagentStop` too but report an empty agent type.
- **`stop_hook_active`** stops the hook sending the same report back forever.

One caveat: in auto mode on recent versions, sub-agents deliver their report through the `SubagentHandback` tool, so `last_assistant_message` holds only closing text. There, check the report with a `PreToolUse` hook matched on `SubagentHandback`, which receives it as `tool_input.message`.

### Telling the orchestrator when to delegate

Add this to `CLAUDE.md`. It covers both edges of the contract: what goes into the brief and what must survive the hand-back.

```markdown
## When to delegate

- Questions like "where is X" or "how does Y work": use the `investigator` sub-agent. Keep its file:line evidence in your answer.
- Adding tests: use the `test-writer` sub-agent. It only touches `tests/`.
- Before any commit: use the `reviewer` sub-agent and show its report unchanged.
- Small edits you can make in one or two steps: do them yourself, no sub-agent.
- When you brief a sub-agent, include the file paths and decisions it needs. It cannot see this conversation.
```

### Run it

Interactive is fine: start `claude` in the folder and paste the prompt. To run it headless, put the prompt before `--allowedTools`, because that flag takes several values and will swallow a prompt placed after it.

```bash
git init -q && git add -A && git commit -qm "seed"

claude -p "Use the investigator to find where the bulk discount threshold is defined. Then have the test-writer add tests for bulk_price. Then run the reviewer on the uncommitted changes. Show the reviewer's report exactly as returned." \
  --permission-mode acceptEdits \
  --allowedTools "Read,Grep,Glob,Edit,Write,Bash(python -m pytest *),Bash(python3 -m pytest *),Bash(git diff *),Bash(git status *),Agent"
```

When I ran it, the investigator pointed at the `> 10` line and the docstring. The test-writer added tests, left `src/` alone and reported the `>` versus `>=` mismatch as a probable bug instead of "fixing" it. The reviewer returned the three headings.

### What the first run taught me

One observation is worth more than the success. In my first run the prompt did not ask for the report as returned. With "show its report unchanged" only in `CLAUDE.md`, the orchestrator still reformatted the reviewer's report in its final answer. The content survived. The shape did not. When I put "exactly as returned" in the prompt itself, the report came through as written. That is one run, not a rule, but it matches the docs: the parent may summarise a sub-agent's report unless you tell it not to.

To see the hook work, change the reviewer's prompt to "reply in two or three plain sentences", make a small edit and run the reviewer again. The hook sends the report back once, and the reviewer rewrites it with the headings.

## How I use this in production

My production experience comes from client work for a global hedge fund with around $1B in assets under management. Our agents research and explain a portfolio of 12+ sector forecasting models. The details stay private. These are the lessons that travel.

**Decide what must survive the hand-back.** The lesson that cost us most was a quiet one. A specialist sub-agent selected exactly the right context for a question. The orchestrator then rewrote the answer and dropped it, because its own brief only asked for a summary. Nothing failed. The answer was just worse. Now, whenever we delegate, we write down which parts of the result must reach the user unchanged, and we say so in both the brief and the orchestrator's instructions.

**Hand off through files, not chat history.** Agents pass work to each other through structured files with a standard header, never through conversation history. A file can be opened, diffed and checked by a script. A summary inside another agent's context cannot. It also means a later agent does not depend on how well an earlier one was paraphrased.

**One specialist, one methodology.** Each sector specialist runs in its own context with only its own domain skill loaded. Isolation stops one sector's rules leaking into another's reasoning. A caveat I learned the slow way: the `skills` field controls which skills are preloaded, not which skills a sub-agent can reach. If you want a specialist to have exactly one, also remove the `Skill` tool from what it can call.

**Give every specialist a budget.** Our supervisor exposes specialists as tools, and each has a call budget. Claude Code now ships its own limits on nesting depth and concurrent sub-agents, and `maxTurns` caps a single agent's turns. Platform caps are a safety net. The budget per specialist was our decision, based on what each job should cost.

**Control who may launch whom with a hook.** Data access goes through dedicated sub-agents, and only certain agents may launch each one. We first tried a declarative allowlist, and it did not apply to nested agents. That is now documented: an `Agent(name, ...)` allowlist only works for an agent running as the main session with `claude --agent`. Inside a sub-agent definition, the list in brackets is ignored. A `PreToolUse` hook on the `Agent` tool can do the check instead, because hook input names the calling agent.

**Keep the pipeline outside the model.** Each run follows a plan built from a registry. Every agent declares its inputs, its output file and how critical it is. A critical failure stops the run. A non-critical one lets it continue with a lower confidence score. This is our own code, not a Claude Code feature, and I think that is right. The model is good at the work inside each step. Ordinary code is better at deciding what happens when a step fails.

## Pitfalls

**Vague or overlapping descriptions.** If two sub-agents both say "helps with code quality", Claude may pick the wrong one, or none. Write each `description` so it singles out one agent and says when to use it. Keep it short: every description loads into the main conversation, and Claude Code warns when they add up to more than 15,000 tokens.

**Assuming the sub-agent heard the conversation.** It did not. It gets the brief and your `CLAUDE.md`. If a rule must reach it, such as "ignore the `vendor/` folder", restate it in the brief. Note that the built-in Explore and Plan agents skip `CLAUDE.md` entirely.

**Losing detail at the hand-back.** The orchestrator may summarise. Ask for verbatim output in the prompt itself, or have the sub-agent write its result to a file.

**Silent typos in frontmatter.** Unknown field names are ignored without a message. A file with no `description`, or with the opening `---` not on line 1, is skipped silently. If a sub-agent never runs, check the file before you blame the model. `claude --debug` shows the reason for most skips, and `claude plugin validate .claude/agents` finds frontmatter that does not parse.

**Expecting tools to restrict paths or commands.** `tools` cannot limit a sub-agent to one folder. And `disallowedTools: Bash(git push *)` removes the whole Bash tool, not just that command. Use permission deny rules or a `PreToolUse` hook for fine-grained limits.

**Following an old tutorial.** On current versions, `/agents` no longer opens an interactive wizard. It reminds you to ask Claude to write the file or to edit `.claude/agents/` yourself. Older screenshots will mislead you.

## Checklist

- [ ] List the side tasks that flood your main context, and pick one that you could brief by email.
- [ ] Write one sub-agent for it in `.claude/agents/`, with a description that names when to use it.
- [ ] Give it the fewest tools that work. Read-only agents get no `Edit` or `Write`.
- [ ] Define a short, fixed report shape in its prompt, including a "not checked" section.
- [ ] Add a "When to delegate" section to `CLAUDE.md`, including when not to.
- [ ] Mark anything that must survive the hand-back as "return verbatim", or write it to a file.
- [ ] Enforce the rules that matter with a hook: `SubagentStop` for shape, `PreToolUse` for access.
- [ ] Commit the definitions and review them like code.

## Further reading

- [Create custom subagents](https://code.claude.com/docs/en/sub-agents): file format, every frontmatter field, scopes, built-in agents and when to delegate.
- [Hooks reference](https://code.claude.com/docs/en/hooks): `SubagentStart`, `SubagentStop` and the `agent_id` and `agent_type` fields.
- [Subagents in the Agent SDK](https://code.claude.com/docs/en/agent-sdk/subagents): what sub-agents inherit, how results come back, and depth, concurrency and spend limits.
- [Tools reference](https://code.claude.com/docs/en/tools-reference): how the Agent tool behaves and what the parent sees.
- [CLI reference](https://code.claude.com/docs/en/cli-reference): `--agent`, `--agents` and the flags used in the example.
