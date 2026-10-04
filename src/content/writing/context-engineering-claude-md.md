Most of the bad agent output I have seen was not the model's fault. The agent ran the wrong test command because nobody told it the right one. It put database code in the HTTP layer because the boundary lived only in a senior engineer's head. It did time-zone maths in its head and got it wrong, confidently.

The instinct is to blame the model or reach for a bigger one. The fix is usually cheaper. The agent was missing context, its context was stale, or the one rule that mattered was buried under everything else.

So I now treat context as a product I design. It has users (the agent, and the colleagues who maintain it), a budget (the context window) and a release process (review, test, trim). This part shows how to design it in Claude Code.

## The idea: what Claude sees, and when

Every Claude Code session starts with a fresh **context window**. That is the working memory of the model: everything it can "see" while it answers, measured in tokens (small chunks of text). Your conversation, the files Claude reads, the output of commands it runs and your project instructions all share that one space.

Nothing from yesterday's session is in there unless something puts it there. Two things carry knowledge across sessions:

- **CLAUDE.md files**, which you write.
- **Auto memory**, notes Claude writes for itself as it works. It is on by default, and you can review or switch it off with `/memory`.

This article is about the first one, because it is the one you control and can review in a pull request.

I find it useful to sort everything an agent might need into three buckets.

| Bucket           | What goes in it                                                                                     | Where it lives in Claude Code                                                  |
| ---------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Always know      | Build and test commands, layout, conventions, how to behave when unsure                             | Project `CLAUDE.md` and anything it imports with `@`                           |
| Load when needed | Rules for one part of the codebase, multi-step procedures, reference material                       | Path-scoped rules in `.claude/rules/`, `CLAUDE.md` files in subfolders, skills |
| Keep out         | Things Claude can work out from the code, dates and "current sprint" notes, secrets, long histories | Nowhere. Let Claude read the code instead                                      |

A few facts about how Claude Code handles these files shape every decision below.

**CLAUDE.md is context, not configuration.** Its content reaches the model as a message after the system prompt. Claude reads it and usually follows it, but nothing enforces it. If an action must never happen, block it with a hook or a permission rule. Part 6 of this series covers that.

**Files stack; they do not override.** Claude Code can load a user file (`~/.claude/CLAUDE.md`), a project file (`./CLAUDE.md` or `./.claude/CLAUDE.md`), a personal project file (`./CLAUDE.local.md`, which you add to `.gitignore` yourself) and an organisation-wide managed file. It also walks up the directory tree from where you launched it. All of these are concatenated. If two instructions contradict each other, the docs say Claude may pick one arbitrarily.

**Imports organise; they do not save space.** A line such as `@docs/architecture.md` pulls that file in at launch. That keeps the main file tidy, but every imported line still costs context in every session.

**Some things load only on demand.** A `CLAUDE.md` in a subfolder loads when Claude reads files in that folder. A rule file in `.claude/rules/` with a `paths:` list loads when Claude reads or edits a matching file. Skills show only a short description until they are used. These are your tools for keeping the "always know" bucket small.

**Short beats long.** Anthropic's guidance is to keep each CLAUDE.md under about 200 lines. Longer files use more context and are followed less reliably. Write instructions you could check: "Run `uv run pytest -q` before committing" works better than "test your changes".

**Long sessions get summarised.** When the conversation approaches the window's limit, Claude Code compacts it: older tool output is cleared first, then the conversation is summarised. The project-root CLAUDE.md is re-read from disk after that. A rule you only typed in chat may not survive.

## A working example

Here is a small example you can try in a few minutes. It is the context for an imaginary Python service, `reminders-service`, that schedules appointment reminders and sends them by email or SMS. You do not need the service's code to see the context working.

Create this layout in an empty folder:

```text
reminders-service/
├── CLAUDE.md
└── docs/
    ├── architecture.md
    └── testing.md
```

`CLAUDE.md` holds what Claude must always know, and imports two short docs:

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

`docs/architecture.md` records the boundaries that are hard to infer from code alone:

