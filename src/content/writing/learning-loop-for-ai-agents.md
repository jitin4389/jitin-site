"It doesn't learn." I have heard this from users of every assistant I have worked on. They corrected it on Monday: which words to avoid, how to cite, how to label a chart. On Tuesday a new session starts from zero and the same mistakes come back. The complaint is fair. It is aimed at the wrong thing.

The model is not the part that fails to learn. It is stateless by design, and it should be. What fails is the system around it. Nothing records what the user said in a checkable form. Nothing decides which of those things should shape future answers. Nothing measures whether answers got better. "It doesn't learn" is a design problem.

This article describes the architecture I now use for a learning loop. The code was the easy part. The hard part was structuring the problem: what kinds of learning exist, where each belongs, and how to prove the loop helps rather than just changes things.

## Why the obvious fix fails

Almost everyone's first design is the same: store the corrections, inject them into the next prompt. I built that version too. It breaks for five reasons.

**The kinds of learning get mixed.** "Never use the word skyrocket", "our supplier says prices rose last quarter" and "watch for news about the new mill" are different things: a writing rule, a claim that may already be wrong, a standing request. In one flat list, the model applies the stale claim as confidently as the style rule.

**World facts go stale and get parroted.** A user mentions a number. Months later the assistant repeats it as fact, undated and unsourced, after it has changed.

**Learned text leaks into answers.** Notes in the prompt get echoed. Users see their own words coming back, or the assistant's instructions to itself ("as per my rules...").

**The list grows without bound.** Every correction is one more line in every prompt. Cost rises and recall falls as the context fills; context "must be treated as a finite resource with diminishing marginal returns" ([source](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)). The naive design never removes anything.

**Nothing is measured.** The list changes answers, but nobody can say whether it improves them. Every tweak is a guess.

These are structural gaps, not bugs. The architecture below closes them.

## The idea

The learning loop is a pipeline of seven stages. Each reads files, writes files and can be run again. A person approves each stage's output before the next one trusts it.

```text
  interaction            +---------+     +---------+     +---------+
  (question, answer  --> | record  | --> | enrich  | --> |  group  |
   shown, feedback)      +---------+     +---------+     +---------+
                         immutable,      add-only        frozen vocabulary,
                         provenance      sidecars        registry of subjects
                                                              |
                                                              v
  +---------+     +----------+     +---------+           +---------+
  | approve | <-- | evaluate | <-- |  serve  | <-------- | extract |
  +---------+     +----------+     +---------+           +---------+
  human gate      replay against   budgeted,             typed items,
  per stage       later sessions   layered package       verbatim quotes
```

**Record** turns each interaction into one immutable record with provenance: who, when, what was asked, what answer was shown, what feedback followed. **Enrich** adds labels and summaries beside the record without changing it. **Group** sorts records by subject using a vocabulary a human has frozen. **Extract** pulls out typed learning items, each citing the user's exact words. **Serve** renders a budgeted package for the next session. **Evaluate** replays old questions with and without the package. **Approve** is the human gate that lets a package go live.

The shape matters more than the tooling. Plain files and local commands work; so do a queue and a database. What makes it a loop is that evaluation feeds back into extraction, and approval is a step, not a hope.

## Principles

### Record first, deterministically, with provenance

**One immutable record per interaction, parsed once by code. It is the source of truth.**

