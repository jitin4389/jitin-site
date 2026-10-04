Your best prompt works for you and drifts for everyone else.

Every team I have worked with keeps a few favourite prompts. Some live in a notes app, some in a pinned chat message, some only in one person's head. "Draft the release notes, breaking changes first." "Write a brief before we design anything."

The drift is not about wording. It is about what the prompt quietly assumes. The author knows which git range to look at, which file sets the format, and that nothing should be pushed until a human has read it. A teammate who pastes the same text does not, and the agent fills the gaps with guesses.

Claude Code lets you save a prompt as a file and run it by typing `/name`. The saving is the least interesting part. The gain comes when you treat the file as a contract for a repeatable task: what it reads, what it may do, and what it hands back.

## The idea: a command is a contract

A **custom slash command** is a Markdown file. Its file name becomes the command you type, and its body is the prompt Claude Code hands to Claude when you run it. Optional settings go in **frontmatter**, a short YAML block between two `---` lines at the very top of the file.

One recent change first. At the time of writing, the official docs have merged custom commands into **skills** (Part 5 covers skills properly). A file at `.claude/commands/deploy.md` and a skill at `.claude/skills/deploy/SKILL.md` both create `/deploy` and work the same way. The docs call the command file "the older format" and say it still works. I start with a command file because it is the smallest thing that can work, and it can move into a skill folder later without changing how anyone runs it.

Where you put the file decides who gets it:

| Location                                           | Who gets it                                            |
| -------------------------------------------------- | ------------------------------------------------------ |
| `.claude/commands/<name>.md` in the repo           | Everyone who clones the repo, once you commit it       |
| `~/.claude/commands/<name>.md` in your home folder | You, in every project on your machine                  |
| A plugin's `commands/` or `skills/` folder         | Anyone with the plugin enabled, as `/plugin-name:name` |

A subfolder becomes part of the name: `.claude/commands/frontend/component.md` runs as `/frontend:component`. Older tutorials say a subfolder only changes a label in the menu; the current docs say otherwise.

So what makes a command a contract rather than a saved prompt? I look for three things.

**It gathers its own context.** A line written as `` !`git log --oneline -5` `` is a shell command that Claude Code runs _before_ Claude sees anything. The line is replaced with the command's output, so Claude receives facts, not a reminder to go and find them. An `@path` reference attaches a file in the same spirit.

**It constrains its tools.** The `allowed-tools` field lists the tools Claude may use without asking, for the turn that runs the command only. The grant clears when you send your next message. It does not block anything else: other tools still go through your normal permission rules, and deny rules still win. To take tools away while a command is active, there is a separate `disallowed-tools` field. Separately, `disable-model-invocation: true` means only a person can start the command. Claude cannot decide to run it on its own.

**It produces the same shape every time.** Fixed headings, fixed groups, explicit stop conditions and a closing checklist. When the output always looks the same, a reviewer can scan it in seconds and the next step, human or automated, can rely on it.

Arguments are how the caller fills in the blanks. `$ARGUMENTS` is everything typed after the command name. `$0` is the first argument and `$1` the second. That is zero-based; older posts often count from one. You can also name arguments in frontmatter, which I prefer because the body reads like plain English.

## A working example

Two commands you can try today in any git repository with at least one tag: a project command the whole team shares, and a personal one.

### A project command: `/release-notes`

Create `.claude/commands/release-notes.md` and commit it:

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

If your repo has no `CHANGELOG.md`, either create a short one or delete the "House style" section.

Run it from the start of a message:

```text
/release-notes v0.1.0 customers
```

What each part does:

- **`arguments: [since, audience]`** turns the two words you type into `$since` and `$audience`. A missing named argument becomes empty text. A missing numbered one, such as `$1`, stays in the prompt literally, which is harder to guard against.
- **The two `!` lines** run before Claude reads anything, so the commit list is a fact, not something Claude has to remember to look up.
- **`allowed-tools`** pre-approves exactly those two git commands. The docs describe this as the way to make sure the pre-run commands are allowed, because they never stop to ask you.
- **`disable-model-invocation: true`** keeps this a deliberate act. Release notes are something you decide to run.
- **The last paragraph** is a review gate. The command drafts; a person publishes.

When I tested this in a throwaway repo, the normal run put the breaking change first with a migration line, ended each bullet with its hash, and printed the checklist without touching any file. With no argument, the commit list came back empty, so Claude stopped as rule 1 says and suggested a ref. With a tag that did not exist, `git log` failed and the whole command stopped before Claude saw it. The docs describe that behaviour: a failing `!` command aborts the invocation, and you see `Shell command failed for pattern "..."`. That is a useful stop. A command that cannot gather its facts should not run on guesses.

One result is worth flagging. With the `customers` audience, Claude left a housekeeping commit out of the notes and said so. That is a sensible call, but it is still a call. If you want every commit included, say so in rule 3. A command is a prompt, not a script.

### A personal command: `/brief`

Create `~/.claude/commands/brief.md` in your home folder:

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

Then, in any project:

```text
/brief let report users schedule a weekly CSV email
```

This one is personal because it encodes how _I_ like to start work. Nobody else's process depends on it. If the team adopts it as a required step, it moves to `.claude/commands/` and gets committed.