```markdown
# Architecture

- `api/` receives HTTP requests and validates input. It never sends messages directly.
- `scheduler/` decides when a reminder is due. Pure functions; it takes the current time as an argument.
- `channels/` sends email and SMS. One module per provider, behind the `Channel` protocol.
- `store/` is the only package that talks to the database.

Dependencies point inwards: `api` -> `scheduler` -> `store`. `channels` is called only by `scheduler/dispatch.py`.
```

`docs/testing.md` records how the team tests:

```markdown
# Testing

- Run one test: `uv run pytest tests/scheduler/test_due.py::test_due_at_boundary -q`
- Tests never touch the network. Use the `fake_channel` fixture from `tests/conftest.py`.
- Tests never call the real clock. Pass a fixed `now` into scheduler functions.
- Every bug fix starts with a failing test that reproduces it.
```

Now check that it loaded. Start Claude Code in the folder and run `/context`:

```bash
cd reminders-service
claude
```

In the `/context` output, look at the list under **Memory files**. You should see `CLAUDE.md` and both imported docs. Then ask a question that only an imported doc can answer, such as "Which package is allowed to talk to the database?" or "Which fixture replaces the network in tests?". Claude should answer `store/` and `fake_channel` without opening any files.

You can also do the same check without the interactive session, using print mode with tools switched off:

```bash
claude -p "Without reading any files: which package may talk to the database, and which test fixture replaces the network?" --tools ""
```

Three details in that CLAUDE.md are deliberate.

- **The imports sit outside backticks.** Claude Code skips `@` paths inside code spans and code blocks. Write `` `@docs/testing.md` `` and the file silently never loads.
- **The "Instruction hierarchy" is guidance, not a guarantee.** Claude Code itself does not rank instructions. Writing the order down gives the model a way to resolve conflicts and, just as useful, asks it to tell you when it hits one.
- **The "Compact instructions" section** tells Claude what to keep when a long session is summarised. You can also steer a single compaction with `/compact keep the failing tests and the migration plan`.

### Step two: move testing rules to "load when needed"

The imports work, but `docs/testing.md` now costs context in every session, including sessions where nobody touches a test. Move it to a path-scoped rule instead. Delete the `How we test` line from `CLAUDE.md` and create `.claude/rules/testing.md`:

```markdown
---
paths:
  - "tests/**/*.py"
---

# Testing rules

- Run one test: `uv run pytest tests/scheduler/test_due.py::test_due_at_boundary -q`
- Tests never touch the network. Use the `fake_channel` fixture from `tests/conftest.py`.
- Tests never call the real clock. Pass a fixed `now` into scheduler functions.
- Every bug fix starts with a failing test that reproduces it.
```

This rule loads only when Claude reads or edits a file under `tests/`. To check it, ask Claude to open any file under `tests/`, then run `/context`: the rule should now appear among the loaded memory files. There is one trade-off to know. After compaction, path-scoped rules are summarised away and come back only when Claude next reads a matching file. If a rule must hold all the time, keep it in the project-root CLAUDE.md.

## How I use this in production

I build agent systems for a global hedge fund with ~$1B AUM: research and forecasting workflows behind 12+ sector forecasting models, working with a 15+ person cross-functional team. Most of the context lessons I trust came from there. I describe them here as patterns, without client detail.

**Write the hierarchy down.** Our agents had several layers of instructions: general agent guidance, shared rules about terminology, and domain methodology. When two layers disagreed, the agent sometimes picked the wrong one.

What fixed it was an explicit instruction hierarchy, where the domain methodology outranked general guidance, plus a request to flag conflicts. Claude Code stacks layers the same way and does not rank them, so I now add a short hierarchy section to every serious CLAUDE.md.