Reason: everything downstream is a derived view. If the record can change, views silently disagree. This is event sourcing ([Fowler](https://martinfowler.com/eaaDev/EventSourcing.html)), but only half of it: an append-only store of what happened, with views rebuilt from it. Microsoft's guide rightly warns that the full pattern is heavy and usually unnecessary ([source](https://learn.microsoft.com/en-us/azure/architecture/patterns/event-sourcing)).

In practice: a record holds the answer the user saw, not drafts, with ids, timestamps and origin. If an enricher later disagrees with the record, that is a parser bug, not an override.

### Enrichment is add-only and versioned

**Enrichers write sidecars next to the record, never into it, keyed by a hash of their inputs and their own version.**

Reason: enrichment is where model calls happen, and model calls are lossy and non-deterministic. Separate, versioned output means you can re-run a better enricher later without touching the record, and skip work whose inputs have not changed. Check a model-based enricher against a hand-labelled sample before trusting it.

### A taxonomy of learnings, with scope and precedence

**Every learning item has a kind, a scope and an owner.**

The kinds: **world facts** (claims about the outside world), **method rules** (how to work), **answer shape** (how to present), **profile** (who the user is) and **standing watches** (things to flag when they appear). Scope is **general** or **subject-specific**. Ownership is **per-user** or **shared**.

Reason: each kind needs different handling. Method rules apply directly, world facts must be checked, watches are conditional. Without the taxonomy the serving layer cannot tell them apart. Public surveys of agent memory use other splits ([source](https://arxiv.org/abs/2512.13564)); treat mine as operational, not theoretical.

Precedence keeps the set sane. Newer wins when two items conflict. A specific instruction stays specific; it is not folded into a general principle. Automatic merging is right for duplicates and wrong for scope.

### Humans freeze vocabularies; machines do the volume

**A model may propose labels and clusters. A human freezes the vocabulary. The frozen vocabulary then becomes the schema the machine must use.**

Reason: a vocabulary that keeps changing cannot be measured against, and groups nobody named cannot be explained to a user. Freezing turns a fuzzy task into classification with fixed answers, which code can check and a sample can score. Anthropic's harness post found models "less likely to inappropriately change or overwrite JSON files compared to Markdown files" ([source](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)); make the vocabulary a typed enum, not a prose list.

In practice: the model drafts labels; a human drops, renames, merges and redefines them; the result is frozen as ids. Routing new records is then propose-then-verify, with code checks on ids and a score against hand-routed reference keys.

### Every served item cites the user's own words

**No item is served without a verbatim quote and a pointer to its record, checked by code.**

Reason: paraphrase is where meaning drifts. "Prefer lead-time data" is not what the user said; "lead times matter more to me than list prices" is. The code check (is this string actually in that record?) turns provenance into a guarantee, and catches the commonest extraction failure: the model inventing a tidier version of what it read.

Verbatim quotes are personal data, and an immutable store "conflicts with data protection regulations that require deletion of personal data" ([source](https://learn.microsoft.com/en-us/azure/architecture/patterns/event-sourcing)). Design withdrawal in from the start.

### World facts are "verify then apply", never statements

**A world fact is served as a dated claim the user made, with an instruction to check it, never as a fact to restate.**

Reason: the model cannot verify the claim from inside the prompt, and judges cannot either; Zheng et al. found a model judge mis-grading basic maths problems it could solve itself ([source](https://arxiv.org/abs/2306.05685)). The safe form is "on this date the user said X; check it against a current source". Method and shape rules apply directly because they are about behaviour, not truth. Extraction rejects a world fact written as a bare statement.

### Budgets and layered rendering

**The package has a character budget. Items render in layers in a fixed order, and anything cut is listed, not silently dropped.**

Reason: context is finite and position matters. Liu et al. found performance "often highest when relevant information occurs at the beginning or end of the input context" and worse in the middle ([source](https://arxiv.org/abs/2307.03172)). So layer order is a design decision: how-to-work rules first, watches last because they are conditional. A listed cut tells the model and the reviewer what was left out. A byte-stable package also lets prompt caching work.

### Evaluate by replay before serving

**No package goes live until old questions have been replayed with and without it and scored.**

Reason: changing answers is easy; improving them is the question. A model judge scores what is visible: did the answer state a method, did every number carry a source, did it meet the user's stated needs. It is told never to adjudicate the domain call, because it cannot. Code guards run beside it: a leak scan for sentences that repeat a run of words from the package with no source marker, a self-reference check, a length check.

The judge sees both answers in a seeded random order, with the mapping kept outside the bundle. Zheng et al. documented position bias and offer two remedies: swap the order and require agreement, or randomise at scale ([source](https://arxiv.org/abs/2306.05685)). Bias is strongest when answers are close in quality ([source](https://arxiv.org/abs/2406.07791)). Pick one remedy and keep it fixed.

### Measure against what the user later corrected

**The main score is whether the with-package answer already does what the user asked for, or corrected, later in the original session, which the package never saw.**

Reason: a judge's opinion is a proxy; a correction the user actually made is ground truth. This needs a time cutoff: packages are built only from sessions before it, and later sessions are the test. Kapoor and Narayanan found data leakage behind reproducibility failures across many fields ([source](https://arxiv.org/abs/2207.07048)); the cutoff is the simplest guard.

### Pre-register experiments and pin the code

**Before a run, write the hypothesis, pass line, sample and judge prompt. Hash the code and the prompt. A mismatch refuses the run.**

Reason: once you have seen results, every analysis choice becomes a fork, and the loop starts fitting its own test. Nosek and colleagues define preregistration as "committing to analytic steps without advance knowledge of the research outcomes" ([manuscript](https://errorstatistics.com/wp-content/uploads/2017/07/nosek-et-al-preregistration-revolution.pdf)). Hofman et al. adapt it to predictive modelling and name "unintentional re-use of test data" as a threat ([source](https://arxiv.org/abs/2311.18807)). It is a discipline, not a guarantee. Deviations happen; record them rather than hide them.

### One human gate per stage

**Each stage has exactly one place where a person approves its output before the next stage uses it.**

Reason: a model can write its own scratch notes freely, and vendor memory tools let it ([source](https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool)). A rule that will shape every future answer for a user is a different thing. One gate per stage catches a bad vocabulary, a wrong cluster or a leaking package, and the pipeline still runs. OpenAI's agents guide calls human intervention "a critical safeguard" ([source](https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf)). Anthropic's evals post puts it more bluntly: "Read the transcripts!" ([source](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)).

### Repeatable batch runs

**Every stage is a local command: files in, files out, versioned outputs, caches keyed by prompt hash, a cost ceiling.**

Reason: a loop that runs only as a one-off analysis is not a loop. Files in and out mean any stage can be rerun, diffed and reviewed. Hash-keyed caches make reruns on unchanged inputs free. Ceilings stop a bad prompt running away with the budget. The bootstrap pass over history and the ongoing pass over new sessions should be the same code.

When coding agents build most of the pipeline, the owner can lose track of what exists. A capability map with stable ids and a build order, written before the code, keeps specs, plans and tasks aligned. Anthropic's harness post describes a cousin: a progress log and feature list that later sessions update but do not rewrite ([source](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)).

## A minimal example

The script below runs with the Python standard library. The domain is office-paper procurement, chosen because it is dull.

An interaction record, written once and never edited:

```json
{
  "record_id": "ses-0002:turn-02",
  "session_id": "ses-0002",
  "turn": 2,
  "user_id": "u-17",
  "date": "2025-03-09",
  "origin": "chat-ui",
  "user_text": "Our supplier says office paper prices rose about 8% last quarter. Cite a source for every number, and keep an eye on news about the new mill.",
  "answer_shown": "Noted. I will cite a source for every number and flag news on the mill.",
  "feedback": { "thumbs": "down", "comment": "you still gave one figure with no source" }
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

The rendered package, as the script below prints it. Rules first, the world fact in conditional form with its date, the cut listed rather than lost:

```markdown
# Context package

## How to work (apply directly)
- Do not use the word 'skyrocket'. (user's words: "never use the word 'skyrocket'") [src:ses-0001:turn-04 2025-03-02]
- Cite a source for every number. (user's words: "Cite a source for every number") [src:ses-0002:turn-02 2025-03-09]

## How to shape answers (apply directly)
- Label every figure with its year and unit. (user's words: "Label every figure with its year and unit") [src:ses-0001:turn-04 2025-03-02]

## What the user told you about the world (verify, then apply)
- VERIFY BEFORE USE: on 2025-03-09 the user said "office paper prices rose about 8% last quarter". Check it against a current source. [src:ses-0002:turn-02 2025-03-09]

## Not included (over budget)
- li-005 (watch, subject)
```

The replay-evaluation skeleton. The judge is a deterministic stub standing in for a model call; swap it for one and keep the rest:

```python
"""Minimal learning-loop replay evaluation. Standard library only.
Run: python3 replay_eval.py
"""
import hashlib
import random
import re

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
]

LAYERS = [
    ("method_rule", "How to work (apply directly)"),
    ("answer_shape", "How to shape answers (apply directly)"),
    ("world_fact", "What the user told you about the world (verify, then apply)"),
    ("watch", "Standing watches (mention only if relevant)"),
]


def check(item):
    """Code-level provenance check. The quote must appear verbatim in its record."""
    rec = RECORDS.get(item["record_id"])
    if rec is None:
        return "source record not found"
    if item["quote"].lower() not in rec["user_text"].lower():
        return "quote is not verbatim in the source"
    return "ok"


def render_line(item):
    date = RECORDS[item["record_id"]]["date"]
    src = f'[src:{item["record_id"]} {date}]'
    if item["kind"] == "world_fact":
        return (f'- VERIFY BEFORE USE: on {date} the user said "{item["quote"]}". '
                f"Check it against a current source. {src}")
    return f'- {item["statement"]} (user\'s words: "{item["quote"]}") {src}'


def render(items, budget):
    """Layered package inside a character budget. Headings count too. Cuts are listed, never silent."""
    header = "# Context package\n"
    out, cut, used = [header], [], len(header)
    for kind, title in LAYERS:
        heading = f"\n## {title}\n"
        kept, used_before = [], used
        used += len(heading)
        for item in [i for i in items if i["kind"] == kind and i["status"] == "active"]:
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
    if cut:
        out.append("\n## Not included (over budget)\n" + "\n".join(f"- {c}" for c in cut) + "\n")
    return "".join(out)


def stub_judge(answer):
    """Stand-in for a model judge. Scores what is visible in the text, never the domain call."""
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
    return dict(zip(order, scores_by_position))


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
    for item in ITEMS:
        print(f'{item["item_id"]} {item["kind"]:<13} {check(item)}')
    good = [i for i in ITEMS if check(i) == "ok"]

    package = render(good, budget=800)
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
                "against a public index. Expect a modest further rise.")

    seed = 20250401
    scores = blind_pair(with_pkg, without, seed)
    for arm, text in (("without", without), ("with", with_pkg)):
        print(f"[{arm}] judge={scores[arm]} later_corrections_met="
              f"{corrections_met(text, corrections)} leak_flags={len(leak_scan(text, package))}")

    code_hash = hashlib.sha256(open(__file__, "rb").read()).hexdigest()[:12]
    print(f"\npinned: code_hash={code_hash} seed={seed}")
```

Run it and you will see one item rejected because its quote is a paraphrase, the package above, and both arms scored: the without-package answer meets none of the user's later corrections, the with-package answer meets all three with no leak flags. The last line prints the code hash and seed; in a real pipeline those go into the registration file before the run.

## How I use this in production

The production version sits behind an agentic research system for a global hedge fund with ~$1B AUM, where answers draw on 12+ sector forecasting models. These are the lessons that held up.

**Structure before code.** When the naive design failed on the taxonomy question, I stopped and wrote a capability map of stages with stable ids and a build order before any code. Every later spec, plan and task referred to those ids, and the map kept me oriented while coding agents built most of the pipeline.

**Parse once.** One uniform record per interaction, holding the answer the user actually saw, removed a whole class of later arguments.

**Let the model draft the vocabulary, then freeze it.** The frozen set became the enum for the labelling run. Labels were checked on a sealed sample and rerun with the cache bypassed to measure stability.

**Compare clustering strategies in writing first.** Rule-based signatures from labels are explainable and cheap but bounded by the vocabulary. Model-proposed clusters find cross-cutting themes but cost more. I went signature-first, with the model confirming and naming clusters.

**Provenance checks catch what prompts cannot.** Code checked verbatim quotes, pasted text, numbers stated as facts, the conditional form of world facts and self-reference.

**Retire experiments in the open.** Each stage had a pre-registered experiment with pass lines and frozen file hashes. An experiment retired before any run was recorded as retired; shortfalls were carried forward in writing.

**Budget from day one.** In an older, separate pipeline, extracted claims were injected into every later stage with no cap or pruning, and per-thread cost rose without bound. Anything learned needs a budget and a pruning rule before it is served.

**Files and local commands first.** Every stage ran as a local command over a folder, with per-call cost accounting, a ceiling per stage and the judge budget kept separate from extraction.

## Pitfalls

**Letting the model write served rules directly.** Self-edited memory is fine for in-task notes. Rules that shape other sessions need a verbatim quote, a code check and a human gate.

**Serving world facts as statements.** "Prices rose 8%" with no date becomes a lie in three months. Serve it as "the user said, on this date; verify".

**Merging for tidiness.** Folding a subject-specific instruction into a general principle loses the scope the user cared about. Merge duplicates, never scope.

**Grading in a fixed order.** Position bias is real. Randomise with a seed, or swap and require agreement; keep the mapping out of the judge's view.

**Scoring the loop on data it was built from.** Build before the cutoff, test after it. Keep the pairs you tuned on out of the measure.

**Changing the pass line after seeing results.** Write it first, hash the code and prompt, record deviations.

**No budget, no pruning.** A list that only grows eventually crowds out the question itself.

## Checklist

- [ ] Write a one-page capability map of the seven stages with stable ids.
- [ ] Write the taxonomy as an enum: kind, scope, owner, status.
- [ ] Add a code check that every item's quote is verbatim in its record.
- [ ] Render world facts in "verify then apply" form with their date.
- [ ] Set a package budget and list every cut.
- [ ] Pick a cutoff date; build packages only from sessions before it.
- [ ] Write the first pre-registration: hypothesis, pass line, sample, judge prompt, hashes.
- [ ] Name who approves each stage and where the approval is recorded.

## Further reading

- [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents): why context is a budget, and the case for just-in-time retrieval.
- [Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents): tasks, trials and graders; prefer deterministic graders; read the transcripts.
- [Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents): progress logs and feature lists as the memory of a multi-session build.
- [Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena](https://arxiv.org/abs/2306.05685): position and verbosity bias in model judges, and the remedies.
- [Pre-registration for Predictive Modeling](https://arxiv.org/abs/2311.18807): a lightweight template for fixing an evaluation plan before seeing results.
- [Event Sourcing pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/event-sourcing): immutable events, versioning, the personal-data caveat, when not to use it.
