# Evaluation (round 2): "It doesn't learn": an architecture for a learning loop in AI agents

**Verdict: PASS.** No blocker or major issues. The round-1 major (sidecar missing `date`) is fixed, and the three round-1 minors were addressed (DOI sentence removed; `render()` now charges headings against the budget; prose trimmed to 2,767 words). Every linked source was re-fetched today and the article describes each one correctly. The code runs offline and its output matches the Markdown package block and the prose exactly. The blocklist scan is clean. Three minor wording points remain; none affects the verdict.

Evaluated 2026-10-10 by an independent round-2 evaluator. HTML pages were fetched directly; the four PDFs (Nosek manuscript, OpenAI agents guide, Zheng et al., Shi et al.) were downloaded and text-extracted with `pdftotext` so the body-text claims could be checked, not only the abstracts.

## Scores

| Dimension       | Score | Note |
| --------------- | ----- | ---- |
| Accuracy        | 5     | All 14 links fetched; every quoted phrase found verbatim; every characterisation matches the source. Design choices are framed as the author's own ("the architecture I now use", "treat mine as operational, not theoretical", "layer order is a design decision", "Pick one remedy and keep it fixed"). One slight broadening of Zheng et al. noted as minor. |
| Originality     | 5     | Twelve principles synthesise 14 sources with reasons given for each. No section follows one source's structure or wording. The office-paper example, the taxonomy, "verify then apply", the frozen-vocabulary-as-schema idea and the replay script are the author's own. |
| Confidentiality | 5     | All 48 blocklist terms scanned case-insensitively against the article and sidecar: 0 hits. No client, product, person, dataset, research-subject or repository names. The production section is written as general lessons. Public author and vendor names appear only as citations of public documents. |
| Claims          | 5     | Only the two approved facts appear (~$1B AUM hedge fund; 12+ sector forecasting models). No counts, dates, costs or percentages about client work. Dates and figures in the example are toy data. |
| Code            | 5     | Both JSON blocks parse. The Python block compiles, runs with `python3 -I -S` (no network, standard library only), exits 0, and its printed package is byte-identical to the Markdown block. Output matches the prose at "Run it and you will see". |
| Clarity         | 5     | Template sections present and in order. 2,767 prose words (band 1,800–2,800). British spelling throughout (the one US spelling is inside a cited paper title). Sidecar is valid JSON with all required keys and all field sizes within the template's limits. The summary is plain enough for a junior. |

## Facts verified

| Article claim (line) | Source | Result |
| --- | --- | --- |
| Context "must be treated as a finite resource with diminishing marginal returns" (17) | anthropic.com/engineering/effective-context-engineering-for-ai-agents | Exact sentence found. Just-in-time retrieval (further reading) also confirmed. |
| Event sourcing: append-only store of what happened, views rebuilt from it (52) | martinfowler.com/eaaDev/EventSourcing.html | Confirmed: "Capture all changes to an application state as a sequence of events"; log is "a purely additive structure"; state rebuilt by "re-running the events". |
| Microsoft warns the full pattern is heavy and usually unnecessary (52) | learn.microsoft.com/.../patterns/event-sourcing | Confirmed: "Event sourcing is a complex pattern that introduces significant trade-offs ... For most systems and most parts of a system, traditional data management is sufficient." |
| Immutable store "conflicts with data protection regulations that require deletion of personal data" (86) | same | Exact phrase found under "Personal data and regulatory compliance". |
| Public surveys of agent memory use other splits (68) | arxiv.org/abs/2512.13564 | Confirmed: survey categorises by forms (token-level, parametric, latent), functions (factual, experiential, working) and dynamics. |
| Models "less likely to inappropriately change or overwrite JSON files compared to Markdown files" (76) | anthropic.com/engineering/effective-harnesses-for-long-running-agents | Exact phrase found. Progress log and feature list (132, further reading) confirmed. |
| Zheng et al.: judges fail on reasoning even when they could solve the problem themselves (92) | arxiv.org/pdf/2306.05685 (body text) | Confirmed in substance: "limitations in grading basic math problems which it is capable of solving"; abstract lists "limited reasoning ability". See minor 1 on wording. |
| Zheng et al.: two remedies, swap and require agreement, or randomise at scale (106) | same | Confirmed verbatim: "A conservative approach is to call a judge twice by swapping the order ... Another more aggressive approach is to assign positions randomly, which can be effective at a large scale". |
| Liu et al.: performance "often highest when relevant information occurs at the beginning or end of the input context" (98) | arxiv.org/abs/2307.03172 | Exact phrase found in the abstract. |
| Shi et al.: bias strongest when answers are close in quality (106) | arxiv.org/pdf/2406.07791 (body text) | Confirmed: "those of similar quality are difficult to judge, increasing the likelihood of position bias". |
| Kapoor and Narayanan: leakage behind reproducibility failures across many fields (112) | arxiv.org/abs/2207.07048 | Confirmed: "data leakage is indeed a widespread problem and has led to severe reproducibility failures"; 17 fields, 329 papers. |
| Nosek and colleagues: preregistration is "committing to analytic steps without advance knowledge of the research outcomes"; deviations happen, record them (118) | errorstatistics.com manuscript PDF | Exact sentence found; authors Nosek, Ebersole, DeHaven, Mellor confirmed. "Deviations ... are common" and "deviations are reported transparently" also found. The round-1 DOI sentence has been removed. |
| Hofman et al.: adapt pre-registration to predictive modelling; "unintentional re-use of test data"; lightweight template (118, further reading) | arxiv.org/abs/2311.18807 | All three confirmed in the abstract. |
| Vendor memory tools let the model write its own notes (124) | platform.claude.com/.../memory-tool | Confirmed: model requests create/str_replace/insert/delete; "Apply lessons from past interactions" is a listed use case. |
| OpenAI guide calls human intervention "a critical safeguard" (124) | cdn.openai.com/.../a-practical-guide-to-building-agents.pdf | Exact phrase found: "Human intervention is a critical safeguard". |
| "Read the transcripts!"; tasks, trials, graders; prefer deterministic graders (124, further reading) | anthropic.com/engineering/demystifying-evals-for-ai-agents | All confirmed; "We recommend choosing deterministic graders where possible". |

