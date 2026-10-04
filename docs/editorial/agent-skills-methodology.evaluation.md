# Evaluation, round 1: Part 5, "Agent Skills: methodology the agent carries with it"

Evaluator: independent, round 1. Date: 2026-10-04.

## Verdict: REVISE

One major accuracy issue. The example in the "merged into skills" paragraph uses `/review`, which is now a bundled alias of `/code-review`, so a custom `review` skill would not run as `/review`. Everything else is in good shape. The code runs, the scanner output matches the article exactly, nothing from the blocklist appears, and client claims stay within the approved facts. One small edit should be enough for a PASS.

## Scores

| Dimension       | Score | Notes                                                                                                    |
| --------------- | ----- | -------------------------------------------------------------------------------------------------------- |
| Accuracy        | 3     | Most facts verified against current docs. One wrong example (`/review`), plus one hedge to tighten       |
| Originality     | 5     | Original PostgreSQL migration-review example. No course sequence, project or tools                       |
| Confidentiality | 5     | 0 blocklisted terms (case-insensitive) in article or sidecar. No client, person, vendor or product names |
| Claims          | 4     | Only approved numbers (~$1B AUM, 15+ team, 12+ models). One anecdote could be softened                   |
| Code            | 5     | All blocks parse. Scanner runs and gives the 5 findings the article promises                             |
| Clarity         | 4     | Template followed, 2,249 prose words, jargon defined. Sidecar is missing `date` and `series`             |

## Issues

### Major

1. **Line 20: `/review` example conflicts with the current docs.**
   - Problem: the article says `.claude/commands/review.md` and `.claude/skills/review/SKILL.md` "both give you `/review`". In the current commands reference, `/review` is an alias of the bundled `/code-review` skill. The skills page says a user skill replaces a bundled command "but not its aliases", and gives the example that "the bundled alias `/review` never runs your skill". A reader who copies this example may get Anthropic's code review instead of their own skill.
   - Fix: use the docs' own example, `.claude/commands/deploy.md` and `.claude/skills/deploy/SKILL.md` both give you `/deploy`. Part 2 already uses `/deploy`, so the two parts would match.

### Minor

2. **Line 292: model-invoked permission prompts.**
   - Problem: the docs say an `allowed-tools` grant applies to the turn that invokes the skill, whether you or Claude invoked it. The prompts the article describes were seen in the researcher's `claude -p` runs (non-interactive mode). The sentence reads as general behaviour.
   - Fix: tie it to the tests, for example "In my non-interactive tests, Claude still had to ask before running the scanner when it picked the skill itself." Keep the advice not to assume every prompt goes away.
3. **Line 314: client quality-incident anecdote.**
   - Problem: "found business-logic defects, and we blocked external use until they were fixed" describes an internal incident at the client. It has no numbers and no names, but it is more specific than the other lessons.
   - Fix: optional. Make it general, for example "A structured review is a release gate: if it finds defects in the method, the skill does not ship."
4. **Sidecar is missing `date` and `series`.**
   - Problem: the published parts' sidecars (1, 2, 4, 6, 7) include `date` and `series` (`part: 5, of: 10`). `index.ts` requires `date`.
   - Fix: add `"date"` and `"series": {"name": ..., "part": 5, "of": 10}` when this part is integrated, or now for consistency.
5. **Scanner regex edge case (no change needed for the article).** `INDEX\s+(?!CONCURRENTLY)` can backtrack and flag `CREATE INDEX  CONCURRENTLY`, which has two spaces before `CONCURRENTLY`. The article already calls the scanner "deliberately simple" and pattern-based, so this is acceptable. Optional fix: `INDEX\s+(?!\s|CONCURRENTLY)`.

## Accuracy check log

Sources downloaded on 2026-10-04: code.claude.com/docs/en/skills, code.claude.com/docs/en/commands, platform.claude.com Agent Skills overview, best practices and skills-guide.