**Keep the stable part stable.** We split prompts into a large static part and a small time-sensitive part (today's date, facts about the current session). Only the static part was cached.

The lesson for CLAUDE.md is simple: no dates, no "this sprint we are...". Notes like that go stale and keep misleading the agent long after they stop being true. Cost is a secondary reason: Claude Code puts project context such as CLAUDE.md near the start of every request, and caching matches on an exact prefix, so a file that stays stable is cheaper to reuse. Editing the project CLAUDE.md mid-session does not take effect until `/clear`, `/compact` or a restart.

**Show a menu, load the meal.** Our forecasting methodology was far too long to keep in front of the agent all the time. We packaged it so only a short description was always visible and the detail loaded on demand, with a routing table that pointed each kind of question to one section. In Claude Code, skills and path-scoped rules do this job. A routing table in CLAUDE.md ("for X, read Y") is a cheap first step. Part 5 goes deeper.

**Give fresh agents a reading order.** Sub-agents start with an empty context window. Most get their own instructions, the CLAUDE.md files, and the task message the main agent writes, but none of your conversation. For agents that started cold we wrote "context packs": what to read, in what order, and which source wins if two disagree. A reading order is really a delegation message you write once and reuse.

**Mine your own sessions.** We went back through real chat sessions and looked for context people kept retyping. Each repeated correction became standing context. Anthropic's guidance says the same thing: when you type the same correction twice, it belongs in CLAUDE.md. Doing it from evidence rather than memory finds things you would not think to add.

**Watch the handover, not only the retrieval.** In one case a sub-agent found exactly the right material. The orchestrating agent then dropped it while rewriting the answer, because its brief never asked it to keep that material.

Only a sub-agent's final message comes back to the main conversation. If you want the evidence, ask the sub-agent to return the evidence, and tell the orchestrator to keep it.

**Run the code, don't think it.** Our models never do arithmetic in their heads; they write and run code. That is why the example above says "Don't do date, time-zone or money arithmetic in your head." One line of context heads off a whole class of confident mistakes.

## Pitfalls

1. **Hiding imports in backticks.** `` `@docs/architecture.md` `` is treated as literal text and never loads. Put `@` paths in plain text, then confirm with `/context`.
2. **Thinking imports save context.** They load at launch, so they cost the same as pasting the text in. To save context, use path-scoped rules, subfolder CLAUDE.md files or skills.
3. **Expecting a mid-session edit to apply.** The project and user CLAUDE.md are read at session start. After editing, run `/clear` or `/compact`, or restart.
4. **Leaving key rules in chat.** Long sessions get summarised, and early chat instructions can be lost. If you say something twice, ask Claude to add it to CLAUDE.md. Note that "remember this" now goes to auto memory; say "add this to CLAUDE.md" if you mean the file.
5. **Treating CLAUDE.md as a guardrail.** It is advice the model usually follows. Anything that must never happen, such as deleting a production folder or pushing to main, belongs in a hook or a permission rule.
6. **Letting files drift and contradict.** User, project and subfolder files pile up, and old instructions linger. Run `/doctor prompt-audit` from time to time; it looks for outdated or conflicting instructions and proposes edits without changing anything until you ask. Also delete what Claude can read from the code itself, such as directory listings or dependency lists.

A note if you read older tutorials: the `#` shortcut for adding a quick memory has been removed. Ask Claude to edit CLAUDE.md, or open it with `/memory`.

## Checklist

- [ ] Run `/init` in one repository, then cut the result down to what Claude truly needs every session.
- [ ] Make every command and rule checkable ("run X before committing", not "be careful").
- [ ] Add a short "When unsure" section and a written instruction hierarchy.
- [ ] Move rules for one part of the codebase into `.claude/rules/` with a `paths:` list.
- [ ] Remove dates, sprint notes and anything Claude can infer from the code.
- [ ] Run `/context` and confirm every expected file appears under **Memory files**.
- [ ] Add a "Compact instructions" section that names what must survive a summary.
- [ ] Put a monthly reminder in your calendar to run `/doctor prompt-audit`.

## Further reading

- [How Claude remembers your project (CLAUDE.md and auto memory)](https://code.claude.com/docs/en/memory)
- [Explore the context window](https://code.claude.com/docs/en/context-window)
- [How Claude Code works](https://code.claude.com/docs/en/how-claude-code-works)
- [Create custom subagents](https://code.claude.com/docs/en/sub-agents)
- [How Claude Code uses prompt caching](https://code.claude.com/docs/en/prompt-caching)
- [Manage costs effectively](https://code.claude.com/docs/en/costs)
