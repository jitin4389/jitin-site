![Two chat sessions. On Monday the user says never use the word skyrocket and the assistant agrees. On Tuesday, in a new session with empty context, the assistant uses the word. Three missing things are listed: nothing records the correction in a checkable form, nothing decides which notes shape future answers, nothing measures improvement.](/writing/learning-loop-for-ai-agents/01-the-complaint.svg "Corrected on Monday, repeated on Tuesday: the model is stateless by design, and nothing around it records, selects or measures.")

On Monday a user wrote to the assistant: "never use the word 'skyrocket'". The assistant agreed. On Tuesday, in a new session, the first answer used it. "It doesn't learn" is a fair complaint, and I have heard it about every assistant I have worked on. It is aimed at the wrong thing.

The model is not the part that fails to learn. It is stateless by design, and it should be. What fails is the system around it. Nothing records what the user said in a checkable form. Nothing decides which of those things should shape future answers. Nothing measures whether answers got better. Stateless model, stateful system. "It doesn't learn" is a design problem, and the fix has one property above all others. Approval is a step, not a hope.

This article describes the architecture I now use: a learning loop built from user corrections. The code was the easy part. The hard part was structuring the problem: what kinds of learning exist, where each belongs, and how to prove the loop helps rather than merely changes things. It is written for people who build assistants other people use. It is not about fine-tuning or training, and not about the scratch notes an agent keeps inside one task.

## Why "store the corrections and inject them" fails

![A corrections file pasted into every prompt, then five numbered failures: kinds get mixed, facts go stale, text leaks, the list grows, nothing is measured.](/writing/learning-loop-for-ai-agents/02-why-store-and-inject-fails.svg "The naive design: a growing corrections file pasted into every prompt, and the five ways it fails.")

Almost everyone's first design is the same, mine included: keep a memory list of corrections and paste it into every prompt. Each of its five failures is structural, not a bug you can patch.

**The kinds of learning get mixed.** "Never use the word skyrocket", "our supplier says prices rose last quarter" and "watch for news about the new mill" are a writing rule, a claim that may already be wrong, and a standing request. In one flat list the model applies the stale claim as confidently as the style rule.

**World facts go stale and get parroted.** A user mentions a number. Months later the assistant repeats it as fact, undated and unsourced, after it has changed.

**Learned text leaks into answers.** Users see their own words coming back, or the assistant's instructions to itself ("as per my rules...").

**The list grows without bound.** Cost rises and recall falls as the context fills; context "must be treated as a finite resource with diminishing marginal returns" ([source](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)). The naive design never removes anything.

**Nothing is measured.** The list changes answers, but nobody can say whether it improves them. Every tweak is a guess.

The loop below addresses each of them.

## The idea: a learning loop, not a memory list

![Record, enrich, group, extract, serve, evaluate and approve form a ring. Each arrow names the file that moves to the next stage and carries a sign-off marker. A dashed arrow returns what failed replay from evaluate to extract.](/writing/learning-loop-for-ai-agents/03-the-learning-loop.svg "The loop: seven rerunnable stages. Every arrow carries a file; every gate has a person.")

Seven stages turn raw interactions into a context package: a short, budgeted block of learned items served to a user's next session. What each stage writes, and what the person at its gate checks, is most of the design:

| Stage    | Writes                                                                                                               | The person checks                                 |
| -------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Record   | One immutable record per interaction, with provenance (ids, timestamps, origin) and the id of the package in context | A sample against what users actually saw          |
| Enrich   | Labels and summaries in sidecars (files beside records), keyed by inputs hash and version                            | A hand-labelled sample                            |
| Group    | A frozen vocabulary of subjects, and a subject per record                                                            | The vocabulary: drop, rename, merge, redefine     |
| Extract  | Typed items, each with a verbatim quote and a record pointer                                                         | Rejections, and a sample of accepted items        |
| Serve    | A budgeted, layered package per user, with a manifest                                                                | The rendered package and its cut list             |
| Evaluate | Replay scores (old questions answered again, with and without the package) against a pass line fixed before the run  | Leak flags, and the transcripts behind the scores |
| Approve  | The live pointer for that user                                                                                       | The verdict; signs the manifest                   |

Plain files and local commands work; so do a queue and a database. What makes it a loop is that evaluation feeds back into extraction: an item that fails replay is re-extracted or withdrawn, and nothing reaches a user's session without passing a gate.

![Eight steps from a user's sentence on Monday, through record, enrich, group, extract, serve and evaluate, to approval and Tuesday's session starting with the new package.](/writing/learning-loop-for-ai-agents/05-one-corrections-journey.svg "One rule, end to end: from the user's sentence to the next session's behaviour.")