| Claim (line)                                                                                                                                | Result                                                                            |
| ------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Personal `~/.claude/skills/<name>/SKILL.md`, project `.claude/skills/<name>/SKILL.md`, plugins and managed settings can ship skills (13–18) | Verified                                                                          |
| Commands merged into skills; supporting files, invocation control, automatic loading (20)                                                   | Verified. **The `/review` example is wrong, see issue 1**                         |
| Three levels: metadata, instructions, resources (24–30)                                                                                     | Verified (overview)                                                               |
| Description in the third person, says what and when (34)                                                                                    | Verified (best practices)                                                         |
| Only script output enters context (36)                                                                                                      | Verified (overview)                                                               |
| After compaction, recent skills are re-attached and only the start is kept (42, 322)                                                        | Verified (first 5,000 tokens each, 25,000 combined)                               |
| Six portable frontmatter fields; unknown fields are a hard error on upload (97, 320)                                                        | Verified                                                                          |
| `${CLAUDE_SKILL_DIR}` is substituted in the body and in `allowed-tools` Bash rules (98)                                                     | Verified                                                                          |
| `allowed-tools` pre-approves for the invoking turn and does not restrict other tools (99, 326)                                              | Verified                                                                          |
| A non-zero exit from dynamic context injection aborts the skill (186)                                                                       | Verified (exit 1 from search tools such as grep is an exception, not needed here) |
| References one level deep; `SKILL.md` under 500 lines (190, 322)                                                                            | Verified                                                                          |
| Unknown fields are silently ignored; `--debug` shows parse errors (320)                                                                     | Verified                                                                          |
| `disable-model-invocation: true` for skills with side effects (318, 324)                                                                    | Verified                                                                          |
| `disallowed-tools`; workspace trust does not gate `allowed-tools` (326)                                                                     | Verified                                                                          |
| Separate stores across surfaces; claude.ai account sync in the terminal; cloud sessions skip `~/.claude/skills/` (328)                      | Verified                                                                          |
| Pin API skill versions rather than `latest` (328)                                                                                           | Consistent with the API guide (versioning)                                        |
| Further-reading URLs                                                                                                                        | Use current `code.claude.com` and `platform.claude.com` paths                     |

## Code-check log

Blocks were extracted to `/tmp/eval-skills/`.

| #   | Line | Language                   | Check                                         | Result                                                                  |
| --- | ---- | -------------------------- | --------------------------------------------- | ----------------------------------------------------------------------- |
| 0   | 50   | text (tree)                | none needed                                   | n/a                                                                     |
| 1   | 63   | markdown (SKILL.md)        | YAML frontmatter parsed with `yaml.safe_load` | OK: `name`, `description`, `allowed-tools`                              |
| 2   | 104  | python                     | `python3 -m py_compile` (3.12.2)              | OK. `list[dict]` is valid on 3.9+, which matches the stated requirement |
| 3   | 194  | markdown (with nested sql) | reviewed                                      | OK                                                                      |
| 4   | 225  | markdown                   | reviewed                                      | OK                                                                      |
| 5   | 246  | markdown (with nested sql) | reviewed                                      | OK                                                                      |
| 6   | 268  | sql                        | used as the scanner's input                   | OK                                                                      |
| 7   | 278  | bash                       | `bash -n`                                     | OK                                                                      |
| 8   | 286  | text (slash command)       | none needed                                   | n/a                                                                     |

Scanner run on the "Try it" migration: exit 0 with exactly 5 findings (`no-lock-timeout`, `add-column-not-null-no-default`, `index-not-concurrent`, `rename`, `constraint-not-valid-missing`). This matches line 282.

| Case                                                                                                     | Exit code | Result              |
| -------------------------------------------------------------------------------------------------------- | --------- | ------------------- |
| Missing file                                                                                             | 2         | Matches the article |
| No arguments                                                                                             | 2         | Matches the article |
| Safe rewrite of the migration (lock_timeout, constant default, `CONCURRENTLY`, `NOT VALID` + `VALIDATE`) | 0         | No findings         |
| Volatile default `gen_random_uuid()`                                                                     | 0         | Flagged as expected |

## Originality, confidentiality and claims

- **Originality:** the course used a workout-tracker app with Clerk, Neon and Ollama. This part uses a PostgreSQL migration-review skill, which is original, and its structure does not follow the course outline.
- **Confidentiality:** all 49 lines of the blocklist were checked, case-insensitively, against the article and the sidecar. There were 0 matches. There are no client, person, vendor, repo or internal product names.
- **Claims:** the only client figures are ~$1B AUM, a 15+ person team and 12+ sector forecasting models, all approved. The article adds no counts or percentages. The hash-based release tool and the parameter index are clearly labelled as the team's own tooling, not Claude features.
- **British spelling:** organisation, artefacts and summarises are used. No American spellings were found.