If a new command does not appear when you type `/`, run `/reload-skills` (it re-scans command folders too) or restart the session. `/skills` lists everything that is available.

## How I use this in production

My production use of commands comes from client work for a global hedge fund with around $1B in assets under management, where a 15+ person team builds and maintains 12+ sector forecasting models. The details stay private. These are the lessons that travel.

**Stage the chores that have side effects.** The command I rely on most runs a recurring data-update chore. It is written as numbered stages: scan for what is due, search, extract, validate, append, report. Each stage has a stop condition. It refuses to append a value unless independent sources agree. It only ever appends, never rewrites. It never guesses to fill a gap; a gap is reported as a gap. It saves its progress to a session file, so an interrupted run resumes instead of starting over. None of that is clever. It is just written down, in order, in one place.

**Let commands hand work to each other through files.** A content-gathering command reads recent git history across several repositories and writes a summary for stakeholders. A second command turns that summary into a slide deck. Each does one job, and the file between them is the contract. When the deck looks wrong, I can check the summary first and know which half to fix.

**Keep personal habits personal, and commit what the team relies on.** My planning workflow (brief, design options, decision record, plan, review, release check) started as personal commands. As soon as a step became something a reviewer expected to see, it moved into the project's `.claude/commands/` folder. The test I use: if a teammate would be surprised to find the command missing, it belongs in the repo.

**End anything sensitive with a review gate.** Commands that write something sensitive, such as content for people outside the team, finish by showing a draft and a checklist and then stop. They do not publish, push or send. The agent does the drafting, which is the slow part. A person makes the decision, which is the part that carries the risk.

**Fetch context at the start; do not trust memory.** The commands that drifted were the ones that relied on the model remembering where things were from earlier in the session. The reliable ones fetch what they need with `!` lines and `@` references the moment they start. This matters more than it looks, because Claude Code does not re-read a command file on later turns. Whatever the command loaded at the start is what the rest of the task stands on.

## Pitfalls

**A typo in frontmatter does nothing, silently.** Unknown field names are ignored, so `allowed_tools` with an underscore grants nothing and raises no error. If the YAML does not parse at all, the file still loads with no fields set. After writing a command, run it once and check that the frontmatter behaves as you meant it to.

**Counting arguments from one.** `$0` is the first argument and `$1` the second. Mixing this up gives you a command that works with two arguments and quietly misbehaves with one. Named arguments avoid the problem and read better.

**Forgetting that a failing `!` line stops everything.** Any non-zero exit aborts the whole command, except exit code 1 from search and compare tools such as `grep` and `git diff`. Decide which you want. If a failure should stop the run, as with a missing tag, keep it. If a command may fail harmlessly, add `|| true` to it. Also remember that arguments inside `!` lines, such as `$since`, become part of a shell command, so keep those commands narrow and pre-approve only exact patterns.

**Treating `allowed-tools` as a sandbox.** It pre-approves; it does not restrict, and it lasts for one turn. Use permission deny rules or `disallowed-tools` to take things away. Also review `allowed-tools` in any repo you did not write: the docs note that workspace trust does not gate these grants, so a committed command can pre-approve tools even in a folder you never trusted. Organisations can switch these grants off in managed settings.

**Leaving side-effect commands open to the model.** Without `disable-model-invocation: true`, Claude may run a command on its own when it thinks the moment is right. For anything that deploys, writes, sends or deletes, make it manual-only. It also keeps the command's description out of Claude's context until you need it.

**Putting hard rules only in the command body.** A command is a prompt, so the model still makes judgement calls, as the release-notes test showed. If a rule must hold every time, such as "never write outside this folder", enforce it with a hook (Part 6) and keep the command for the workflow.

## Checklist

- [ ] List the three prompts you paste most often and pick the one teammates also use.
- [ ] Save it as `.claude/commands/<name>.md` with a `description` and an `argument-hint`.
- [ ] Replace "first look at..." sentences with `!` lines or `@` references that fetch the facts.
- [ ] Pre-approve only the exact commands those lines need in `allowed-tools`.
- [ ] Fix the output shape: headings, groups, stop conditions and a closing checklist.
- [ ] Add `disable-model-invocation: true` if it has side effects, and end with "stop for review".
- [ ] Run it with no arguments and with bad arguments, and make sure it stops cleanly.
- [ ] Commit it, and move personal-only commands to `~/.claude/commands/`.

## Further reading

- [Extend Claude with skills](https://code.claude.com/docs/en/skills): custom commands, frontmatter, arguments and `!` context injection, all on one page.
- [Commands](https://code.claude.com/docs/en/commands): the built-in commands and bundled skills.
- [Interactive mode](https://code.claude.com/docs/en/interactive-mode): keyboard shortcuts and how `/` and `@` work in the prompt box.
- [Explore the .claude directory](https://code.claude.com/docs/en/claude-directory): where project and personal files live.
- [Plugin manifest reference](https://code.claude.com/docs/en/plugins-reference): sharing commands across many repos as a plugin.
- [Configure permissions](https://code.claude.com/docs/en/permissions): the allow and deny rules that `allowed-tools` works alongside.
