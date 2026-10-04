I have watched an agent give a confident number it had worked out in its head. The method said to run the calculation. The method was in its context. It was just one paragraph among many.

Every team has methods like that, mostly in people's heads. How we review a migration. Which assumptions a forecast must state. What counts as "done". With a coding agent, the first instinct is to paste the method into the chat, then into `CLAUDE.md`, then into a longer `CLAUDE.md`. The file grows, every session pays for all of it, and the model still improvises on the parts that matter most.

A skill is how I stopped relying on the model's memory for methodology. This part covers how to design one well: a sharp description, a short set of non-negotiable rules, and detail that loads only when the question needs it.

## The idea: a folder the agent opens when needed

A **skill** is a folder with a `SKILL.md` file in it. The file starts with a small block of YAML settings (the **frontmatter**, between two `---` lines), followed by Markdown instructions. The folder can also hold reference documents, scripts, templates and data.

Claude Code finds skills in a few places. The two you will use most:

| Where                              | Who gets it                                             |
| ---------------------------------- | ------------------------------------------------------- |
| `~/.claude/skills/<name>/SKILL.md` | You, in every project on this machine                   |
| `.claude/skills/<name>/SKILL.md`   | Everyone working in this repository, once you commit it |

Personal skills hold your own habits. Project skills hold the team's agreed way of working, and they go through pull requests like any other code. Plugins and organisation-managed settings can ship skills too.

If you read Part 2, you have met the other half of this. At the time of writing, custom slash commands have been merged into skills: `.claude/commands/deploy.md` and `.claude/skills/deploy/SKILL.md` both give you `/deploy`. A skill adds a folder for supporting files, control over who can invoke it, and automatic loading.

### Progressive disclosure

Skills rest on **progressive disclosure**: the agent sees a little about every skill all the time, and the rest only when it needs it. Anthropic's overview describes three levels:

| Level        | When it loads                     | What it contains                                  |
| ------------ | --------------------------------- | ------------------------------------------------- |
| Metadata     | Always, at the start of a session | The skill's name and description                  |
| Instructions | When the skill is used            | The body of `SKILL.md`                            |
| Resources    | Only when a step needs them       | Reference files Claude reads, scripts Claude runs |

Two consequences shape how I write skills.

**The description is the trigger.** Claude matches your request against the descriptions it can see. A vague description means the skill never fires, or fires on everything. The best-practices guide asks for descriptions in the third person ("Reviews migrations…", not "I can help you…") that say what the skill does and when to use it, in the words people actually type.

**A script costs only its output.** When Claude runs a bundled script, the script's code does not enter the context window. Only what it prints does. So deterministic work (pattern checks, validation, arithmetic) belongs in a script, not in prose the model follows by hand.

### The mental model: a field manual

I think of a good skill as a field manual. The cover tells you when to open it. The first page lists the rules you never break. Then comes an index: for this situation, turn to that page. Nobody reads a field manual cover to cover in the middle of a job.

"Rules first" also has a documented reason. Once a skill is used, its body stays in the conversation. When Claude Code compacts a long session (summarises it to free up space), it re-attaches recent skills but keeps only the start of each one. Whatever is at the top survives.

## A working example

Here is a skill you can build today: a reviewer for PostgreSQL schema migrations. It has a deterministic part (spotting risky statements) and a judgement part (proposing a safer rewrite), which makes it a good fit. It needs Python 3.9 or later and nothing else.

The folder layout:

```text
.claude/skills/database-migration-review/
├── SKILL.md
├── scripts/
│   └── scan_migration.py
└── reference/
    ├── adding.md
    ├── breaking-changes.md
    └── indexes.md
```

### SKILL.md

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

Choices worth pointing out:

- The frontmatter uses only `name`, `description` and `allowed-tools`. claude.ai and the Claude API accept those fields too, so the same folder travels.
- `${CLAUDE_SKILL_DIR}` is replaced with the skill's own folder, in the body and in the `allowed-tools` rule. The command Claude is told to run and the command that is pre-approved stay identical.
- `allowed-tools` **pre-approves** tools for the turn that invokes the skill. It does not restrict anything else.
- Rule 1 says "as its own command, exactly as written" because a rewritten command (a relative path, or something chained on with `;`) no longer matches the approval rule.