## Principles: memory you can check

Thirteen principles, in four groups. If you are senior and short of time, read only the bold rules and the checklist at the end.

### Record and structure

![A table of five kinds of learning: world fact, method rule, answer shape, profile and standing watch, each with an example in the user's words, how it is served, whether it goes stale and its layer. Below: scope, owner and precedence rules.](/writing/learning-loop-for-ai-agents/04-kinds-of-learning.svg "Five kinds of learning, each with its own serving rule, staleness and position in the package.")

**Record first, deterministically, with provenance. One immutable record per interaction, parsed once by code, is the source of truth.** Everything downstream is a derived view; if the record can change, views silently disagree. This is half of event sourcing ([Fowler](https://martinfowler.com/eaaDev/EventSourcing.html)): an append-only store with views rebuilt from it. The other half is heavier, and Microsoft's guide is right that most systems do not need it ([source](https://learn.microsoft.com/en-us/azure/architecture/patterns/event-sourcing)). A record holds the answer the user saw, not drafts, with ids, timestamps, origin and the id of the package that was in context.

**Enrichment is add-only and versioned. Enrichers write sidecars next to the record, never into it, keyed by a hash of their inputs and their own version.** Model calls are lossy and non-deterministic, and enrichment is where they happen. Versioned output beside the record means a better enricher can be re-run later, and unchanged inputs cost nothing.

**A taxonomy of learnings, with scope and precedence. Every learning item has a kind, a scope and an owner.** Method rules apply directly, world facts must be checked, watches are conditional; without the taxonomy the serving layer cannot tell them apart. Public surveys of agent memory use other splits ([source](https://arxiv.org/abs/2512.13564)); treat mine as operational, not theoretical. Precedence keeps the set sane: newer wins when two items conflict, and a specific instruction stays specific rather than being folded into a general principle. Merging is right for duplicates and wrong for scope.

Shared and per-user items need their own rule. A shared item is never written directly: it is promoted from a per-user item through its own gate, with the quote replaced by a paraphrase marked as such and a pointer to the source record kept for auditors only.

Precedence across the two sets is a fixed order: per-user beats shared, then specific beats general, then newer beats older. Conflicts are model-proposed and human-confirmed. Records, items and packages are partitioned by tenant, and a serving read touches one partition, so a cross-tenant leak needs a code change, not just a bad query.

**Humans freeze vocabularies; machines do the volume. A model may propose labels and clusters. A human freezes the vocabulary. The frozen vocabulary then becomes the schema the machine must use.** A vocabulary that keeps changing cannot be measured against. Freezing turns a fuzzy task into classification with fixed answers, which code can check and a sample can score. Anthropic's harness post found models "less likely to inappropriately change or overwrite JSON files compared to Markdown files" ([source](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)); by analogy, make the vocabulary a typed enum (fixed allowed values), not a prose list. Routing is then propose-then-verify, scored against hand-routed reference keys.

### Extract and serve

![A learning item with kind, scope, verbatim quote, source record and status, each annotated. Two rendered lines: a method rule applied directly, and a world fact rendered as verify before use with its date.](/writing/learning-loop-for-ai-agents/06-anatomy-of-a-served-item.svg "A learning item carries its kind, scope, verbatim quote and source; the rendering differs by kind.")

**Every served item cites the user's own words. No item is served without a verbatim quote and a pointer to its record, checked by code.** Paraphrase is where meaning drifts: "prefer lead-time data" is not what the user said. The code check (is this string actually in that record?) turns provenance into a guarantee and catches the commonest extraction failure, the model inventing a tidier version of what it read. [Part 6](/writing/hooks-as-guardrails) makes the same move for coding agents: a prompt asks, code enforces.

Verbatim quotes are personal data, and an immutable store "conflicts with data protection regulations that require deletion of personal data" ([source](https://learn.microsoft.com/en-us/azure/architecture/patterns/event-sourcing)). Design withdrawal in from the start, as an appended tombstone event, not an edit. Every derived view is rebuilt from the log plus the tombstone, so the quote disappears everywhere by rebuild, not by hunting for copies.

The record itself needs one of two designs: encrypt each user's records with a per-user key and destroy the key on withdrawal (crypto-shredding), or keep raw text out of the record, behind a hash and a pointer into a store that can delete. A package containing a withdrawn quote is re-rendered and goes live without a new evaluation. The wider duties around users' data are in [Part 10](/writing/working-responsibly-with-ai).

**World facts are "verify then apply", never statements. A world fact is served as a dated claim the user made, with an instruction to check it, never as a fact to restate.** The model cannot verify the claim from inside the prompt, and judges cannot either: Zheng et al. found a model judge mis-grading basic maths problems it could solve itself ([source](https://arxiv.org/abs/2306.05685)). The safe form is "on this date the user said X; check it against a current source". Extraction rejects a world fact written as a bare statement.

#### Serving the package

![A context package drawn as four stacked layers with a budget line cutting through the last layer and a not-included list below. Four notes: position matters, order is a design decision, cuts are listed, stable bytes cache well.](/writing/learning-loop-for-ai-agents/07-budget-and-layers.svg "The package: layered by kind, cut at a budget, with the cut list outside the budget.")

**Budgets and layered rendering. The package has a character budget. Items render in layers in a fixed order, and anything cut is listed, not silently dropped.** Liu et al. found performance "often highest when relevant information occurs at the beginning or end of the input context" and worse in the middle ([source](https://arxiv.org/abs/2307.03172)). So layer order is a design decision: how-to-work rules first, watches last because they are conditional. [Part 1](/writing/context-engineering-claude-md) makes the same budget argument for coding agents.

Which items are served is a separate decision. The general layer always is. Subject layers are selected by classifying the incoming question against the frozen vocabulary: a cheap deterministic match first, a model call only when that finds nothing, and a cap of a few subjects per session. A new user gets shared general items only, until their first approved extraction, and the selection is logged on the record.

Placement is fixed too: one block after the static system text and before the user turn, rebuilt at session start, with the package id in its header. Place it in the stable prefix, expect cache hits within an active session rather than across days, and treat caching as a price benefit, not a context-size benefit. Budget heuristic: start at the smallest budget that passes the replay pass line, and grow it only when a cut item shows up in a later correction.

### Prove it

![A time bar splits sessions at a cutoff date: packages are built from the earlier ones, questions come from the later ones. A later question is answered in two arms, as today and with the package; a blind model judge and code guards score both; the verdict is the pass line on later corrections met.](/writing/learning-loop-for-ai-agents/08-replay-evaluation.svg "Replay: two arms, a blind judge, code guards, and a pass line on corrections the package never saw.")

**Evaluate by replay before serving. No package goes live until old questions have been replayed with and without it and scored.** A model judge scores what is visible: did the answer state a method, did every number carry a source, did it meet the user's stated needs. It is told never to adjudicate the domain call, because it cannot.

Code guards run beside it: a leak scan for sentences that repeat a run of words from the package with no source marker, a self-reference check, a length ceiling and a content floor. The floor matters because "do not do X" corrections are scored only when the answer is on-topic; without it, a terse answer that says nothing wins on every prohibition. [Part 8](/writing/evaluating-agent-output) covers building the judge.

Decide early whether the judge is pointwise or pairwise. A pointwise judge scores one answer against a rubric and never sees the other arm, so order bias does not apply, but it cannot compare directly. A pairwise judge compares the two, and position bias applies. Zheng et al. offer two remedies: swap the order and require agreement, or randomise at scale ([source](https://arxiv.org/abs/2306.05685)). Bias is strongest when answers are close in quality ([source](https://arxiv.org/abs/2406.07791)). My rule: below a few hundred pairs, swap-and-agree; above that, seeded random order with the mapping kept outside the bundle. The stub judge in the example below is pointwise, so its seeded order is printed for the record and would matter only to a pairwise judge.

**Measure against what the user later corrected. The main score is whether the with-package answer already does what the user asked for, or corrected, later in the original session, which the package never saw.** A judge's opinion is a proxy; a correction the user actually made is ground truth. It needs a time cutoff: packages are built only from sessions before it, and later sessions are the test. Kapoor and Narayanan found data leakage behind reproducibility failures across many fields ([source](https://arxiv.org/abs/2207.07048)); the cutoff is the simplest guard.

Each later correction has to become something code can score. A model drafts a `met_if` predicate from the correction's text ("you forgot the year" becomes "the answer contains a four-digit year"), a human approves or rewrites it, and the predicate is frozen with the registration.

**Pre-register experiments and pin the code. Before a run, write the hypothesis, pass line, sample and judge prompt. Hash the code and the prompt. A mismatch refuses the run.** Once results are visible, every analysis choice becomes a fork and the loop starts fitting its own test.

Nosek and colleagues define preregistration as "committing to analytic steps without advance knowledge of the research outcomes" ([manuscript](https://errorstatistics.com/wp-content/uploads/2017/07/nosek-et-al-preregistration-revolution.pdf)); Hofman et al. adapt it to predictive modelling and name "unintentional re-use of test data" as a threat ([source](https://arxiv.org/abs/2311.18807)). It is a discipline, not a guarantee. Deviations happen; record them rather than hide them. Never delete a retired experiment either: record it as retired and carry its shortfall forward in writing.

### Keep it running

![A registration file with hypothesis, pass line, sample, prompt and code hashes and an empty deviations list; a note that a hash mismatch refuses the run. Beside it, seven stages with what the person checks at each sign-off.](/writing/learning-loop-for-ai-agents/09-pre-registration-and-gates.svg "The registration file fixes the test before the run; one person signs off at each stage.")

**One human gate per stage. Each stage has exactly one place where a person approves its output before the next stage uses it.** A model may write its own scratch notes freely, as vendor memory tools let it ([source](https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool)); a rule that will shape every future answer for a user is a different thing. OpenAI's agents guide calls human intervention "a critical safeguard" ([source](https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf)). Anthropic's evals post puts it more bluntly: "Read the transcripts!" ([source](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)).

**Repeatable batch runs. Every stage is a local command: files in, files out, versioned outputs, caches keyed by prompt hash, a cost ceiling.** Files in and out mean any stage can be rerun, diffed and reviewed; ceilings stop a bad prompt running away with the budget. The bootstrap pass over history and the ongoing pass over new sessions should be the same code.

**Close the loop in the data model. Every package has a manifest, and every record names the package that was in context.** The manifest: `{package_id, user_id, built_from_cutoff, item_ids, render_hash, eval_run_id, approved_by, approved_at, status}`, with `status` one of `candidate`, `live` or `rolled_back`. "Live" is a pointer per user.

Approval moves the pointer to the candidate; rollback moves it back; nothing is edited. A rejected candidate leaves the previous live package in place. Because each record carries the package id and hash that were in context, a later correction can be traced to the exact package that failed to prevent it.

## A minimal example

The script below runs with the Python standard library. The domain is office-paper procurement because it is dull.

An interaction record, written once and never edited. The two package fields say which package was in context when this answer was produced:

```json
{
  "record_id": "ses-0002:turn-02",
  "session_id": "ses-0002",
  "turn": 2,
  "user_id": "u-17",
  "date": "2025-03-09",
  "origin": "chat-ui",
  "package_id": "pkg-u17-0002",
  "package_hash": "c41e7a0d92b3",
  "user_text": "Our supplier says office paper prices rose about 8% last quarter. Cite a source for every number, and keep an eye on news about the new mill.",
  "answer_shown": "Noted. I will cite a source for every number and flag news on the mill.",
  "feedback": {
    "thumbs": "down",
    "comment": "you still gave one figure with no source"
  }
}
```

A learning item. `kind` is one of `world_fact | method_rule | answer_shape | profile | watch`; `scope` is `general | subject`. Status changes by appending a new item, never by editing:

```json
{
  "item_id": "li-004",
  "kind": "world_fact",
  "scope": "subject",
  "subject": "office-paper",
  "user_id": "u-17",
  "statement": "Office paper prices rose about 8% last quarter (per the user's supplier).",
  "quote": "office paper prices rose about 8% last quarter",
  "source": { "record_id": "ses-0002:turn-02", "field": "user_text" },
  "first_seen": "2025-03-09",
  "last_confirmed": "2025-03-09",
  "status": "active"
}
```

Extraction is a model call with a strict contract. This is the shape of the prompt. In the script, `check()` enforces the two rules code can test on this toy (the quote is verbatim in its record; a world fact is attributed) and uses a flat `record_id` instead of the nested `source`; a real extractor also validates `kind`, `scope` and the named field. `feedback.comment` is extracted the same way as `user_text`:

```text
INPUT: one interaction record as JSON
       (record_id, date, user_text, answer_shown, feedback.comment).

OUTPUT: a JSON array of learning items. Each item has:
  kind       one of world_fact | method_rule | answer_shape | profile | watch
  scope      general | subject  (subject needs an id from the frozen vocabulary)
  field      the record field the quote comes from: user_text or feedback.comment
  quote      a contiguous substring of that field, copied character for character
  statement  one sentence, third person

RULES:
  1. Copy the quote exactly. Never tidy, shorten or merge quotes.
  2. Write a world_fact statement as "per the user" and keep the record's date.
  3. Only a standing instruction becomes an item. A one-off request does not.
  4. If nothing in the record is a standing instruction, output [].
  5. Never invent a kind or a subject that is not in the vocabulary.
```

The rendered package, exactly as the script prints it. Rules first, the world fact in conditional form with its date, and both the superseded rule and the cut listed rather than lost:

```markdown
# Context package pkg-u17-0003

## How to work (apply directly)

- Do not use the word 'skyrocket'. (user's words: "never use the word 'skyrocket'") [src:ses-0001:turn-04 2025-03-02]
- Cite a source for every number, with the link inline after the figure. (user's words: "Cite a source for every number and put the link inline, right after the figure") [src:ses-0003:turn-01 2025-03-20]

## How to shape answers (apply directly)

- Label every figure with its year and unit. (user's words: "Label every figure with its year and unit") [src:ses-0001:turn-04 2025-03-02]

## What the user told you about the world (verify, then apply)

- VERIFY BEFORE USE: on 2025-03-09 the user said "office paper prices rose about 8% last quarter". Check it against a current source. [src:ses-0002:turn-02 2025-03-09]

## Superseded (not served)

- li-003 by li-007

## Not included (over budget)

- li-005 (watch, subject)
```

The replay-evaluation skeleton. The judge is a deterministic, pointwise stub standing in for a model call; swap it for one and keep the rest:

```python
"""Minimal learning-loop replay evaluation. Standard library only.
Run: python3 replay_eval.py
"""
import hashlib
import random
import re
import sys

RECORDS = {
    "ses-0001:turn-04": {
        "date": "2025-03-02",
        "user_text": "Label every figure with its year and unit. And never use the word "
                     "'skyrocket' in anything you write for me.",
    },
    "ses-0002:turn-02": {
        "date": "2025-03-09",
        "user_text": "Our supplier says office paper prices rose about 8% last quarter. Cite "
                     "a source for every number, and keep an eye on news about the new mill.",
    },
    "ses-0003:turn-01": {
        "date": "2025-03-20",
        "user_text": "Cite a source for every number and put the link inline, right after "
                     "the figure, not in a footnote.",
    },
}

ITEMS = [
    {"item_id": "li-001", "kind": "answer_shape", "scope": "general", "status": "active",
     "statement": "Label every figure with its year and unit.",
     "quote": "Label every figure with its year and unit", "record_id": "ses-0001:turn-04"},
    {"item_id": "li-002", "kind": "method_rule", "scope": "general", "status": "active",
     "statement": "Do not use the word 'skyrocket'.",
     "quote": "never use the word 'skyrocket'", "record_id": "ses-0001:turn-04"},
    {"item_id": "li-003", "kind": "method_rule", "scope": "general", "status": "active",
     "statement": "Cite a source for every number.",
     "quote": "Cite a source for every number", "record_id": "ses-0002:turn-02"},
    {"item_id": "li-004", "kind": "world_fact", "scope": "subject", "status": "active",
     "statement": "Office paper prices rose about 8% last quarter (per the user's supplier).",
     "quote": "office paper prices rose about 8% last quarter", "record_id": "ses-0002:turn-02"},
    {"item_id": "li-005", "kind": "watch", "scope": "subject", "status": "active",
     "statement": "Flag news about the new mill.",
     "quote": "keep an eye on news about the new mill", "record_id": "ses-0002:turn-02"},
    {"item_id": "li-006", "kind": "method_rule", "scope": "general", "status": "active",
     "statement": "Avoid dramatic words.",          # paraphrase, not the user's words
     "quote": "avoid dramatic words", "record_id": "ses-0001:turn-04"},
    {"item_id": "li-007", "kind": "method_rule", "scope": "general", "status": "active",
     "statement": "Cite a source for every number, with the link inline after the figure.",
     "quote": "Cite a source for every number and put the link inline, right after the figure",
     "record_id": "ses-0003:turn-01", "supersedes": "li-003"},   # newer wins, by appending
    {"item_id": "li-008", "kind": "world_fact", "scope": "subject", "status": "active",
     "statement": "Office paper prices rose about 8% last quarter.",   # bare fact, no attribution
     "quote": "office paper prices rose about 8% last quarter", "record_id": "ses-0002:turn-02"},
]

LAYERS = [
    ("method_rule", "How to work (apply directly)"),
    ("answer_shape", "How to shape answers (apply directly)"),
    ("world_fact", "What the user told you about the world (verify, then apply)"),
    ("watch", "Standing watches (mention only if relevant)"),
]

JUDGE_PROMPT = ("Score ONE answer, 0 or 1 on each of: method (states an approach), sourcing "
                "(every number carries a source marker), needs (meets the user's stated rules). "
                "Never judge whether the domain call is right.")

REGISTRATION = {
    "experiment": "replay-001",
    "hypothesis": "With the package, answers meet corrections the user only made later.",
    "pass_line": "with-package meets >= 2 of 3 later corrections, sourcing >= without, "
                 "and 0 unresolved leak flags",
    "sample": "1 held-out question (a stub; a real run needs hundreds)",
    "judge_prompt_sha256": "034dca5b3c4e",
    "code_sha256": "8bf703454b2e",
    "seed": 20250401,
    "deviations": [],
}


def sha(text):
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:12]


def code_hash():
    """Hash of this file with the one line that holds the pinned code hash removed."""
    lines = open(__file__, encoding="utf-8").read().splitlines()
    return sha("\n".join(l for l in lines if '"code_sha256"' not in l).rstrip())


def check(item):
    """Code-level checks: the quote must be verbatim in its record; a world fact must be attributed."""
    rec = RECORDS.get(item["record_id"])
    if rec is None:
        return "source record not found"
    if item["quote"].lower() not in rec["user_text"].lower():
        return "quote is not verbatim in the source"
    if item["kind"] == "world_fact" and not re.search(r"per the user|the user said", item["statement"]):
        return "world fact stated as a bare fact"
    return "ok"


def render_line(item):
    date = RECORDS[item["record_id"]]["date"]
    src = f'[src:{item["record_id"]} {date}]'
    if item["kind"] == "world_fact":
        return (f'- VERIFY BEFORE USE: on {date} the user said "{item["quote"]}". '
                f"Check it against a current source. {src}")
    return f'- {item["statement"]} (user\'s words: "{item["quote"]}") {src}'


def render(items, budget, package_id):
    """Layered package inside a character budget. Superseded items and cuts are listed, never silent."""
    active = [i for i in items if i["status"] == "active"]
    superseded = {i["supersedes"]: i["item_id"] for i in active if "supersedes" in i}
    header = f"# Context package {package_id}\n"
    out, cut, used = [header], [], len(header)
    for kind, title in LAYERS:
        heading = f"\n## {title}\n"
        kept, used_before = [], used
        used += len(heading)
        for item in [i for i in active if i["kind"] == kind and i["item_id"] not in superseded]:
            line = render_line(item) + "\n"
            if used + len(line) > budget:
                cut.append(f'{item["item_id"]} ({item["kind"]}, {item["scope"]})')
            else:
                kept.append(line)
                used += len(line)
        if kept:
            out.append(heading + "".join(kept))
        else:
            used = used_before  # an empty layer costs nothing
    if superseded:
        out.append("\n## Superseded (not served)\n"
                   + "\n".join(f"- {old} by {new}" for old, new in sorted(superseded.items())) + "\n")
    if cut:
        out.append("\n## Not included (over budget)\n" + "\n".join(f"- {c}" for c in cut) + "\n")
    return "".join(out)


def stub_judge(answer):
    """Pointwise stand-in for a model judge. Scores what is visible in ONE answer, never the domain call."""
    numbers = re.findall(r"\d+%", answer)
    return {
        "method": int(answer.startswith("Approach:")),
        "sourcing": int(bool(numbers) and answer.count("[source:") >= len(numbers)),
        "needs": int("skyrocket" not in answer and bool(re.search(r"\b20\d\d\b", answer))),
    }


def blind_pair(with_pkg, without_pkg, seed):
    """Seeded random order. The position-to-arm mapping stays here, not in the judge's bundle."""
    order = ["with", "without"]
    random.Random(seed).shuffle(order)
    texts = {"with": with_pkg, "without": without_pkg}
    scores_by_position = [stub_judge(texts[arm]) for arm in order]
    return order, dict(zip(order, scores_by_position))


def corrections_met(answer, corrections):
    """Which of the user's LATER corrections does this answer already satisfy?"""
    return [c["id"] for c in corrections if re.search(c["met_if"], answer, re.I | re.S)]


def leak_scan(answer, package, n=6):
    """Sentences that repeat an n-word run from the package with no source marker."""
    def grams(text):
        words = re.findall(r"[a-z0-9%']+", text.lower())
        return {tuple(words[i:i + n]) for i in range(len(words) - n + 1)}
    pkg = grams(package)
    return [s for s in re.split(r"(?<=[.!?])\s+", answer)
            if grams(s) & pkg and "[source:" not in s and "you said" not in s]


if __name__ == "__main__":
    if sha(JUDGE_PROMPT) != REGISTRATION["judge_prompt_sha256"] or code_hash() != REGISTRATION["code_sha256"]:
        print("verdict: REFUSED (code or judge prompt differs from the registration)")
        sys.exit(1)

    for item in ITEMS:
        print(f'{item["item_id"]} {item["kind"]:<13} {check(item)}')
    good = [i for i in ITEMS if check(i) == "ok"]

    package = render(good, budget=850, package_id="pkg-u17-0003")
    print("\n" + package)

    # Held out: a later question and what the user corrected after it. The package never saw these.
    corrections = [
        {"id": "year-and-unit", "met_if": r"\b20\d\d\b"},
        {"id": "source-per-number", "met_if": r"\d+%[^.]*\[source:"},
        {"id": "no-skyrocket", "met_if": r"^(?!.*skyrocket)"},
    ]
    without = ("Office paper costs will probably skyrocket next quarter. Prices rose "
               "about 8% recently, so budget for more.")
    with_pkg = ("Approach: check the latest supplier list first. You said prices rose about "
                "8% (Q1 2025) [source: your note, 2025-03-09]; I could not confirm that "
                "against a public index. I will check it against a current source before "
                "relying on it. Expect a modest further rise.")

    seed = REGISTRATION["seed"]
    order, scores = blind_pair(with_pkg, without, seed)
    for arm, text in (("without", without), ("with", with_pkg)):
        print(f"[{arm}] judge={scores[arm]} later_corrections_met="
              f"{corrections_met(text, corrections)} leak_flags={len(leak_scan(text, package))}")

    met = corrections_met(with_pkg, corrections)
    leaks = leak_scan(with_pkg, package)
    passed = len(met) >= 2 and scores["with"]["sourcing"] >= scores["without"]["sourcing"] and not leaks
    print(f"\nverdict: {'PASS' if passed else f'FAIL pending review ({len(leaks)} leak flag)'}")
    print(f"pinned: code_sha256={REGISTRATION['code_sha256']} "
          f"judge_prompt_sha256={REGISTRATION['judge_prompt_sha256']} seed={seed} order={order}")
```

Run it and you see: two items rejected by code (a paraphrased quote, and a world fact written as a bare statement); the package above, with li-003 superseded by li-007 and the watch cut for budget; both arms scored; one leak flag; and a verdict of FAIL pending review. Both arm answers are stubs typed into the script, so the run exercises the scorer, not the loop. The leak is deliberate: the with-package answer parrots the package's own instruction ("check it against a current source") with no source marker, the echo the scan exists to catch. A real run sends that sentence to the judge for confirmation.

The code hash in the last line is taken over the file with the one line that holds it removed, so the pin can live inside the file it pins. Add a comment anywhere and the script refuses to run with `verdict: REFUSED`. On disk, the same registration is a small JSON file written before the run:

```json
{
  "experiment": "replay-001",
  "hypothesis": "With the package, answers meet corrections the user only made later.",
  "pass_line": "with-package meets >= 2 of 3 later corrections, sourcing >= without, and 0 unresolved leak flags",
  "sample": "1 held-out question (a stub; a real run needs hundreds)",
  "judge_prompt_sha256": "034dca5b3c4e",
  "code_sha256": "8bf703454b2e",
  "seed": 20250401,
  "deviations": []
}
```

## How I use this in production

The production version of this loop sits behind an agentic research system for a global hedge fund with ~$1B AUM, where answers draw on 12+ sector forecasting models. These are the lessons that held up. I am not reporting the measured gain here; the pass lines and what they tested are the transferable part.

**Structure before code.** When the naive design failed on the taxonomy question, I stopped and wrote a capability map: the stages, with stable ids and a build order, before any code. Every later spec, plan and task referred to those ids, and the map kept me oriented while coding agents built most of the pipeline.

**Let the model draft the vocabulary, then freeze it.** The frozen set became the enum for the labelling run, checked on a sealed sample and rerun with the cache bypassed to measure stability.

**Compare clustering strategies in writing first.** Rule-based signatures from labels are explainable and cheap but bounded by the vocabulary; model-proposed clusters find cross-cutting themes but cost more. Start with signatures and let the model confirm and name the clusters.

**Retire experiments in the open.** Each stage had a pre-registered experiment with pass lines and frozen file hashes. An experiment retired before any run stayed on the record as retired, with its shortfall carried forward in writing.

**Budget from day one.** In an older, separate pipeline, extracted claims were injected into every later stage with no cap or pruning, and per-thread cost rose without bound. Anything learned needs a budget and a pruning rule before it is served.

**Keep cost legible.** Per-call accounting, a ceiling per stage, and the judge budget kept separate from extraction.

## When this loop is the wrong tool

![A comparison table of notes in the prompt, a vendor memory tool, retrieval over transcripts, fine-tuning and this loop, across per-user, provenance, staleness, withdrawal, measurement and build cost. Below, when each simpler option is enough.](/writing/learning-loop-for-ai-agents/10-when-not-to-build-this.svg "Alternatives compared: where notes, vendor memory, retrieval or fine-tuning are enough, and where the loop earns its cost.")

This loop is the most expensive of five ways to make an assistant behave differently for a user. How I read the comparison:

- **Notes in the prompt** are per-user if you keep one file per user, carry no provenance, go stale silently, are withdrawn by editing the file and are measured by eye. They cost an afternoon.
- **A vendor memory tool** is per-user and costs hours, but the model is the author: no verbatim quote, no date on a claim, no human gate, withdrawal depends on what the vendor exposes, and nothing measures the effect.
- **Retrieval over past transcripts** (RAG, retrieval-augmented generation) is per-user and has provenance by construction. It goes stale as the transcripts do, withdrawal is a delete from the index, measurement is possible but rarely done, and it takes days to build.
- **Fine-tuning on preference pairs** is not per-user at any sane scale, carries no provenance and no dates, cannot be withdrawn without retraining, is measurable only in aggregate, and takes weeks.
- **This loop** is per-user, carries provenance to the word, dates every claim, withdraws by tombstone and measures by replay. It costs about a week to stand up and a reviewer's time every cycle.

Three cases where a simpler option is enough:

- An internal tool where the person who corrects the assistant also edits its instructions: notes in the prompt.
- An assistant that learns facts the user shared, not rules for how to work: retrieval over the transcripts, with a date on every chunk.
- A drafting aid whose output a person always reviews before use: a vendor memory tool, with a cap on file size.

Rule of thumb: build the loop when corrections are per-user, recur across sessions, and someone is accountable for a wrong answer. If one is missing, pick something cheaper, but keep the record stage: it costs little and cannot be added later.

## Pitfalls when serving corrections

**Letting the model write served rules directly.** Self-edited memory is fine for in-task notes. Rules that shape other sessions need a verbatim quote, a code check and a human gate.

**Serving world facts as statements.** "Prices rose 8%" with no date becomes a lie in three months. Serve it as "the user said, on this date; verify".

**Merging for tidiness.** Folding a subject-specific instruction into a general principle loses the scope the user cared about. Merge duplicates, never scope.

**Editing a live package.** Render a new candidate, evaluate it, move the pointer. The only exception is a withdrawal, which re-renders without a new evaluation.

## Checklist

![Two checklists. Day 1: record schema, taxonomy enum, verbatim-quote check, verify-then-apply rendering, budget with listed cuts, package stamp on each answer. Week 1: cutoff date, extraction prompt and sample, calibrated judge, registration file, named approvers, withdrawal path and cost ceiling. Closing line: approval is a step, not a hope.](/writing/learning-loop-for-ai-agents/11-day-1-and-week-1.svg "What to build on day 1 and in week 1.")

Day 1 makes learning checkable; week 1 makes it provable.

**Day 1 (half a day, one engineer)**

- [ ] Engineer: write the record schema with provenance, `package_id` and `package_hash`.
- [ ] Engineer: write the taxonomy as an enum: kind, scope, owner, status, supersedes.
- [ ] Engineer: add the code check that every quote is verbatim in its record and every world fact is attributed.
- [ ] Engineer: render world facts in "verify then apply" form with their date.
- [ ] Engineer: set a package budget, render in layers, list every cut and every superseded item.
- [ ] Engineer: stamp every record with the package id that was in context.
- [ ] Engineer: fix package placement: one block after the static system text, before the user turn.

**Week 1 (engineer + one reviewer)**

- [ ] Engineer: pick a cutoff date; build packages only from sessions before it.
- [ ] Engineer and reviewer: write the extraction prompt and check it on a hand-labelled sample.
- [ ] Reviewer: approve a `met_if` predicate for each sampled later correction; freeze them with the registration.
- [ ] Engineer: calibrate the judge against human labels; pick pointwise or pairwise.
- [ ] Engineer: write the first registration file with both hashes and the seed.
- [ ] Reviewer: name who approves each stage and where the approval is recorded; sign the first manifest.
- [ ] Engineer: build the withdrawal path: tombstone, rebuild, re-render.
- [ ] Engineer: set a cost ceiling per stage; keep the judge budget separate from extraction.

Approval is a step, not a hope.

## Further reading

- [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents): context as a budget.
- [Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents): graders, trials, transcripts.
- [Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents): files as a build's memory.
- [Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena](https://arxiv.org/abs/2306.05685): judge biases and remedies.
- [Pre-registration for Predictive Modeling](https://arxiv.org/abs/2311.18807): fixing the evaluation plan first.
- [Event Sourcing pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/event-sourcing): immutable events, the personal-data caveat.
