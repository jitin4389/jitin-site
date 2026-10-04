# Evaluation, round 2: Part 5, "Agent Skills: methodology the agent carries with it"

Evaluator: independent, round 2. Date: 2026-10-04.

## Verdict: PASS

All round-1 issues are fixed. The `/review` example is now `/deploy`. The permission-prompt sentence is tied to non-interactive tests. The release-gate anecdote is general. The sidecar has `date` and `series`. The scanner regex is fixed.

Every Claude Code fact I checked matches the current official docs. The code parses, and the scanner gives the five findings the article promises. No blocklisted term appears. Client claims stay within the approved facts. Two minor, optional issues remain (below).

## Scores

| Dimension       | Score | Notes                                                                                                                                                                                        |
| --------------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accuracy        | 5     | Every Claude Code claim matches current docs (log below). PostgreSQL lock and rewrite claims are also correct                                                                                |
| Originality     | 5     | Original PostgreSQL migration-review skill. No course sequence, project (workout tracker) or tools (Clerk, Neon, Ollama)                                                                     |
| Confidentiality | 5     | 0 hits from the blocklist (46 terms, case-insensitive substring match) in the article and the sidecar. No client, person, vendor, product or repo names                                      |
| Claims          | 5     | Only approved facts: ~$1B AUM, 15+ person cross-functional team, 12+ sector forecasting models. No other numbers about client work. No "managed" claim                                       |
| Code            | 4     | All blocks parse and run. One edge-case false positive in the scanner (minor)                                                                                                                |
| Clarity         | 5     | Follows the template used by live parts. 2,149 words of prose (code and tables excluded; 2,252 with tables). British spelling. Sidecar is valid JSON with all 10 keys used by the live parts |

## Issues

### Blocker

None.

### Major

None.

### Minor

1. **Lines 292 and 294: first-person test claims.**
   - Problem: "In my tests…" and "One result I liked" describe the `claude -p` runs in the research notes (section 3.7). They were run during research, not necessarily by Jitin. The content is accurate, but the article presents it as Jitin's own experience.
   - Fix: Jitin should confirm he is happy to own these results, or re-run the two prompts himself. Another option is neutral wording, such as "In testing…".
2. **Scanner line 125: false positive when DEFAULT comes before NOT NULL.**
   - Problem: `ALTER TABLE t ADD COLUMN c int DEFAULT 0 NOT NULL;` is flagged as `add-column-not-null-no-default`. The negative lookahead only checks for `DEFAULT` after `NOT NULL`. The article calls the scanner "deliberately simple" and says it finds candidates, so this is acceptable as written.
   - Fix (optional): add a lookbehind check before `NOT NULL`. A simpler option: add one sentence saying the scanner can over-flag and Claude should confirm each finding against the reference file.

## Accuracy check log

Sources were downloaded on 2026-10-04 as raw Markdown: code.claude.com/docs/en/skills, code.claude.com/docs/en/sub-agents, and the platform.claude.com pages for the Agent Skills overview, best practices and skills-guide.