### scripts/scan_migration.py

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
     r"\bCREATE\s+(UNIQUE\s+)?INDEX\s+(?!\s|CONCURRENTLY)",
     "CREATE INDEX without CONCURRENTLY blocks writes to the table while it builds."),
    ("drop-index-not-concurrent", "index",
     r"\bDROP\s+INDEX\s+(?!\s|CONCURRENTLY)",
     "DROP INDEX without CONCURRENTLY takes an ACCESS EXCLUSIVE lock on the table."),
    ("add-column-not-null-no-default", "add",
     r"\bADD\s+(COLUMN\s+)?(?![^;]*\bDEFAULT\b)\w+\s+[\w\(\), ]+?\bNOT\s+NULL\b",
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

The scanner is deliberately simple. It finds candidates by pattern and leaves the explanation to the reference files. It exits 0 whenever the scan ran, findings or not, and 2 only when it cannot read the file. That matters if you later use dynamic context injection (a `` !`command` `` line that runs before Claude sees the skill): a non-zero exit there aborts the whole skill.

### The reference files

Each file covers one kind of change, and none of them points to another. Keep references one level deep from `SKILL.md`.

`reference/adding.md`:

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

`reference/breaking-changes.md`:

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

`reference/indexes.md`:

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

### Try it

Create a migration with a few classic mistakes at `migrations/0042_order_status.sql`:

```sql
-- Add order status and speed up customer lookups
ALTER TABLE orders ADD COLUMN status text NOT NULL;
CREATE INDEX orders_customer_id_idx ON orders (customer_id);
ALTER TABLE orders RENAME COLUMN total TO total_amount;
ALTER TABLE orders ADD CONSTRAINT orders_customer_fk FOREIGN KEY (customer_id) REFERENCES customers (id);
```

Run the scanner on its own first. It is the cheapest check you have:

```bash
python3 .claude/skills/database-migration-review/scripts/scan_migration.py migrations/0042_order_status.sql
```

You should see five findings: no `lock_timeout`, the `NOT NULL` column with no default, the index built without `CONCURRENTLY`, the rename, and the foreign key added without `NOT VALID`.

Then start Claude Code in the repository and invoke the skill directly:

```text
/database-migration-review migrations/0042_order_status.sql
```

Claude runs the scanner, opens only the reference files the findings point to, and returns the table with a safer SQL version of each statement. Typing `/` followed by the skill name is the most predictable way to run it.

Now try a plain question in a fresh session: "Is migrations/0042_order_status.sql safe to deploy?" In testing, Claude picked the skill from its description every time. In non-interactive tests, though, Claude still had to ask before running the scanner when it picked the skill itself. Approve it, or add a permission rule. Do not assume `allowed-tools` removes every prompt.

One result stood out. In a run where the scanner was blocked, Claude did not guess. It said it could not run the check, explained what it had reviewed by hand, and gave the exact command to run. That is rules 1 and 3 doing their job.

## How I use this in production

My production experience with skills comes from client work for a global hedge fund with around $1B in assets under management, where a 15+ person cross-functional team builds and maintains 12+ sector forecasting models. Skills are where those models' methodology lives. The details stay private. These are the lessons that held up.

**One domain, one folder.** Each forecasting domain is its own skill. The folder holds the instructions, a parameter file, the reference methodology, the data and the code. The parameter file records each value's default, its allowed range and the reason it was chosen. That last column matters more than it looks. When an analyst asks "why this number?", the answer is in the skill, not in somebody's memory, and the agent can quote it.

**Rules first, then a routing table.** Only the short description is always visible. The instructions open with a few non-negotiable rules: do not fabricate, do not do arithmetic in your head, use the parameter file, load the data before answering. Then a table maps each kind of question to the section that answers it. It is the field-manual shape, and the reason the example above opens with rules.

**Run only what the question needs.** A forecasting model has stages that depend on each other. A dependency map in the skill says which sections a question needs. A narrow question ("what is the assumed decline rate?") runs one step, not the whole model. That is progressive disclosure applied to computation, not just text.

**Treat skills as released artefacts.** We built a small command-line tool that validates, versions and uploads each skill. It skips any skill whose content has not changed since the last release by comparing a hash of the folder. That hash check is our own tooling, not a Claude feature. The habit is the point: a skill is software, so it gets validation, versions and a release step.

**Make values traceable across agents.** We keep a machine-readable index of every skill's parameters, functions and datasets. When one agent quotes another's number, it uses the index to cite the parameter file, not "the model said so". This is our own convention. I recommend it once several skills feed each other.

**Look up before you compute.** Earlier research has often answered the question already. A report-first step checks that pre-computed work, and the skill runs only to fill the gaps. That saves time and, more importantly, avoids two slightly different answers to the same question.

**Choose how much freedom the skill gives.** Our early skills said, in effect, "run this script". We moved towards methodology-first skills, each with a canonical reference implementation the agent must match. For us the logic was the product, and the same question had to give the same answer every time. That is a trade-off, not a rule. The example here runs a script, which is right for a pattern check. Use scripts for deterministic checks. Use methodology plus a reference implementation when the reasoning itself is what you ship.

**Gate releases on a review.** A structured review is a release gate: if it finds defects in the method, the skill does not ship. The gate was a release decision with named criteria, not a feeling. A skill that triggers correctly but encodes the wrong method is worse than no skill, because it is wrong consistently.

## Pitfalls

**A vague description.** "Helps with databases" competes with every other skill and wins nothing. Say what it does and when to use it, in the third person, with the words people type ("migration", "ALTER TABLE", "safe to deploy"). If it fires too often, narrow it. If it should never fire on its own, use `disable-model-invocation: true`.

**Silent frontmatter typos.** Claude Code ignores field names it does not recognise, so `allowed_tools` with an underscore simply does nothing. The same unknown fields are a hard error when you upload to claude.ai or the API. If the skill may travel, stick to `name`, `description`, `license`, `compatibility`, `metadata` and `allowed-tools`. Run `claude --debug` if a skill is not behaving as you expect.

**Rules buried at the bottom.** After compaction, only the start of each skill is kept. Put the rules that must survive at the top, and keep `SKILL.md` under 500 lines. Move detail into reference files, one level deep.

**Side effects the agent can trigger by itself.** A skill that deploys, commits or sends a message should not run because Claude decided the code "looks ready". Add `disable-model-invocation: true`, so only you can start it. If a rule must hold every single time, a skill instruction is not enough; move it into a hook (Part 6).

**Treating `allowed-tools` as a fence.** It pre-approves; it does not restrict. Use `disallowed-tools` or permission rules to take tools away. And review `allowed-tools` in any repository you clone: a project skill's pre-approvals apply even in a folder you have not marked as trusted. Third-party skills deserve the same care as any software you install.

**Assuming skills sync everywhere.** Skills in Claude Code, on claude.ai and on the Claude API are mostly separate stores. The main exception at the time of writing: a terminal session signed in with a claude.ai account picks up that account's enabled skills. Cloud sessions do not read your personal `~/.claude/skills/` folder, so commit the skill to the repository if it needs to run there. On the API, pin a skill version in production rather than using `latest`.

## Checklist

- [ ] Pick one method you keep pasting into chat and turn it into a skill folder.
- [ ] Write the description in the third person: what it does, when to use it, the words people type.
- [ ] Put the non-negotiable rules at the very top of `SKILL.md`.
- [ ] Add a routing table that sends each case to one reference file, one level deep.
- [ ] Move deterministic work into a script that handles its own errors and exits 0 when it ran.
- [ ] Use `${CLAUDE_SKILL_DIR}` in both the body and `allowed-tools`.
- [ ] Put anything with side effects behind `disable-model-invocation: true`.
- [ ] Test in a fresh session with at least three realistic prompts, with the skill on and off.
- [ ] Commit project skills and review them in pull requests like code.

## Further reading

- [Extend Claude with skills](https://code.claude.com/docs/en/skills): the Claude Code reference for locations, frontmatter, invocation control and dynamic context.
- [Agent Skills overview](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview): how progressive disclosure works and where skills run.
- [Skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices): descriptions, reference files, scripts and evaluation.
- [Using Agent Skills with the API](https://platform.claude.com/docs/en/build-with-claude/skills-guide): uploading, versioning and limits on the Claude API.
- [Subagents](https://code.claude.com/docs/en/sub-agents): preloading skills into sub-agents.
- [Hooks reference](https://code.claude.com/docs/en/hooks): for the rules that must never be skipped.
