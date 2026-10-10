# Evaluation (revision, round 1): "It doesn't learn": an architecture for a learning loop in AI agents

**Verdict: PASS.** No blocker or major issues. All twenty items of the revision brief are present in the article and sidecar. Every linked source was fetched today and the article describes each one correctly. The Python block compiles, runs offline on the standard library, exits 0, refuses to run when tampered with, and its printed package is byte-identical to the Markdown block in the article. Blocklist scan on the article and sidecar: 0 hits. Four minor issues remain; none changes the verdict.

Evaluated 2026-10-11 by an independent evaluator who did not write the revision.

## Scores

| Dimension | Score | Note |
| --- | --- | --- |
| Accuracy | 4 | All 14 external links fetched (HTML directly; the three PDFs text-extracted with `pdftotext`). Every quoted phrase found verbatim; every characterisation matches its source. Prompt-caching sentence is correct and modest. Pointwise vs pairwise framing is correct and matches the stub (`stub_judge` sees one answer). One small over-claim about what `check()` enforces (minor 1). |
| Originality | 5 | Synthesis across 14 sources with reasons given. The taxonomy, "verify then apply", the frozen vocabulary as schema, the manifest and live-pointer model, the replay script and the wrong-tool comparison are the author's own. |
| Confidentiality | 5 | All 48 blocklist terms scanned case-insensitively against the article and sidecar: 0 hits. No client, product, person, dataset, research-subject or repository names. The production section is written as general lessons. Public author and vendor names appear only as citations of public documents. |
| Claims | 5 | Only the two approved public facts appear. No numbers, dates or subjects about client work; "about a week to stand up" is a general build estimate consistent with the checklist, not a client figure. |
| Code | 5 | Three JSON blocks parse. Python block passes `py_compile`, runs with `python3 -I -S` (3.12.2, no network), exits 0; printed output matches the prose at "Run it and you see" exactly; rendered package equals the Markdown block byte for byte; appending a comment makes it print `verdict: REFUSED` and exit 1. |
| Clarity | 4 | All brief items done. Eleven slides, each exactly once with manifest alt and caption; no caption fragment is repeated in the prose. 3,784 prose words (band 2,600–3,800). Sidecar valid JSON with all keys; description 156 chars matches the brief. "Twelve principles" versus thirteen bold rules (minor 2); slide 5 placed before slide 4 (minor 3). |

## Brief items checked

| Item | Status | Where |
| --- | --- | --- |
| A1 Monday/Tuesday opening, stateless thesis, who-this-is-for | Done | Lines 3–7 |
| A2 Renamed headings; memory/corrections in description, headings, tags | Done | Headings at 9, 27, 45, 469; sidecar description and tags |
| A3 Seven-row stage table; text diagram dropped | Done | Lines 33–41 |
| A4 Four `###` groups, bold run-in rules, senior-reader opener | Done | Lines 49–117 (see minor 2 on the count) |
| A5 "Approval is a step, not a hope" twice; "Stateless model, stateful system" once | Done | Counts verified: 2 and 1 |
| A6 enum and sidecar defined; capability map once; general rules; "addresses"; "by analogy" | Done | Lines 36, 65, 25, 105, 437 |
| B7 package_id and hash on record; manifest paragraph; checklist stamp line | Done | Lines 133–134, 115–117, 492 |
| B8 Shared vs per-user, precedence order, conflicts, tenant partition | Done (100 words) | Lines 61–63 |
| B9 Serving sub-part, selection, new user, placement, caching sentence, budget heuristic | Done | Lines 79–87 |
| B10 Pointwise vs pairwise; on-topic rule and content floor; sample-size rule | Done | Lines 95–97 |
| B11 "When this loop is the wrong tool" before Pitfalls, slide 10, three cases, rule of thumb | Done | Lines 449–467 (see minor 4) |
| B12 Deletion and consent ~100 words | Done (126 words) | Lines 73–75 |
| C13 Extraction prompt sketch | Done | Lines 161–178 |
| C14 met_if paragraph; "stubs, exercises the scorer" | Done | Lines 101, 416 |
| C15 JUDGE_PROMPT, REGISTRATION, refusal, bare-fact check, parroting, order printed, supersession, byte-identical package | Done | Script lines 266–413; verified by run |
| C16 Registration JSON | Done | Lines 420–431 |
| D17 Day 1 / Week 1 checklist with owners | Done | Lines 485–504 |
| D18 Internal links Parts 8, 1, 6, 10 at the named places | Done | Lines 95, 83, 71, 75; all four targets exist |
| D19 Sidecar description, keyPoints, videoOutline hook/demo/story beats, final beat | Done | Sidecar |
| D20 Production lessons lead; credential sentence subordinate; honest line | Done | Lines 435–447 |

## Facts verified