| Claim (line)                                                                                                                                                               | Doc evidence                                                                                                                                | Result                                                   |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Personal `~/.claude/skills/<name>/SKILL.md`, project `.claude/skills/<name>/SKILL.md`; plugins and managed settings can also ship skills (13–18)                           | Skills, "Where skills live" table                                                                                                           | Verified                                                 |
| `.claude/commands/deploy.md` and `.claude/skills/deploy/SKILL.md` both give `/deploy`. Skills add supporting files, invocation control and automatic loading (20)          | Skills, "Custom commands have been merged into skills" note                                                                                 | Verified (exact match to the docs' example)              |
| Three levels: metadata always, instructions when triggered, resources as needed (24–30)                                                                                    | Overview, Level 1/2/3+ table                                                                                                                | Verified                                                 |
| Descriptions in the third person, saying what and when (34)                                                                                                                | Best practices: "Always write in third person"                                                                                              | Verified                                                 |
| A script's code never enters context, only its output (36)                                                                                                                 | Overview: "the script code itself never enters context"                                                                                     | Verified                                                 |
| Compaction re-attaches recent skills and keeps only the start of each (42, 322)                                                                                            | Skills, "Skill content lifecycle": first 5,000 tokens each, 25,000 combined                                                                 | Verified                                                 |
| `name`, `description` and `allowed-tools` are accepted on claude.ai and the API (97)                                                                                       | Skills, "Using skill frontmatter outside Claude Code": six allowed fields                                                                   | Verified                                                 |
| `${CLAUDE_SKILL_DIR}` is substituted in the body and in `allowed-tools` Bash rules (98)                                                                                    | Skills, string substitutions                                                                                                                | Verified                                                 |
| `allowed-tools` pre-approves for the invoking turn and does not restrict other tools (99, 326)                                                                             | Skills, "Pre-approve tools for a skill"                                                                                                     | Verified                                                 |
| A rewritten or chained command no longer matches the rule (100)                                                                                                            | Skills: the rule must match the exact command; research notes 3.7 saw `; echo` blocked                                                      | Consistent                                               |
| A non-zero exit from `` !`command` `` injection aborts the whole skill (186)                                                                                               | Skills, "When an injected command fails" (the exit-1 carve-out covers search tools only, not `python3`)                                     | Verified                                                 |
| References one level deep; `SKILL.md` under 500 lines (190, 322)                                                                                                           | Best practices; Skills tip                                                                                                                  | Verified                                                 |
| Claude Code silently ignores unknown frontmatter fields; claude.ai and API uploads fail with a hard error; six portable fields (320)                                       | Skills, frontmatter reference and "Unexpected key(s)" error                                                                                 | Verified                                                 |
| `--debug` for troubleshooting (320)                                                                                                                                        | Skills troubleshooting: "Run with `--debug`"                                                                                                | Verified                                                 |
| `disable-model-invocation: true` (318, 324, 338)                                                                                                                           | Skills, "Control who invokes a skill"                                                                                                       | Verified                                                 |
| `disallowed-tools` exists. Workspace trust does not gate a project skill's `allowed-tools` (326)                                                                           | Skills frontmatter table; "Workspace trust doesn't gate this field"                                                                         | Verified                                                 |
| Separate stores on each surface; terminal sessions signed in with claude.ai sync account skills; cloud sessions skip `~/.claude/skills/`; commit to the repo instead (328) | Overview, "do not sync across surfaces"; Skills, synced skills and cloud sessions                                                           | Verified ("at the time of writing" hedge is appropriate) |
| Pin API skill versions instead of using `latest` in production (328)                                                                                                       | Skills guide: "For production: pin a specific version"                                                                                      | Verified                                                 |
| Sub-agents can preload skills (348)                                                                                                                                        | Sub-agents, `skills` frontmatter field                                                                                                      | Verified                                                 |
| Model-invoked skill still prompted in non-interactive runs (292)                                                                                                           | The docs say the grant applies to the invoking turn. The article ties the claim to its own tests and does not state it as general behaviour | Acceptable as hedged                                     |
| Further-reading URLs (344–349)                                                                                                                                             | All six returned HTTP 200                                                                                                                   | Verified                                                 |

PostgreSQL claims in the reference files were checked against PostgreSQL behaviour:

- Fast constant default since PostgreSQL 11.
- `SET NOT NULL` skips the scan when a valid CHECK constraint exists, since PostgreSQL 12.
- `VALIDATE CONSTRAINT` takes SHARE UPDATE EXCLUSIVE.
- `CONCURRENTLY` cannot run in a transaction, leaves an INVALID index on failure and scans twice.
- `varchar` widening and `varchar` to `text` avoid a rewrite.
- `DROP INDEX` takes ACCESS EXCLUSIVE.

All are correct.

## Confidentiality and claims

- The blocklist was matched case-insensitively as substrings against every line of the article and the sidecar: 0 hits. No terms are reproduced here.
- Production section (lines 298–314): uses only the approved hedge fund (~$1B AUM), 15+ person team and 12+ models wording. It contains no counts of tools, skills, agents, criteria, sessions or percentages. Internal tooling is described generically and is not named.

## Code-check log

Blocks were extracted to `/tmp/ase-r2-1791127501/`.

| #   | Line | Language                 | Check                                         | Result                                                                                                                                                                                                                                              |
| --- | ---- | ------------------------ | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0   | 50   | text (tree)              | none needed                                   | n/a                                                                                                                                                                                                                                                 |
| 1   | 63   | markdown (SKILL.md)      | YAML frontmatter parsed with `yaml.safe_load` | OK: `name`, `description`, `allowed-tools`                                                                                                                                                                                                          |
| 2   | 104  | python                   | `python3 -m py_compile` (3.12.2)              | OK. `list[dict]` is valid on 3.9+, as stated                                                                                                                                                                                                        |
| 2   | 104  | python, run              | sample migration (block 6)                    | Exit 0, exactly 5 findings: no-lock-timeout, add-column-not-null-no-default, index-not-concurrent, rename, constraint-not-valid-missing. Matches line 282                                                                                           |
| 2   | 104  | python, run              | missing file / no arguments                   | Exit 2 with a stderr message, as documented                                                                                                                                                                                                         |
| 2   | 104  | python, run              | extra cases                                   | Volatile default, SET NOT NULL, TYPE change, DROP INDEX and UNIQUE INDEX are all flagged. Safe forms (CONCURRENTLY, NOT VALID FK, NOT NULL DEFAULT, lock_timeout present) are not flagged. One false positive: `DEFAULT 0 NOT NULL` (minor issue 2) |
| 3   | 194  | markdown with nested sql | reviewed                                      | OK. The four-backtick outer fence is correct                                                                                                                                                                                                        |
| 4   | 225  | markdown                 | reviewed                                      | OK                                                                                                                                                                                                                                                  |
| 5   | 246  | markdown with nested sql | reviewed                                      | OK                                                                                                                                                                                                                                                  |
| 6   | 268  | sql                      | used as scanner input                         | OK                                                                                                                                                                                                                                                  |
| 7   | 278  | bash                     | `bash -n`                                     | OK                                                                                                                                                                                                                                                  |
| 8   | 286  | text (slash command)     | none needed                                   | n/a                                                                                                                                                                                                                                                 |

Format: no JSX, components or HTML. The only `import` lines are inside the Python fence. Headings start at `##`. The section order matches the live parts (idea, working example, production, pitfalls, checklist, further reading).