The research notes' section 7 (claims not to make) was respected: neither 403 source is cited, the eight leakage types are not enumerated, Google is not credited with order-swapping, the OpenAI guide carries no day-level date, and no numbers or subjects were added to the production lessons.

## Issues

No blockers. No majors.

1. **Minor, Accuracy (line 92).** "Zheng et al. found model judges fail on reasoning even when they could solve the problem themselves." The paper's specific finding is about grading basic maths problems the judge can solve; the abstract frames the broader limitation as "limited reasoning ability". The sentence is a fair synthesis but slightly broader than the evidence. **Fix (optional):** "Zheng et al. found a model judge mis-grading basic maths problems it could solve itself".
2. **Minor, Voice (line 9).** "Everyone's first design is the same" is a generalisation stated as fact. **Fix (optional):** "Almost everyone's first design is the same" or "The first design is usually the same".
3. **Minor, Clarity (line 136 vs line 25).** The example says "Everything below runs with the Python standard library", but the first two blocks are JSON and the third is Markdown output. Harmless; a reader will understand. **Fix (optional):** "The script below runs with the Python standard library."

Judgement calls that are not issues:

- Line 354 describes the setting as "an agentic research system" for the approved client. This is a generic descriptor of the kind of system, not a fact about the client, and it introduces no number, name or subject. Acceptable.
- Prose is 2,767 words against a 2,800 ceiling. Any later addition should be matched by a cut.
- "Modeling" (line 405) is a US spelling inside a cited paper title and must stay as the title is written.

## Code-check log

Blocks extracted with a regex over the Markdown to the session scratchpad (`codeblocks-r2/`).

| # | Block | Check | Result |
| --- | --- | --- | --- |
| 1 | `text` pipeline diagram (12 lines) | n/a | n/a |
| 2 | `json` interaction record | `python3 -I -m json.tool` | OK |
| 3 | `json` learning item | `python3 -I -m json.tool` | OK |
| 4 | `markdown` rendered package | compared byte-for-byte to the Python block's stdout between `# Context package` and `[without]` | Identical |
| 5 | `python` replay_eval.py (154 lines) | `python3 -I -m py_compile`, then `python3 -I -S replay_eval.py` with no network and no third-party packages | Exit 0. Output: li-001..li-005 `ok`; li-006 `quote is not verbatim in the source`; package printed with li-005 listed under "Not included (over budget)"; `[without] judge={'method': 0, 'sourcing': 0, 'needs': 0} later_corrections_met=[] leak_flags=0`; `[with] judge={'method': 1, 'sourcing': 1, 'needs': 1} later_corrections_met=['year-and-unit', 'source-per-number', 'no-skyrocket'] leak_flags=0`; `pinned: code_hash=4f3a5f8028bd seed=20250401`. Matches the prose at line 350. |

No bash or YAML blocks are present. The round-1 budget nit is fixed: `render()` now charges the header and each layer heading against `budget`, and refunds the heading cost when a layer ends up empty.

## Other checks

- **Format:** plain Markdown, body headings start at `##` (the `#` inside the markdown fence is sample output). No JSX, no HTML components. The only `import` lines are inside the Python fence.
- **Template:** Why the obvious fix fails; The idea (with fenced text diagram); Principles (12 subsections, all brief-required principles covered, each with a bold rule and a reason); A minimal example (JSON record, JSON item, Markdown package, Python skeleton); How I use this in production; Pitfalls (7); Checklist (8 `- [ ]` items); Further reading (6 links, each with one line).
- **Sidecar:** valid JSON; keys `slug`, `title`, `description` (155 chars, limit 160), `tags` (5, limit 3–5), `summary` (82 words, limit 60–90), `keyTerms` (6, limit 4–6), `keyPoints` (7, limit 5–7), `videoOutline` (10, limit 6–10; first beat is a Short-sized hook), `date`. `series` is optional in the `Article` type and correctly absent for a standalone piece.
- **Spelling:** British throughout (behaviour, randomise, labelled, modelling, organisation).
- **Confidentiality:** 48 blocklist terms, case-insensitive substring match over article and sidecar: 0 hits. No blocklisted term appears in this report.
- **Claims:** only the two approved public facts appear; the production section restates research-file lessons (a)–(m) without adding numbers, dates, names or subjects.