| Article claim (line) | Source | Result |
| --- | --- | --- |
| Context "must be treated as a finite resource with diminishing marginal returns" (21) | anthropic.com/engineering/effective-context-engineering-for-ai-agents | Exact sentence found. |
| Event sourcing as append-only store with views rebuilt from it (55) | martinfowler.com/eaaDev/EventSourcing.html | Confirmed: "stored as a sequence of events"; "purely additive structure"; state rebuilt by re-running events. |
| Microsoft: most systems do not need the full pattern (55) | learn.microsoft.com/.../patterns/event-sourcing | Exact: "For most systems and most parts of a system, traditional data management is sufficient." |
| Immutable store "conflicts with data protection regulations that require deletion of personal data"; crypto-shredding or data outside the store (73–75) | same | Exact phrase found; both remedies listed on the page (per-subject key deleted; personal data stored outside and referenced by id). |
| Public surveys use other splits (59) | arxiv.org/abs/2512.13564 | Confirmed: forms, functions (factual, experiential, working), dynamics. |
| "less likely to inappropriately change or overwrite JSON files compared to Markdown files" (65) | anthropic.com/engineering/effective-harnesses-for-long-running-agents | Exact sentence found. |
| Zheng et al.: judge mis-grading basic maths it could solve (77) | arxiv.org/pdf/2306.05685 body text | Confirmed: "limitations in grading basic math problems which it is capable of solving". |
| Zheng et al.: swap-and-agree or randomise at scale (97) | same | Confirmed verbatim; the remedies are stated for pairwise comparison, which is how the article uses them. |
| Shi et al.: bias strongest when answers are close in quality (97) | arxiv.org/pdf/2406.07791 body text | Confirmed: "those of similar quality are difficult to judge, increasing the likelihood of position bias". |
| Liu et al.: "often highest when relevant information occurs at the beginning or end" (83) | arxiv.org/abs/2307.03172 | Exact phrase found. |
| Kapoor and Narayanan: leakage behind reproducibility failures across many fields (99) | arxiv.org/abs/2207.07048 | Confirmed: 17 fields, 329 papers. |
| Nosek and colleagues: "committing to analytic steps without advance knowledge of the research outcomes"; deviations common, report them (105) | errorstatistics.com manuscript PDF | Exact sentence found; "Deviations ... are common"; "reported transparently" found; authors confirmed. |
| Hofman et al.: adapt pre-registration to predictive modelling; "unintentional re-use of test data" (105) | arxiv.org/abs/2311.18807 | Both confirmed in the abstract. |
| Vendor memory tools let the model write its own notes (111) | platform.claude.com/.../memory-tool | Confirmed: model requests create/str_replace/insert/delete; application executes; "Apply lessons from past interactions" listed. |
| OpenAI guide: human intervention "a critical safeguard" (111) | cdn.openai.com/.../a-practical-guide-to-building-agents.pdf | Exact phrase found. No day-level date given in the article, as the notes require. |
| "Read the transcripts!"; deterministic graders where possible (111, further reading) | anthropic.com/engineering/demystifying-evals-for-ai-agents | Both confirmed. |

Prompt caching (87): the sentence is general advice consistent with the vendor docs in the research notes (short default cache lifetime refreshed on use; cached prefixes still occupy the window). It makes no stronger claim and carries no citation, which is right for a design heuristic.

The research notes' section 7 is respected: neither 403 source is cited; the eight leakage types are not enumerated; Google is not credited with order-swapping; no numbers or subjects were added to the production lessons.

## Code-check log

Blocks were extracted by regex to a fresh scratch directory and run from there.

| # | Block | Check | Result |
| --- | --- | --- | --- |
| 1 | Interaction record JSON | `python3 -m json.tool` | Parses. Has `package_id` and `package_hash`. |
| 2 | Learning item JSON | `python3 -m json.tool` | Parses. |
| 3 | Extraction prompt (text) | Read | Inputs, output schema, five rules, zero-items rule present. |
| 4 | Rendered package (markdown) | Byte compare with script output | Identical. |
| 5 | `replay_eval.py` | `py_compile`; `python3 -I -S`; tamper test | Compiles; exit 0; output matches prose (li-006 and li-008 rejected, li-003 superseded by li-007, li-005 cut, both arms scored, 1 leak flag, `FAIL pending review (1 leak flag)`, pinned hashes and `order=['with', 'without']`). Appending a comment: `verdict: REFUSED`, exit 1. |
| 6 | Registration JSON | `python3 -m json.tool` | Parses; hashes match the script's constants. |

## Issues

No blockers. No majors.

1. **Minor, Accuracy (line 159).** "`check()` in the script rejects anything that breaks the rules" over-states the code. `check()` tests three things (record exists, quote verbatim in `user_text`, world fact attributed). It does not test the `kind` enum, `scope`, or the `field` named in the prompt, and it only looks at `user_text`, so a quote from `feedback.comment` would be rejected. The item JSON above also uses a nested `source: {record_id, field}` while the script items use a flat `record_id`. **Fix:** "`check()` in the script enforces the two rules code can test here, the verbatim quote and the attributed world fact; a real extractor also checks kind, scope and the named field", and either add `"field"` to the script items or drop it from the item JSON.
2. **Minor, Clarity (line 49).** "Twelve principles, in four groups" but there are thirteen bold run-in rules (the brief added "Close the loop in the data model" to the original twelve). **Fix:** "Thirteen principles, in four groups", or fold the manifest rule into "Record first" and keep twelve.
3. **Minor, Clarity (lines 47 and 53).** Slide 5 (one correction's journey) is placed before slide 4 (kinds of learning). The journey slide walks the whole loop, so it sits more naturally under "The idea" after the stage table, with slide 4 then opening "Record and structure". Optional; both are present exactly once with the correct caption.
4. **Minor, Clarity (lines 455–459).** The brief asked for the comparison "across per-user, provenance, staleness, withdrawal, measurability, build cost". The five bullets each cover three to five of the six; for example, notes in the prompt do not say per-user, and retrieval does not say build cost. The slide table carries the full grid, so this is readable, but one phrase per missing cell would complete it.

Judgement calls that are not issues:

- Line 435 names the setting with the two approved facts only; "an agentic research system" is a generic descriptor.
- Line 459 "about a week to stand up" is a general build estimate matching the Day 1 / Week 1 checklist, not a client figure.
- "Modeling" (line 514) is a US spelling inside a cited paper title and must stay.
- Prose is 3,784 words against a 3,800 ceiling; any later addition should be matched by a cut.
