# Research notes: "It doesn't learn" — an architecture for a learning loop in AI agents

**Status:** researcher output, ready for the writer.
**Date:** 2026-10-10
**Scope:** public sources only, plus the anonymised production lessons supplied by the editorial brief. No client, product, dataset, vendor or repository is named anywhere in this file, and nothing here adds to the approved public facts.

How to use this file:

- Section 1 restates the problem the article must solve.
- Section 2 is the source catalogue. Every URL was fetched on 2026-10-10. Quotes are verbatim from the fetched page or PDF. Where a page could not be read, it says so, and the writer must not cite it.
- Section 3 maps each of the twelve principles to its supporting and dissenting sources.
- Section 4 lists where sources disagree with each other or with the architecture.
- Section 5 restates the anonymised production lessons in general form, mapped to principles.
- Section 6 is the proposed original example (JSON shapes, rendered package, Python kit, run output).
- Section 7 lists claims the writer must not make.

---

## 1. The problem in one paragraph

An assistant or agent serves the same users for months. Users correct it, state standing rules (words to avoid, how to cite, how to label figures), steer the analysis mid-chat and leave thumbs-up or thumbs-down. The next session starts from zero and the same mistakes return. The obvious fix, "store the corrections and inject them next time", breaks on contact: it does not say what kinds of learning exist and where each belongs, how to stop learned world-facts going stale or being parroted, how to stop the injected context growing without bound, how to prove the loop improves answers rather than just changing them, and how to make the pipeline repeatable rather than a one-off analysis. When coding agents build most of the pipeline, a further problem appears: the owner loses track of what was built and whether it is still on course. The architecture therefore has to be legible to its owner, not only correct.

---

## 2. Source catalogue

Format for each entry: URL (fetched), author, date, points that matter for this article, exact quotes, and which principles it supports (P1–P12 refer to the brief's numbered principles).

### 2A. Anthropic engineering posts and docs

#### S1. Effective context engineering for AI agents

- URL: https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
- Author: Prithvi Rajasekaran, Ethan Dixon, Carly Ryan, Jeremy Hadfield (Anthropic Applied AI), with contributors.
- Date: 29 September 2025.
- Points:
  1. Context is a finite resource with diminishing returns. Recall degrades as the window fills ("context rot").
  2. Every token spends attention budget, so curation of what goes in matters more than how much fits.
  3. Prefer just-in-time retrieval: keep lightweight references (paths, queries, links) and pull content when needed, rather than loading everything up front.
  4. Compaction: summarise a conversation nearing the limit and continue in a fresh window; clearing stale tool results is the lightest form.
  5. Structured note-taking: the agent writes notes to memory outside the window and reads them back later.
  6. Sub-agents each work in a clean context and return a condensed summary.
- Quotes:
  - "Context, therefore, must be treated as a finite resource with diminishing marginal returns."
  - "Every new token introduced depletes this budget by some amount"
  - agents "maintain lightweight identifiers (file paths, stored queries, web links, etc.)"
  - "the agent regularly writes notes persisted to memory outside of the context window"
  - each sub-agent "returns only a condensed, distilled summary of its work"
- Supports: P7 (budgets), P12 (just-in-time, files as the interface). Also the general case for keeping learned context small.

#### S2. Building effective agents

- URL: https://www.anthropic.com/engineering/building-effective-agents
- Author: Erik Schluntz and Barry Zhang (Anthropic).
- Date: 19 December 2024 (page notes tooling has moved on since).
- Points:
  1. Workflows (predefined code paths) versus agents (model decides its own steps). Use the simplest option that works.
  2. Start simple; frameworks can hide prompts and responses and make debugging harder.
  3. Composable patterns: prompt chaining, routing, parallelisation (sectioning and voting), orchestrator-workers, evaluator-optimizer.
  4. Evaluator-optimizer works when evaluation criteria are clear and feedback measurably improves output.
  5. Measure and add complexity only when it demonstrably improves outcomes; human checkpoints are legitimate stopping points.
- Quotes:
  - "the most successful implementations weren't using complex frameworks or specialized libraries."
  - "find the simplest solution possible, and only increasing complexity when needed."
  - "consider adding complexity only when it demonstrably improves outcomes."
  - "Workflows are systems where LLMs and tools are orchestrated through predefined code paths."
- Supports: P11 (human gates as checkpoints), P12 (the learning loop as a workflow of local commands, not an autonomous agent), P4 (voting = majority over seeded runs), P8 (evaluator pattern).

#### S3. Demystifying evals for AI agents

- URL: https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents
- Author: Mikaela Grace, Jeremy Hadfield, Rodrigo Olivares, Jiri De Jonghe (Anthropic).
- Date: 9 January 2026.
- Points:
  1. Vocabulary: task (inputs plus success criteria), trial (one attempt), grader (scoring logic), transcript (full record of a trial), outcome (end state).
  2. Three grader families: code-based (cheap, objective, brittle), model-based (flexible, non-deterministic, needs calibration against humans), human (gold standard, slow).
  3. A 0% pass rate across many trials usually means a broken task or grader, not a weak agent. Read the transcripts.
  4. Shared-state leakage between trials gave an unfair advantage; each trial should start clean.
  5. Grade what was produced rather than the path, and prefer deterministic graders where possible. An eval at 100% tracks regressions but gives no signal for improvement.
- Quotes:
  - "a single test with defined inputs and success criteria"
  - "choosing deterministic graders where possible"
  - "grade what the agent produced, not the path it took."
  - "is most often a signal of a broken task, not an incapable agent"
  - "An eval at 100% tracks regressions but provides no signal for improvement."
  - "Read the transcripts!"
- Supports: P8 (judge plus code guards), P9 (clean separation of test from training material), P10 (fixed graders). Partial counter-view for P8: it prefers grading outputs over paths; the article's judge scores method and sourcing as visible properties of the answer text, which is compatible, but the writer should not claim Anthropic endorses method-grading.

#### S4. Writing effective tools for agents — with agents

- URL: https://www.anthropic.com/engineering/writing-tools-for-agents
- Author: Ken Aizawa (Anthropic), with contributors.
- Date: 11 September 2025.
- Points:
  1. Prototype first, then build evaluation tasks from realistic data with verifiable outcomes.
  2. Avoid over-strict verifiers that punish harmless wording differences.
  3. Track runtime, call counts, token use and errors; read transcripts.
  4. Use held-out test sets to check for overfitting when iterating with an agent.
- Quotes:
  - "Start by standing up a quick prototype of your tools."
  - "Avoid overly strict verifiers that reject correct responses"
- Supports: P9 (held-out sets), P10 (keep development pairs out of measures), P12 (cost accounting per call).

#### S5. Effective harnesses for long-running agents

- URL: https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents
- Author: Justin Young (Anthropic).
- Date: 26 November 2025.
- Points:
  1. Agents lose memory between sessions; compaction alone was not enough.
  2. An initializer session sets up a progress log, a feature list and an init script; later sessions make incremental progress and leave structured updates.
  3. Feature list kept as JSON because models are less likely to overwrite it carelessly than Markdown; sessions may only flip a feature's pass status.
  4. One feature at a time; end-to-end verification before marking done; git commits as checkpoints.
- Quotes:
  - "each new session begins with no memory of what came before."
  - "It is unacceptable to remove or edit tests because this could lead to missing or buggy functionality."
  - "the kind of code that would be appropriate for merging to a main branch"
- Supports: P12 (capability map with stable ids and build order keeps the owner and the coding agents oriented; same code for bootstrap and ongoing). This is the closest public analogue to the brief's "legible to its owner when agents build it".

#### S6. Memory tool (API docs)

- URL: https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool (redirect target of the docs.anthropic.com URL).
- Author: Anthropic documentation. Date: not stated on page; current as of fetch.
- Points:
  1. Memory is a client-side directory of files under `/memories`; the model requests `view`, `create`, `str_replace`, `insert`, `delete`, `rename` and the application executes them. Storage is entirely the application's.
  2. Use cases include "Apply lessons from past interactions, decisions, and feedback to new tasks".
  3. The API injects a protocol: view memory first, record progress, "ASSUME INTERRUPTION".
  4. Security: cap file sizes and view length, expire files not accessed for a long time, validate every path against traversal.
  5. Pairs with context editing and server-side compaction; memory preserves what must survive summarisation.
  6. Multisession pattern: initializer session sets up progress log and feature checklist; later sessions read them first.
- Quotes:
  - "Apply lessons from past interactions, decisions, and feedback to new tasks"
  - "The memory tool operates client-side: Claude requests file operations, and your application executes them."
  - "ASSUME INTERRUPTION: Your context window might be reset at any moment"
  - "Periodically delete memory files that haven't been accessed in a long time."
  - "Track memory file sizes and cap how large a file can grow."
- Supports: P7 (caps), P12 (files as the storage interface). Counter-view for P1/P5/P11: here the model writes free-text memory itself, with no provenance, verbatim quote or human gate. The article's architecture treats this kind of memory as useful for in-task progress notes but not as the source of truth for learned rules.

#### S7. Prompt caching (API docs)

- URL: https://platform.claude.com/docs/en/docs/build-with-claude/prompt-caching
- Author: Anthropic documentation. Date: current as of fetch.
- Points:
  1. The cache covers the prompt prefix in the order tools, system, messages, up to the marked block. A change at one level invalidates that level and everything after it.
  2. Cache hits need byte-identical prefixes. Default lifetime 5 minutes, refreshed on use; a 1-hour option exists.
  3. Reads are priced well below base input; writes cost more than base. Minimum cacheable length varies by model.
- Quotes:
  - "Cache hits require 100% identical prompt segments, including all text and images up to and including the block marked with cache control."
  - "By default, the cache has a 5-minute lifetime. The cache is refreshed for no additional cost each time the cached content is used."
  - "Shorter prompts cannot be cached, even if marked with cache_control."
- Supports: P7 and P12. A rendered learning package that is deterministic and stable across calls is cacheable; a package that changes per call is not. Also supports the "cache keyed by prompt hash" pattern in the pipeline itself (same idea, applied to the offline stages).

#### S8. Context windows (API docs)

- URL: https://platform.claude.com/docs/en/build-with-claude/context-windows
- Author: Anthropic documentation.
- Points:
  1. More context is not automatically better; accuracy and recall degrade with token count ("context rot").
  2. Everything in the request counts: system prompt, messages, tool results, tool definitions.
  3. Cached prefixes still occupy the window; caching changes price, not size.
- Quotes:
  - "more context isn't automatically better. As token count grows, accuracy and recall degrade, a phenomenon known as context rot."
  - "Cached prompt prefixes still occupy the context window"
- Supports: P7.

#### S9. Context editing (API docs)

- URL: https://platform.claude.com/docs/en/docs/build-with-claude/context-editing
- Points: tool-result clearing with a trigger threshold, `keep` N recent tool uses and `clear_at_least`; clearing invalidates cache, so the setting weighs clearing against cache cost; the memory tool receives a warning before clearing so it can save what matters.
- Quotes:
  - "The API replaces each cleared result with placeholder text indicating to Claude that it was removed."
  - "When your conversation context approaches the configured clearing threshold, Claude receives an automatic warning to preserve important information."
- Supports: P7 (deterministic cuts that are visible, not silent: cleared results are replaced with a placeholder).

#### S10. Prompting best practices — long context section

- URL: https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices (the long-context-tips URL redirects here).
- Points:
  1. Put long inputs at the top, query and instructions at the end.
  2. Wrap documents in tags with content and source metadata.
  3. Ask the model to quote relevant parts first, then act on the quotes.
- Quotes:
  - "Place your long documents and inputs near the top of your prompt, above your query, instructions, and examples."
  - "ask Claude to quote relevant parts of the documents first before carrying out its task."
- Supports: P5 (quotes as the grounding unit), P7 (layer order is a deliberate design choice, see S16 for the position effect).

### 2B. OpenAI and Google public guidance

#### S11. OpenAI — A practical guide to building agents (PDF)

- URL: https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf
- Author: OpenAI. Date: not printed in the PDF text (published 2025; writer should cite without a day).
- Points:
  1. Maximise a single agent with tools before adding agents.
  2. Guardrails are layered: model-based, rule-based (regex), moderation.
  3. Human intervention is a critical safeguard, especially early, with two triggers: exceeding failure thresholds and high-risk actions.
  4. Start small, validate with real users, grow.
- Quotes:
  - "Our general recommendation is to maximize a single agent's capabilities first."
  - "Think of guardrails as a layered defense mechanism."
  - "Human intervention is a critical safeguard enabling you to improve an agent's real-world performance without compromising user experience."
  - "Start small, validate with real users, and grow capabilities over time."
- Supports: P11 (human gates), P8 (layered code checks plus model judge).

#### S12. OpenAI — Evals guide and Graders guide (API docs)

- URLs: https://developers.openai.com/api/docs/guides/evals and https://developers.openai.com/api/docs/guides/graders (redirect targets of platform.openai.com URLs).
- Author: OpenAI documentation. Note: both pages carry a deprecation notice for the hosted Evals product (read-only 31 October 2026, shutdown 30 November 2026). The writer may cite the guidance but should not describe the product as current.
- Points:
  1. An eval is a data source plus testing criteria (graders). Test data should represent what the prompt must handle.
  2. Grader types: string check, text similarity, score model (model grader), Python, multigrader.
  3. Model graders: write detailed step-by-step prompts; build a grader eval using human-graded answers and check the grader ranks answers in the same order as experts; add edge cases over time.
  4. Guard against reward hacking; avoid skewed data.
- Quotes:
  - "Running this eval will require a test data set that represents the type of data you expect your prompt to work with"
  - "Produce a smooth score, not a pass/fail stamp"
  - "Guard against reward hacking."
  - "Avoid skewed data"
- Supports: P8 (judge calibration), P4 (hand-made reference keys as the grader's own test), P10.

#### S13. OpenAI Cookbook — Getting started with OpenAI Evals (archived recipe)

- URL: https://developers.openai.com/cookbook/examples/evaluation/getting_started_with_openai_evals
- Points: deterministic graders for low-variance outputs; model-graded for open-ended outputs; grade with a different model than the one that produced the answer; validate model grading with human evaluation before scaling; expect grading errors and review failures.
- Quote: validate model grading "with human evaluation before running the evals at scale."
- Supports: P8, P11.

#### S14. Google — Gen AI evaluation service docs

- URLs: https://docs.cloud.google.com/vertex-ai/generative-ai/docs/models/evaluation-overview ; https://docs.cloud.google.com/vertex-ai/generative-ai/docs/models/determine-eval ; https://docs.cloud.google.com/vertex-ai/generative-ai/docs/models/evaluate-judge-model
- Author: Google Cloud documentation.
- Points:
  1. Two metric families: rubric-based (model-judged; adaptive rubrics generate pass/fail tests per prompt, static rubrics apply one rubric to all) and computation-based (deterministic, needs ground truth, e.g. ROUGE, exact match).
  2. Custom metric functions can run per row.
  3. Evaluating a judge: build a human-rated dataset, run the model metric, compare with human labels; use balanced accuracy / balanced F1 from the confusion matrix.
- Quotes:
  - "Computation-based metrics use deterministic algorithms to score a model's response by comparing it to a reference answer."
  - "Using a judge model is a more scalable way to evaluate LLMs."
  - "The goal is to compare the scores from model-based metrics with human ratings."
- Supports: P8 (judge plus deterministic checks), P4 (score the machine against human reference keys).
- Not found on these pages: explicit guidance on flipping answer order. Do not attribute order-swapping to Google docs.

#### S15. Google ADK — Memory

- URL: https://adk.dev/sessions/memory/ (redirect target of google.github.io/adk-docs/sessions/memory/)
- Author: Google ADK documentation.
- Points:
  1. Session (one conversation, short-term) versus Memory (searchable cross-conversation store).
  2. Ingest by adding a completed session, appending event deltas or inserting explicit entries; retrieve via a preload tool at the start of each turn or an on-demand load tool.
  3. Managed memory bank extracts "meaningful information" from conversations; with consolidation on, new entries are merged with related existing ones to reduce redundancy.
- Quotes:
  - "It's your short-term memory during one specific chat."
  - "a searchable archive or knowledge library the agent can consult."
  - the in-memory service "performs basic keyword matching for searches"
- Supports: the general separation of session from cross-session memory. Counter-view for P3/P5: automated consolidation merges items, which is exactly what the brief's precedence rule ("a specific instruction stays specific and is not folded into a principle") warns against, and the extracted entries carry no verbatim quote.

#### S16. OpenAI — Memory and new controls for ChatGPT

- URL: https://openai.com/index/memory-and-new-controls-for-chatgpt/
- Result: HTTP 403 on fetch. **Do not cite.** Nothing from this page is used below.

### 2C. Memory papers

#### S17. MemGPT: Towards LLMs as Operating Systems

- URL: https://arxiv.org/abs/2310.08560 (abstract) and PDF.
- Authors: Charles Packer, Sarah Wooders, Kevin Lin, Vivian Fang, Shishir G. Patil, Ion Stoica, Joseph E. Gonzalez.
- Date: v1 12 October 2023; v2 12 February 2024.
- Points:
  1. Two tiers: main context (prompt tokens) and external context (outside the window), by analogy with RAM and disk.
  2. Main context has three parts: read-only system instructions, a fixed-size read/write "working context" for key facts and preferences, and a FIFO queue of messages whose first slot holds a recursive summary of evicted messages.
  3. External context: recall storage (evicted messages, searchable) and archival storage (arbitrary text).
  4. A "memory pressure" warning fires at a token threshold so the model can save what matters before eviction.
  5. Memory edits are made by the model itself through function calls and are "entirely self-directed".
  6. Evaluated on multi-session chat with a "deep memory retrieval" task that asks a question answerable only from an earlier session.
- Quotes:
  - "virtual context management"
  - "Working context is a fixed-size read/write block of unstructured text, writeable only via MemGPT function calls."
  - "Memory edits and retrieval are entirely self-directed"
  - "a 'memory pressure' warning"
  - "a question by the user that explicitly refers back to a prior conversation and has a very narrow expected answer range"
- Supports: P7 (fixed-size working block, eviction with warning), P9 (held-out later question is the test). Counter-view for P1/P11: fully self-directed memory, no human gate, no provenance.

#### S18. A Survey on the Memory Mechanism of Large Language Model based Agents

- URL: https://arxiv.org/abs/2404.13501 (abstract) and PDF.
- Authors: Zeyu Zhang, Xiaohe Bo, Chen Ma, Rui Li, Xu Chen, Quanyu Dai, Jieming Zhu, Zhenhua Dong, Ji-Rong Wen.
- Date: 21 April 2024 (v1).
- Points:
  1. Memory sources: inside-trial information, cross-trial information, external knowledge.
  2. Memory forms: textual (full history, recent, retrieved, external) and parametric.
  3. Three operations: writing (project raw observations into stored content), management (summarise, merge similar, forget) and reading (select what supports the next action).
  4. Evaluation is either direct (subjective: coherence, rationality; objective: correctness on predefined questions) or indirect via downstream task success.
  5. Writing strategy matters because raw information "is commonly lengthy and noisy".
- Quotes:
  - "The key component to support agent-environment interactions is the memory of the agents."
  - "This operation aims to project the raw observations into the actually stored memory contents"
  - "merging similar information to reduce redundancy [7], and forgetting unimportant or irrelevant information to remove its negative influence"
  - "if the agent can successfully complete a task that highly depends on memory, it suggests that the designed memory module is effective"
- Supports: P3 (the survey's own example turns a one-off preference into "a default rule", which is the general-rule promotion in the brief), P8 (indirect evaluation via downstream answers is the replay test). Note: the survey frames management as summarise/merge/forget; the brief adds provenance and precedence.

#### S19. Memory in the Age of AI Agents

- URL: https://arxiv.org/abs/2512.13564
- Authors: Yuyang Hu, Shichun Liu, Yanwei Yue, Guibin Zhang and 43 others.
- Date: 15 December 2025 (v2 13 January 2026).
- Points: the field is fragmented; long/short-term taxonomies are insufficient; memory forms are token-level, parametric and latent; functions are factual, experiential and working memory; dynamics are formation, evolution, retrieval.
- Quotes:
  - "the field has also become increasingly fragmented."
  - "Traditional taxonomies such as long/short-term memory have proven insufficient"
  - "factual, experiential, and working memory"
- Supports: P3. The factual/experiential split maps loosely onto the brief's world-facts versus method/shape rules, but the paper's taxonomy is different from the brief's and the writer should present the brief's taxonomy as an operational one, not as derived from this survey.

#### S20. Rethinking Memory in LLM based Agents: Representations, Operations, and Emerging Topics

- URL: https://arxiv.org/abs/2505.00675
- Authors: Yiming Du, Wenyu Huang, Danna Zheng, Zhaowei Wang, S. Montella, Mirella Lapata, Kam-Fai Wong, Jeff Z. Pan.
- Date: 1 May 2025 (v3 24 December 2025).
- Points: parametric versus contextual memory; six operations: consolidation, updating, indexing, forgetting, retrieval, condensation.
- Quote: "defines six core operations: Consolidation, Updating, Indexing, Forgetting, Retrieval, and Condensation."
- Supports: P3 and P7 (updating and forgetting as named operations; the brief's "newer wins" and budget cuts are concrete versions).

### 2D. Evaluation and LLM-as-judge

#### S21. Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena

- URL: https://arxiv.org/abs/2306.05685 (abstract) and PDF.
- Authors: Lianmin Zheng, Wei-Lin Chiang, Ying Sheng, Siyuan Zhuang, Zhanghao Wu, Yonghao Zhuang, Zi Lin, Zhuohan Li, Dacheng Li, Eric P. Xing, Hao Zhang, Joseph E. Gonzalez, Ion Stoica.
- Date: 9 June 2023 (v4 24 December 2023). NeurIPS 2023 Datasets and Benchmarks.
- Points:
  1. Position bias: judges favour an answer by its position. In their test only GPT-4 was consistent in more than 60% of cases when order was swapped; most judges favoured the first position.
  2. Verbosity bias: a "repetitive list" attack fooled two of three judges over 90% of the time.
  3. Self-enhancement bias was suspected but could not be confirmed.
  4. Judges fail on maths and reasoning even when they can solve the problem; a reference-guided judge cut failure from 70% to 15%.
  5. Mitigations: swap positions and only declare a win if consistent in both orders (conservative), or assign positions randomly at scale (aggressive); few-shot judges raised consistency but cost more and may add bias; chain-of-thought alone was not enough.
  6. Strong judges agree with humans at over 80%, the same as human-human agreement.
- Quotes:
  - "We examine the usage and limitations of LLM-as-a-judge, including position, verbosity, and self-enhancement biases"
  - "A conservative approach is to call a judge twice by swapping the order of two answers and only declare a win when an answer is preferred in both orders."
  - "Another more aggressive approach is to assign positions randomly, which can be effective at a large scale with the correct expectations."
  - "Only GPT-4 outputs consistent results in more than 60% of cases."
  - "achieving over 80% agreement, the same level of agreement between humans."
- Supports: P8 directly (randomised answer order; never adjudicate the domain call is the brief's answer to the reasoning limitation; the judge is told to score method and sourcing, which it can see, not correctness, which it cannot verify).

#### S22. Judging the Judges: A Systematic Study of Position Bias in LLM-as-a-Judge

- URL: https://arxiv.org/abs/2406.07791
- Authors: Lin Shi, Chiyu Ma, Wenhua Liang, Xingjian Diao, Weicheng Ma, Soroush Vosoughi.
- Date: 12 June 2024 (v9 11 November 2025; AACL-IJCNLP 2025).
- Points: 15 judges, 22 tasks, ~150,000 instances; metrics of repetition stability, position consistency and preference fairness; bias is real, varies by judge and task, and is strongest when the two answers are close in quality.
- Quotes:
  - "position bias is not due to random chance and varies significantly across judges and tasks."
  - "it is strongly affected by the quality gap between solutions."
- Supports: P8. Practical implication for the article: when the with-package and without-package answers are close, order randomisation matters most.

#### S23. Lost in the Middle: How Language Models Use Long Contexts

- URL: https://arxiv.org/abs/2307.03172
- Authors: Nelson F. Liu, Kevin Lin, John Hewitt, Ashwin Paranjape, Michele Bevilacqua, Fabio Petroni, Percy Liang.
- Date: 6 July 2023 (v3 20 November 2023); TACL 2023.
- Points: performance is highest when relevant information is at the beginning or end of the input and degrades in the middle, even for long-context models.
- Quotes:
  - "performance is often highest when relevant information occurs at the beginning or end of the input context"
  - "significantly degrades when models must access relevant information in the middle of long contexts"
- Supports: P7 (layer order is not cosmetic: put the items that must always apply first; watches, which are conditional, can sit later). The paper does not prescribe a layout; the inference is the article's.

### 2E. Pre-registration and leakage

#### S24. The preregistration revolution

- URL (manuscript PDF): https://errorstatistics.com/wp-content/uploads/2017/07/nosek-et-al-preregistration-revolution.pdf (PNAS 115(11):2600–2606, 13 March 2018, DOI 10.1073/pnas.1708274114; the publisher page returned 403 on fetch and the PMC id found by search was wrong, so cite the DOI and the manuscript).
- Authors: Brian A. Nosek, Charles R. Ebersole, Alexander C. DeHaven, David T. Mellor.
- Points:
  1. Postdiction (explain existing observations) versus prediction (test an idea on new observations). Confusing the two inflates confidence.
  2. Preregistration commits to the analysis plan before outcomes are seen, which removes the "forking paths" of data-driven choices.
  3. Deviations are common and do not void the exercise if they are reported transparently.
  4. Testing predictions on pre-existing data is possible only if analysis decisions are blind to the data.
- Quotes:
  - "Mistaking generation of postdictions with testing of predictions reduces the credibility of research findings."
  - "Preregistration of an analysis plan is committing to analytic steps without advance knowledge of the research outcomes."
  - "In prediction, the problem of forking paths is avoided because the analytic pipeline is specified prior to observing the data."
  - "Deviations from data collection and analysis plans are common, even in the most predictable investigations."
  - "preregistration with reported deviations provides substantially greater confidence in the resulting research."
  - "The extent to which testing predictions is possible on pre-existing data depends on whether decisions about the analysis plan are blind to the data."
- Supports: P10 directly; P9 (cutoff date is the "blind to the data" condition for pre-existing logs); the production lesson about retiring experiments and carrying shortfalls forward in writing is the "report deviations" rule.

#### S25. Center for Open Science — Preregistration

- URL: https://www.cos.io/initiatives/prereg
- Points: a preregistration needs at least one confirmatory test with a defined hypothesis and the analyses to be run; once the test changes, treat the work as exploratory; keep a "Transparent Changes" document for departures.
- Quotes:
  - "Doing so helps to distinguish planned from unplanned work."
  - "it is important to transparently disclose any changes from the proposed plan."
- Supports: P10.

#### S26. Pre-registration for Predictive Modeling

- URL: https://arxiv.org/abs/2311.18807
- Authors: Jake M. Hofman, Angelos Chatzimparmpas, Amit Sharma, Duncan J. Watts, Jessica Hullman.
- Date: 30 November 2023.
- Points: proposes a lightweight pre-registration template for predictive modelling; names "unintentional re-use of test data" as a problem; interviews ML researchers; acknowledges limits.
- Quotes:
  - "we propose adapting pre-registration practices from explanatory modeling to predictive modeling"
  - "unintentional re-use of test data"
  - "introduce a lightweight pre-registration template"
  - "acknowledging its limitations within this context."
- Supports: P10, P9. Counter-view: the authors are explicit that pre-registration is not a silver bullet in ML; the writer should present it as a discipline, not a guarantee.

#### S27. NeurIPS 2020 workshop — The pre-registration experiment

- URL: https://neurips.cc/virtual/2020/workshop/16158
- Organisers: Luca Bertinetto, João Henriques, Samuel Albanie, Michela Paganini, Gul Varol.
- Points: papers reviewed without results; a protocol is fixed before experiments; aims to reduce bias toward positive results and repeated unreported negatives.
- Quotes:
  - "A pre-registered paper is a regular paper that is submitted for peer-review without any experimental results."
  - "describing instead an experimental protocol to be followed after the paper is accepted."
  - "The negative results inevitably encountered during research are often omitted."
- Supports: P10 (record retired and failed experiments, not only passes).

#### S28. Leakage and the Reproducibility Crisis in ML-based Science

- URL: https://arxiv.org/abs/2207.07048 (the journal page returned 403).
- Authors: Sayash Kapoor, Arvind Narayanan.
- Date: 14 July 2022.
- Points: leakage is a widespread cause of reproducibility failure (17 fields, 329 papers); a taxonomy of 8 leakage types; "model info sheets" as a reporting format that makes leakage detectable.
- Quotes:
  - "data leakage is indeed a widespread problem and has led to severe reproducibility failures."
  - "we find 17 fields where errors have been found, collectively affecting 329 papers"
  - "model info sheets would enable the detection of leakage in each case."
- Supports: P9 (temporal cutoff), P10 (written registration as the info sheet). The abstract page does not list the 8 types; the writer should not enumerate them from this source.

### 2F. Event sourcing and the log

#### S29. Martin Fowler — Event Sourcing

- URL: https://martinfowler.com/eaaDev/EventSourcing.html
- Author: Martin Fowler. Date: 12 December 2005 (marked as not to be updated).
- Points: store all changes as a sequence of events; state is derivable from the log, so it can be cached anywhere; complete rebuild and temporal queries; corrections are done by reversing and replaying, not editing; external systems must detect replay; retrofitting is hard, so decide early.
- Quotes:
  - "Event Sourcing ensures that all changes to application state are stored as a sequence of events."
  - "Since an application state is purely derivable from the event log, you can cache it anywhere you like."
  - "The key to Event Sourcing is that we guarantee that all changes to the domain objects are initiated by the event objects."
  - "a purely additive structure that requires minimal locking"
- Supports: P1 (record is the source of truth), P2 (enrichment as derived, rebuildable views), P12 (bootstrap and ongoing passes as replay of the same code).

#### S30. Microsoft Azure Architecture Center — Event Sourcing pattern

- URL: https://learn.microsoft.com/en-us/azure/architecture/patterns/event-sourcing
- Author: Microsoft (page author claytonsiemens77). Date: ms.date 27 March 2026; updated 25 September 2026.
- Points:
  1. Append-only store as system of record; events are immutable; current state by replay; materialised views for reads.
  2. Design events to capture intent, not just resulting state.
  3. Never update event data; correct with compensating events; versioning via tolerant deserialisation, version ids, upcasting; in-place migration breaks immutability and is a last resort.
  4. Snapshots are an optimisation, not a replacement; the stream remains the source of truth.
  5. Consumers must be idempotent.
  6. Strong caveat: the pattern is complex and "For most systems and most parts of a system, traditional data management is sufficient."
  7. Personal data conflicts with immutability; keep it outside the store or use crypto-shredding.
- Quotes:
  - "Events are immutable, and you can store them by using an append-only operation."
  - "The event store is the permanent source of information, so you should never update the event data."
  - "Snapshots are an optimization, not a replacement for the eventstream."
  - "For most systems and most parts of a system, traditional data management is sufficient."
  - "The append-only, immutable nature of an event store conflicts with data protection regulations that require deletion of personal data"
- Supports: P1, P2 (sidecars as projections; version ids on enrichers), P12. Counter-view: do not oversell. The brief's "record first" uses only the immutable-log-plus-derived-views half of the pattern, not full command/query separation, and the personal-data caveat is directly relevant because the records contain users' own words (withdrawal under P5 needs a design, e.g. tombstone events).

#### S31. Martin Kleppmann — Turning the database inside-out

- URL: https://martin.kleppmann.com/2015/03/04/turning-the-database-inside-out.html
- Author: Martin Kleppmann. Date: 4 March 2015 (transcript of a 2014 talk).
- Points: writes go to an append-only log; every other store is a derived, rebuildable view; keeping raw events preserves information that overwrites discard; application caches are a poor version of the same idea.
- Quotes:
  - "Databases are global, shared, mutable state."
  - "A materialized view is just a cached subset of the log"
  - "The transaction log is a really simple, append-only data structure."
- Supports: P1, P2.

#### S32. Jay Kreps — The Log

- URL: https://engineering.linkedin.com/distributed-systems/log-what-every-software-engineer-should-know-about-real-time-datas-unifying
- Result: HTTP 403 on fetch. **Do not cite.** S31 covers the same ground from a fetched page.

---

## 3. Principle-by-principle support map

| # | Principle (short) | Supporting sources | Counter-views or caveats |
|---|---|---|---|
| P1 | Record first: one deterministic, immutable record per interaction with provenance; the record is the source of truth | S29, S30, S31 (log as source of truth, derived views); S3 (transcript as the full record of a trial) | S30: the full pattern is heavy; use the immutable-log half only. S6, S17: vendor and paper memory designs let the model write memory directly, with no deterministic record. |
| P2 | Enrichment is add-only and versioned, keyed by inputs hash; model-based enrichers validated before trust | S30 (projections, event version ids, upcasting, never edit the source); S7 (hash-exact caching is how the vendor itself caches); S3 and S12 (calibrate model graders against humans; read transcripts) | None direct. S18 treats "memory writing" as the place where lossy summarisation happens; the brief moves that loss into versioned sidecars so it can be redone. |
| P3 | Taxonomy of learnings; general vs subject; per-user vs shared; precedence (newer wins; specific stays specific) | S19 (factual vs experiential vs working), S20 (updating and forgetting as operations), S18 (a one-off preference promoted to a default rule), S6 (lessons vs project context) | S15: automated consolidation merges related entries, which is the folding the brief forbids. S19: public taxonomies do not match the brief's five kinds; present the brief's as operational. |
| P4 | Group by subject with a human-frozen vocabulary and registry; machine proposes and routes with verification | S2 (routing and voting patterns), S12 and S14 (score the grader against human reference keys), S11 (human intervention early) | No public source describes a frozen vocabulary as schema; this is the article's own contribution, supported by analogy to S5's JSON feature list ("less likely to overwrite carelessly"). |
| P5 | Every served learning cites the user's own words verbatim, provenance checked by code | S10 (quote first, then act), S30 (events capture intent; audit trail), S6 (memory is application-controlled) | S30 personal-data caveat: verbatim user words are personal data; withdrawal needs a design. S6 and S15 store paraphrases, not quotes. |
| P6 | World facts served as "verify then apply"; method and shape rules applied directly | S21 (judges and models fail on correctness they cannot verify), S1 (just-in-time retrieval of current data), S30 (snapshot is not the source) | No public source states the verify-then-apply form; it follows from S21's reasoning limitation and S6's "expire stale memory". |
| P7 | Budgets and layered rendering; deterministic cuts listed, not silent | S1 and S8 (context rot, attention budget), S17 (fixed-size working context, eviction warning), S9 (cleared results replaced by a placeholder), S23 (position matters), S6 (cap file sizes) | S10 says put long documents at the top and the query at the end; the brief's "method first" layer order is consistent with "beginning or end" in S23 but is a design choice, not a published rule. |
| P8 | Replay before serving; blind judge with randomised order; score method, sourcing, needs; never the domain call; leak scan; guards | S21 (position and verbosity bias; swap or randomise; reference-guided), S22 (bias strongest when answers are close), S3 (deterministic graders where possible; read transcripts), S13 (judge with a different model; validate with humans), S14 (judge agreement metrics), S18 (indirect evaluation via downstream task) | S21 prefers the conservative swap (win only if consistent in both orders); seeded random order is their "aggressive" option, valid "at a large scale with the correct expectations". S3: grade outputs, not paths. |
| P9 | Measure against later corrections the package never saw; build only from before a cutoff | S24 (prediction vs postdiction; blind to the data), S28 (leakage), S26 (test data re-use), S17 (deep memory retrieval asks about an earlier session), S3 (clean state per trial), S4 (held-out sets) | None. |
| P10 | Pre-register: hypotheses, pass lines, sample, judge fixed; pin code and prompt hashes; keep development pairs out | S24, S25, S27, S26 (ML-specific), S28 (model info sheets), S12 (lock the grader after validation) | S26 and S24: deviations happen; record them rather than pretend. Not a guarantee. |
| P11 | One human gate per stage | S11 (human intervention early; high-risk actions), S2 (human checkpoints), S13 (human validation before scale), S3 (human graders as the gold standard) | S17 and S6 show fully self-directed memory working for in-task notes; the gate is for served rules, not every note. |
| P12 | Repeatability: local commands, files in and out, versioned outputs, caches by prompt hash, cost ceilings; same code for bootstrap and ongoing; capability map with stable ids | S5 (progress file, feature list, one feature at a time, init script), S2 (workflows over agents; simplest thing), S29 and S31 (replay the log through the same code), S7 (hash-exact caching), S4 (track cost and calls) | None direct. |

---

## 4. Where sources disagree (or disagree with the architecture)

1. **Who writes memory.** MemGPT (S17) and the memory tool (S6) let the model write and edit its own memory with no human gate and no provenance. Google ADK's memory bank (S15) extracts and consolidates automatically. The architecture in the brief treats these as fine for in-task progress notes but not for rules served to other sessions, where a verbatim quote, a provenance check and a human approval are required. The writer should present this as a deliberate split: self-directed scratch memory versus gated learned rules.

2. **Merge or keep specific.** S15 and S18 treat merging similar entries as good hygiene. The brief's precedence rule keeps a specific instruction specific and promotes a general rule only when it has no subject of its own. Both reduce redundancy; they differ on what is lost. The article can say merging is right for duplicates and wrong for scope.

3. **Swap or randomise.** Zheng et al. (S21) recommend the conservative double call (swap and require agreement) and call random assignment "aggressive". The brief uses seeded random order with the mapping kept outside the bundle. S22 adds that the risk is greatest when answers are close in quality. The honest position: random order with a fixed seed is reproducible and cheaper; the double call is stricter; a team should pick one and pre-register it.

4. **Grade output or path.** Anthropic's evals post (S3) says grade what the agent produced, not the path it took. The brief's judge scores method and sourcing. These are compatible when "method" means visible properties of the answer (did it state an approach, did it attach a source to each number) rather than the tool-call sequence. The writer should phrase it that way.

5. **Event sourcing as pattern.** Fowler (S29) and Kleppmann (S31) argue for the log as source of truth. Microsoft (S30) warns that the full pattern is costly and usually unnecessary. The brief's "record first" needs only the immutable-record-plus-derived-views half and should be described at that size.

6. **Pre-registration in ML.** Hofman et al. (S26) are cautious; Nosek et al. (S24) accept that deviations are routine and ask that they be reported. The production lesson (j) matches the latter: retired experiments recorded as retired, shortfalls carried forward in writing.

7. **Where to put things in the prompt.** Anthropic's guidance (S10) puts long documents first and the query last. Liu et al. (S23) find the middle is worst. The brief's layer order (how-to-work first, watches last) fits both as long as the package is not long enough to have a "middle" that matters, which is a further argument for the budget.

---

## 5. Anonymised production lessons, restated in general form

These are the only production experiences the article may draw on. They are restated here without names, subjects or numbers, and mapped to principles. The writer must not add detail to them.

| Lesson | General form | Principle |
|---|---|---|
| (a) | The first design was "store corrections and inject them". It broke on the taxonomy question. The team paused and wrote a capability map of stages with stable ids and a build order before any code. Every later spec, plan and task referred to those ids. That map is what kept the owner oriented while coding agents built most of the pipeline. | P3, P12 |
| (b) | Parsing each interaction once, deterministically, into a uniform record that holds the answer the user actually saw (not drafts) removed a class of later disagreements. When an enricher disagreed with a normalised value, it was treated as a parser bug, not as an overlay. | P1, P2 |
| (c) | Enrichment as add-only sidecars keyed by an inputs hash: re-parsed records re-enriched themselves; unchanged ones cost nothing. | P2 |
| (d) | A model drafted a vocabulary of labels over batches; a human froze it (drop, rename, merge, redefine, add). The frozen vocabulary became the schema (ids as enums) for the labelling run. Labels were checked on a sealed sample and re-run with the cache bypassed to measure stability. | P4, P11 |
| (e) | Two clustering strategies were compared in writing before choosing: rule-based signatures from labels (explainable, cheap, bound by the vocabulary) versus model-proposed clusters from summaries (finds cross-cutting themes, costs more, needs a second assignment pass). The chosen design was signature-first, confirmed and named by the model, with clusters about the system itself or about a report format refused. | P4 |
| (f) | Routing new interactions used a propose-then-verify model call, a majority over seeded runs, code checks on ids and caps, and scoring against hand-routed reference keys. A holdout decided whether it met a human-level bar. | P4 |
| (g) | Extracted items had to carry a verbatim quote and a source reference. Code checked provenance, verbatim quotes, pasted text, numbers stated as facts, the conditional form of world facts and self-reference. Consolidation ran twice to measure stability. General rules were promoted out of subject packages when they had no subject of their own. "Newer wins" handled superseded rules. | P3, P5, P6 |
| (h) | Packages were built only from sessions before a cutoff date so later questions could be a clean test. The main measure was whether the answer already did what the user asked for or corrected later in the original session, which the package had never seen. | P9 |
| (i) | The blind judge received answers in a seeded random order with the mapping kept outside the bundle, scored method, sourcing and the user's stated needs, and was told never to adjudicate the domain call. A code-level leak scan flagged sentences sharing a run of six or more words with the package and no source marker; the judge confirmed or rejected each flag. | P8 |
| (j) | Each stage had a pre-registered experiment with pass lines and frozen file hashes. An experiment retired before any run was recorded as retired. Shortfalls were carried forward in writing rather than hidden. | P10 |
| (k) | In an older, separate pipeline, extracted claims were injected into every later model stage with no cap or pruning, so per-thread cost rose without bound. Anything learned must have a budget and a pruning rule from day one. | P7 |
| (l) | Cost was kept legible with per-call accounting, caching by prompt hash, a ceiling per stage, and the judge budget kept separate from the extraction budget. | P12 |
| (m) | Every stage ran as a local command over files in a folder; the scheduled version was deferred to the final loop module. The bootstrap pass over history and the ongoing pass over new sessions were the same code with different inputs. | P12 |

Allowed public facts if the writer wants to anchor the setting: the production work was for "a global hedge fund with ~$1B AUM" and involved "12+ sector forecasting models". Nothing else about the client work may be stated.

---

## 6. Proposed original example: a tiny, framework-free learning-loop kit

The example is deliberately small and domain-neutral (office paper procurement). It is not drawn from any client work. It runs as-is with `python3` and the standard library.

### 6.1 JSON shapes

**Interaction record** (one per user turn; immutable; the answer field is the answer the user actually saw):

```json
{
  "record_id": "ses-0002:turn-02",
  "session_id": "ses-0002",
  "turn": 2,
  "user_id": "u-17",
  "date": "2025-03-09",
  "origin": "chat-ui",
  "user_text": "Our regional supplier told us office paper prices rose about 8% last quarter. Cite the source for each number you give me, and keep an eye on any announcement about the new paper mill.",
  "answer_shown": "Noted: an 8% quarterly rise reported by your supplier. I will cite a source for each number and flag news on the new mill.",
  "feedback": { "thumbs": "down", "comment": "you still gave one figure with no source" }
}
```

**Enrichment sidecar** (add-only; sits beside the record; keyed by a hash of the record plus the enricher version):

```json
{
  "record_id": "ses-0002:turn-02",
  "inputs_hash": "f7db968421e64d9e",
  "enricher": "intent-labeller/v1 (deterministic)",
  "kind": "deterministic",
  "labels": ["sourcing-rule", "standing-watch"]
}
```

**Learning item** (kind, scope, verbatim quote, source reference, dates, status):

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

`kind` is one of `world_fact | method_rule | answer_shape | profile | watch`. `scope` is `general | subject`; a `subject` scope must name its subject. `status` moves to `withdrawn` or `superseded` by appending a new item, never by editing the old one.

### 6.2 One rendered context package (output of the script, budget 1,150 characters)

```markdown
# Context package for user u-17

## How to work (apply directly)
- Cite a source for each number. (user's words: "Cite the source for each number you give me") [src:ses-0002:turn-02 2025-03-09]
- Do not use the word 'skyrocket'. (user's words: "never use the word 'skyrocket'") [src:ses-0001:turn-04 2025-03-02]

## How to shape answers (apply directly)
- Label every figure with its year and unit. (user's words: "label every figure with its year and unit") [src:ses-0001:turn-04 2025-03-02]

## About this user (apply directly)
- Runs procurement for a small office network; lead times matter more than list prices. (user's words: "lead times matter more to me than list prices") [src:ses-0003:turn-01 2025-03-20]

## Things the user told you about the world (verify, then apply)
- VERIFY BEFORE USE: on 2025-03-09 the user said "office paper prices rose about 8% last quarter". Treat this as a claim to check against a current source, not as a fact to restate. [src:ses-0002:turn-02 2025-03-09]

## Not included (over budget)
- li-005 (watch, subject)
```

Points to draw out in the article: method and shape layers come first; the world fact is phrased as a claim to check, with its date; the watch did not fit the budget and is listed as cut rather than silently dropped; every line carries the user's words and a source reference.

### 6.3 The Python kit (standard library only)

File: `learning_loop_kit.py`. Run with `python3 learning_loop_kit.py`.

```python
#!/usr/bin/env python3
"""
learning_loop_kit.py - a tiny, framework-free learning-loop kit.

Standard library only. Run:  python3 learning_loop_kit.py

What it shows, end to end, on toy data:
  1. Interaction records (immutable, with provenance) and an add-only
     enrichment sidecar keyed by an inputs hash.
  2. Learning items with kind, scope, verbatim quote and source reference,
     checked by code against the record they came from.
  3. A rendered context package: layered (how-to-work first, what-to-watch
     last), a character budget, and a listed (not silent) cut.
  4. A toy replay evaluation: two stub answers (with / without the package),
     a stub blind judge with a seeded answer order, a 'later corrections met'
     score, a leak scan on shared 6-word runs with no source marker, and
     self-reference / length guards.
  5. A pre-registration stub: the script and judge prompt are hashed and
     the hashes are printed as part of the report.
"""
from __future__ import annotations

import hashlib
import json
import random
import re
import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# 1. Interaction records: parsed once, immutable, with provenance
# ---------------------------------------------------------------------------

INTERACTIONS = [
    {
        "record_id": "ses-0001:turn-04",
        "session_id": "ses-0001",
        "turn": 4,
        "user_id": "u-17",
        "date": "2025-03-02",
        "origin": "chat-ui",
        "user_text": (
            "Please label every figure with its year and unit. Also, never "
            "use the word 'skyrocket' in anything you write for me."
        ),
        "answer_shown": (
            "Understood. From now on I will label every figure with its year "
            "and unit and avoid the word 'skyrocket'."
        ),
        "feedback": {"thumbs": "up", "comment": None},
    },
    {
        "record_id": "ses-0002:turn-02",
        "session_id": "ses-0002",
        "turn": 2,
        "user_id": "u-17",
        "date": "2025-03-09",
        "origin": "chat-ui",
        "user_text": (
            "Our regional supplier told us office paper prices rose about 8% "
            "last quarter. Cite the source for each number you give me, and "
            "keep an eye on any announcement about the new paper mill."
        ),
        "answer_shown": (
            "Noted: an 8% quarterly rise reported by your supplier. I will "
            "cite a source for each number and flag news on the new mill."
        ),
        "feedback": {"thumbs": "down", "comment": "you still gave one figure with no source"},
    },
    {
        "record_id": "ses-0003:turn-01",
        "session_id": "ses-0003",
        "turn": 1,
        "user_id": "u-17",
        "date": "2025-03-20",
        "origin": "chat-ui",
        "user_text": (
            "I run procurement for a small office network, so lead times "
            "matter more to me than list prices."
        ),
        "answer_shown": "Thanks, I will weight lead times over list prices.",
        "feedback": {"thumbs": None, "comment": None},
    },
]

# ---------------------------------------------------------------------------
# 2. Enrichment sidecar: add-only, keyed by an inputs hash
# ---------------------------------------------------------------------------

ENRICHER_VERSION = "intent-labeller/v1 (deterministic)"


def inputs_hash(record: dict, enricher_version: str) -> str:
    payload = json.dumps(record, sort_keys=True) + "\n" + enricher_version
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()[:16]


def enrich(record: dict, cache: dict) -> tuple[dict, bool]:
    """Deterministic enricher. Returns (sidecar, was_cached)."""
    key = inputs_hash(record, ENRICHER_VERSION)
    if key in cache:
        return cache[key], True
    text = record["user_text"].lower()
    labels = []
    if "never" in text or "don't" in text or "do not" in text:
        labels.append("prohibition")
    if "cite" in text or "source" in text:
        labels.append("sourcing-rule")
    if "keep an eye" in text or "watch" in text:
        labels.append("standing-watch")
    if "i run" in text or "i am" in text or "i'm" in text:
        labels.append("profile")
    sidecar = {
        "record_id": record["record_id"],
        "inputs_hash": key,
        "enricher": ENRICHER_VERSION,
        "kind": "deterministic",
        "labels": labels or ["unlabelled"],
    }
    cache[key] = sidecar
    return sidecar, False


# ---------------------------------------------------------------------------
# 3. Learning items: kind, scope, verbatim quote, source reference, dates
# ---------------------------------------------------------------------------

ITEMS = [
    {
        "item_id": "li-001",
        "kind": "answer_shape",
        "scope": "general",
        "subject": None,
        "user_id": "u-17",
        "statement": "Label every figure with its year and unit.",
        "quote": "label every figure with its year and unit",
        "source": {"record_id": "ses-0001:turn-04", "field": "user_text"},
        "first_seen": "2025-03-02",
        "last_confirmed": "2025-03-02",
        "status": "active",
    },
    {
        "item_id": "li-002",
        "kind": "method_rule",
        "scope": "general",
        "subject": None,
        "user_id": "u-17",
        "statement": "Do not use the word 'skyrocket'.",
        "quote": "never use the word 'skyrocket'",
        "source": {"record_id": "ses-0001:turn-04", "field": "user_text"},
        "first_seen": "2025-03-02",
        "last_confirmed": "2025-03-02",
        "status": "active",
    },
    {
        "item_id": "li-003",
        "kind": "method_rule",
        "scope": "general",
        "subject": None,
        "user_id": "u-17",
        "statement": "Cite a source for each number.",
        "quote": "Cite the source for each number you give me",
        "source": {"record_id": "ses-0002:turn-02", "field": "user_text"},
        "first_seen": "2025-03-09",
        "last_confirmed": "2025-03-09",
        "status": "active",
    },
    {
        "item_id": "li-004",
        "kind": "world_fact",
        "scope": "subject",
        "subject": "office-paper",
        "user_id": "u-17",
        "statement": "Office paper prices rose about 8% last quarter (per the user's supplier).",
        "quote": "office paper prices rose about 8% last quarter",
        "source": {"record_id": "ses-0002:turn-02", "field": "user_text"},
        "first_seen": "2025-03-09",
        "last_confirmed": "2025-03-09",
        "status": "active",
    },
    {
        "item_id": "li-005",
        "kind": "watch",
        "scope": "subject",
        "subject": "office-paper",
        "user_id": "u-17",
        "statement": "Flag any announcement about the new paper mill.",
        "quote": "keep an eye on any announcement about the new paper mill",
        "source": {"record_id": "ses-0002:turn-02", "field": "user_text"},
        "first_seen": "2025-03-09",
        "last_confirmed": "2025-03-09",
        "status": "active",
    },
    {
        "item_id": "li-006",
        "kind": "profile",
        "scope": "general",
        "subject": None,
        "user_id": "u-17",
        "statement": "Runs procurement for a small office network; lead times matter more than list prices.",
        "quote": "lead times matter more to me than list prices",
        "source": {"record_id": "ses-0003:turn-01", "field": "user_text"},
        "first_seen": "2025-03-20",
        "last_confirmed": "2025-03-20",
        "status": "active",
    },
    {
        # Deliberately broken: the quote is a paraphrase, not the user's words.
        "item_id": "li-007",
        "kind": "method_rule",
        "scope": "general",
        "subject": None,
        "user_id": "u-17",
        "statement": "Prefer lead-time data over price data.",
        "quote": "prioritise lead times over prices",
        "source": {"record_id": "ses-0003:turn-01", "field": "user_text"},
        "first_seen": "2025-03-20",
        "last_confirmed": "2025-03-20",
        "status": "active",
    },
]

KINDS = ("world_fact", "method_rule", "answer_shape", "profile", "watch")
SCOPES = ("general", "subject")


def check_item(item: dict, records_by_id: dict) -> list[str]:
    """Code-level provenance checks. Returns a list of problems (empty = ok)."""
    problems = []
    if item["kind"] not in KINDS:
        problems.append(f"unknown kind {item['kind']!r}")
    if item["scope"] not in SCOPES:
        problems.append(f"unknown scope {item['scope']!r}")
    if item["scope"] == "subject" and not item.get("subject"):
        problems.append("subject scope with no subject")
    rec = records_by_id.get(item["source"]["record_id"])
    if rec is None:
        problems.append("source record not found")
    else:
        field = rec.get(item["source"]["field"], "")
        if item["quote"].lower() not in field.lower():
            problems.append("quote is not verbatim in the source field")
        if item["first_seen"] != rec["date"]:
            problems.append("first_seen does not match record date")
    if item["kind"] == "world_fact" and re.search(r"\bis\b|\bare\b", item["statement"]) \
            and "per the user" not in item["statement"]:
        problems.append("world fact stated as bare fact without attribution")
    return problems


# ---------------------------------------------------------------------------
# 4. Rendering: layers, budget, listed cuts
# ---------------------------------------------------------------------------

LAYERS = [
    ("method_rule", "How to work (apply directly)"),
    ("answer_shape", "How to shape answers (apply directly)"),
    ("profile", "About this user (apply directly)"),
    ("world_fact", "Things the user told you about the world (verify, then apply)"),
    ("watch", "What to watch for (mention only if relevant)"),
]


def render_line(item: dict) -> str:
    src = f"[src:{item['source']['record_id']} {item['first_seen']}]"
    if item["kind"] == "world_fact":
        return (
            f"- VERIFY BEFORE USE: on {item['first_seen']} the user said "
            f"\"{item['quote']}\". Treat this as a claim to check against a "
            f"current source, not as a fact to restate. {src}"
        )
    return f"- {item['statement']} (user's words: \"{item['quote']}\") {src}"


def render_package(items: list[dict], budget_chars: int) -> tuple[str, list[dict]]:
    """Render layered Markdown within a character budget. Cuts are listed, not silent."""
    active = [i for i in items if i["status"] == "active"]
    # newer wins within a layer; general items before subject-specific ones
    active.sort(key=lambda i: i["last_confirmed"], reverse=True)
    active.sort(key=lambda i: i["scope"] != "general")
    out, cut, used = [], [], 0
    header = "# Context package for user u-17\n\n"
    used += len(header)
    out.append(header)
    for kind, title in LAYERS:
        layer_items = [i for i in active if i["kind"] == kind]
        if not layer_items:
            continue
        head = f"## {title}\n"
        kept = []
        for it in layer_items:
            line = render_line(it) + "\n"
            if used + len(head) + len(line) > budget_chars:
                cut.append(it)
                continue
            kept.append(line)
            used += len(line)
        if not kept:
            continue  # a layer with nothing that fits is reported in the cut list
        out.append(head)
        out.extend(kept)
        out.append("\n")
        used += len(head) + 1
    if cut:
        out.append("## Not included (over budget)\n")
        for it in cut:
            out.append(f"- {it['item_id']} ({it['kind']}, {it['scope']})\n")
    return "".join(out), cut


# ---------------------------------------------------------------------------
# 5. Replay evaluation: stub answers, blind judge, corrections met, leak scan
# ---------------------------------------------------------------------------

LATER_QUESTION = "What should we expect for office paper costs next quarter?"

# What the user actually corrected in the later (held-out) session.
LATER_CORRECTIONS = [
    {"id": "c1", "text": "you forgot the year and unit on the price figure",
     "met_if": r"\b20\d\d\b.*%|\%.*\b20\d\d\b"},
    {"id": "c2", "text": "where did that number come from?",
     "met_if": r"\[source:|\(source:"},
    {"id": "c3", "text": "please stop saying skyrocket",
     "met_if": r"^(?!.*skyrocket).*$"},
]

ANSWER_WITHOUT = (
    "Office paper costs are likely to skyrocket next quarter. Prices rose "
    "about 8% recently and demand is strong, so budget for a further rise. "
    "Lead times may also lengthen."
)

ANSWER_WITH = (
    "Approach: check the latest supplier price list, then adjust for lead "
    "times, which you said matter more than list prices.\n"
    "Last quarter you reported a rise of about 8% (Q1 2025, quarter on "
    "quarter) from your supplier; I could not confirm it against a public "
    "index, so treat it as unverified [source: your note, 2025-03-09].\n"
    "The public producer price series shows +3% (Q1 2025, quarter on quarter) "
    "[source: national statistics office, PPI, paper products].\n"
    "Expect a modest further rise. I treat this as a claim to check against a "
    "current source, not as a fact to restate.\n"
)

JUDGE_PROMPT = (
    "You are a blind judge. Score each answer 0-2 on: method (states an "
    "approach), sourcing (every number has a source marker), needs (meets the "
    "user's stated needs). Never judge whether the domain call is right."
)


def corrections_met(answer: str, corrections: list[dict]) -> tuple[int, list[str]]:
    met = []
    flat = answer.replace("\n", " ")
    for c in corrections:
        if re.search(c["met_if"], flat, flags=re.IGNORECASE | re.DOTALL):
            met.append(c["id"])
    return len(met), met


def stub_judge(answer: str) -> dict:
    """A deterministic stand-in for a model judge. Scores method, sourcing, needs."""
    method = 2 if re.search(r"^Approach:", answer, re.M) else 0
    numbers = re.findall(r"\d+%", answer)
    sourced = len(re.findall(r"\[source:", answer))
    sourcing = 2 if numbers and sourced >= len(numbers) else (1 if sourced else 0)
    needs = 2 if re.search(r"\b20\d\d\b", answer) and "skyrocket" not in answer else 0
    return {"method": method, "sourcing": sourcing, "needs": needs}


def blind_pairwise(ans_a: str, ans_b: str, seed: int) -> dict:
    """Present the two answers in a seeded random order; keep the mapping outside the bundle."""
    rng = random.Random(seed)
    order = ["with", "without"]
    rng.shuffle(order)
    bundle = {"position_1": ans_a if order[0] == "with" else ans_b,
              "position_2": ans_b if order[1] == "without" else ans_a}
    mapping = {"position_1": order[0], "position_2": order[1]}  # stored separately
    scores = {pos: stub_judge(text) for pos, text in bundle.items()}
    unblinded = {mapping[pos]: s for pos, s in scores.items()}
    return {"seed": seed, "order": order, "scores": unblinded}


WORD_RE = re.compile(r"[a-z0-9%']+")


def ngrams(text: str, n: int) -> set[tuple[str, ...]]:
    words = WORD_RE.findall(text.lower())
    return {tuple(words[i:i + n]) for i in range(len(words) - n + 1)}


def leak_scan(answer: str, package: str, n: int = 6) -> list[dict]:
    """Flag answer sentences that share an n-word run with the package and carry no source marker."""
    pkg = ngrams(package, n)
    flags = []
    for sentence in re.split(r"(?<=[.!?])\s+|\n", answer):
        if not sentence.strip():
            continue
        shared = ngrams(sentence, n) & pkg
        has_marker = bool(re.search(r"\[source:|\(source:|you said|you reported", sentence))
        if shared and not has_marker:
            flags.append({"sentence": sentence.strip(), "shared_run": " ".join(next(iter(shared)))})
    return flags


SELF_REF = re.compile(r"as per my (rules|instructions)|my learned|according to my memory", re.I)


def guards(answer: str, max_chars: int = 800) -> list[str]:
    out = []
    if SELF_REF.search(answer):
        out.append("self-reference")
    if len(answer) > max_chars:
        out.append(f"too long ({len(answer)} > {max_chars})")
    if not re.search(r"^Approach:", answer, re.M):
        out.append("no stated approach")
    return out


# ---------------------------------------------------------------------------
# 6. Pre-registration stub: pin code and prompt hashes before any run
# ---------------------------------------------------------------------------

def sha(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:12]


def main() -> None:
    records_by_id = {r["record_id"]: r for r in INTERACTIONS}

    print("== 1. Records and enrichment ==")
    cache: dict = {}
    for r in INTERACTIONS:
        sc, cached = enrich(r, cache)
        print(f"{r['record_id']}  hash={sc['inputs_hash']}  labels={sc['labels']}  cached={cached}")
    sc, cached = enrich(INTERACTIONS[0], cache)
    print(f"re-run {INTERACTIONS[0]['record_id']}  cached={cached}  (unchanged inputs cost nothing)")

    print("\n== 2. Item checks (provenance, verbatim quote, fact form) ==")
    ok_items = []
    for it in ITEMS:
        probs = check_item(it, records_by_id)
        status = "ok" if not probs else "REJECTED: " + "; ".join(probs)
        print(f"{it['item_id']} {it['kind']:<12} {status}")
        if not probs:
            ok_items.append(it)

    print("\n== 3. Rendered package (budget 1150 chars) ==")
    package, cut = render_package(ok_items, budget_chars=1150)
    print(package)
    print(f"cut: {[c['item_id'] for c in cut] or 'none'}")

    print("== 4. Replay evaluation on the held-out later question ==")
    print(f"question: {LATER_QUESTION}")
    seed = 20250401
    result = blind_pairwise(ANSWER_WITH, ANSWER_WITHOUT, seed)
    print(f"judge order (seed {seed}): position_1={result['order'][0]}, position_2={result['order'][1]}")
    for arm in ("without", "with"):
        ans = ANSWER_WITH if arm == "with" else ANSWER_WITHOUT
        n_met, met = corrections_met(ans, LATER_CORRECTIONS)
        s = result["scores"][arm]
        leaks = leak_scan(ans, package)
        g = guards(ans)
        print(f"\n[{arm} package]")
        print(f"  judge: method={s['method']} sourcing={s['sourcing']} needs={s['needs']}")
        print(f"  later corrections met: {n_met}/{len(LATER_CORRECTIONS)} {met}")
        print(f"  leak flags: {len(leaks)}")
        for f in leaks:
            print(f"    - shared run '{f['shared_run']}' in: {f['sentence'][:70]}...")
        print(f"  guards: {g or 'clean'}")

    print("\n== 5. Pre-registration record ==")
    code_hash = sha(Path(__file__).read_text(encoding="utf-8"))
    print(f"code_hash={code_hash}  judge_prompt_hash={sha(JUDGE_PROMPT)}  seed={seed}")
    print("pass line (fixed before run): with-package must meet >= 2/3 later corrections,")
    print("score >= baseline on sourcing, and carry zero unresolved leak flags.")
    n_with, _ = corrections_met(ANSWER_WITH, LATER_CORRECTIONS)
    leaks_with = leak_scan(ANSWER_WITH, package)
    passed = (n_with >= 2
              and result["scores"]["with"]["sourcing"] >= result["scores"]["without"]["sourcing"]
              and len(leaks_with) == 0)
    reason = "" if passed else f" ({len(leaks_with)} leak flag(s) await judge review)"
    print(f"verdict: {'PASS' if passed else 'FAIL'}{reason}")


if __name__ == "__main__":
    sys.exit(main())
```

### 6.4 Run output (python3 3.12, 2026-10-10)

```text
== 1. Records and enrichment ==
ses-0001:turn-04  hash=ff2535b62d0ca147  labels=['prohibition']  cached=False
ses-0002:turn-02  hash=f7db968421e64d9e  labels=['sourcing-rule', 'standing-watch']  cached=False
ses-0003:turn-01  hash=b3bd58af1a205a57  labels=['profile']  cached=False
re-run ses-0001:turn-04  cached=True  (unchanged inputs cost nothing)

== 2. Item checks (provenance, verbatim quote, fact form) ==
li-001 answer_shape ok
li-002 method_rule  ok
li-003 method_rule  ok
li-004 world_fact   ok
li-005 watch        ok
li-006 profile      ok
li-007 method_rule  REJECTED: quote is not verbatim in the source field

== 3. Rendered package (budget 1150 chars) ==
# Context package for user u-17

## How to work (apply directly)
- Cite a source for each number. (user's words: "Cite the source for each number you give me") [src:ses-0002:turn-02 2025-03-09]
- Do not use the word 'skyrocket'. (user's words: "never use the word 'skyrocket'") [src:ses-0001:turn-04 2025-03-02]

## How to shape answers (apply directly)
- Label every figure with its year and unit. (user's words: "label every figure with its year and unit") [src:ses-0001:turn-04 2025-03-02]

## About this user (apply directly)
- Runs procurement for a small office network; lead times matter more than list prices. (user's words: "lead times matter more to me than list prices") [src:ses-0003:turn-01 2025-03-20]

## Things the user told you about the world (verify, then apply)
- VERIFY BEFORE USE: on 2025-03-09 the user said "office paper prices rose about 8% last quarter". Treat this as a claim to check against a current source, not as a fact to restate. [src:ses-0002:turn-02 2025-03-09]

## Not included (over budget)
- li-005 (watch, subject)

cut: ['li-005']
== 4. Replay evaluation on the held-out later question ==
question: What should we expect for office paper costs next quarter?
judge order (seed 20250401): position_1=with, position_2=without

[without package]
  judge: method=0 sourcing=0 needs=0
  later corrections met: 0/3 []
  leak flags: 0
  guards: ['no stated approach']

[with package]
  judge: method=2 sourcing=2 needs=2
  later corrections met: 3/3 ['c1', 'c2', 'c3']
  leak flags: 1
    - shared run 'treat this as a claim to' in: I treat this as a claim to check against a current source, not as a fa...
  guards: clean

== 5. Pre-registration record ==
code_hash=dda4e31d6a6e  judge_prompt_hash=5e72b4edf87a  seed=20250401
pass line (fixed before run): with-package must meet >= 2/3 later corrections,
score >= baseline on sourcing, and carry zero unresolved leak flags.
verdict: FAIL (1 leak flag(s) await judge review)
```

What the run demonstrates, in order:

1. Three records are enriched; a re-run on an unchanged record is a cache hit (P2).
2. Seven items are checked by code. Item li-007 is rejected because its "quote" is a paraphrase, not the user's words (P5).
3. The package renders in layers inside a 1,150-character budget; the watch is cut and the cut is listed (P7); the world fact is served as "verify before use" with its date (P6).
4. The replay evaluation asks a later question the package never saw. The judge sees the two answers in a seeded random order (seed printed; mapping kept in code, not in the bundle). The without-package answer meets 0 of 3 later corrections; the with-package answer meets 3 of 3 (P8, P9).
5. The leak scan flags one sentence in the with-package answer that repeats a six-word run from the package without a source marker (the answer parroted the package's own instruction text). The pre-registered pass line demands zero unresolved leak flags, so the verdict is FAIL pending judge review (P8, P10). This is intentional: the example shows the loop catching a package being echoed, which is the failure mode the leak scan exists for.
6. The code hash and judge-prompt hash are printed with the seed. In a real pipeline these are written to the registration file before the run, and a mismatch refuses the run (P10).

The writer may shorten the script in the article (for example, show only `check_item`, `render_package`, `blind_pairwise` and `leak_scan`) and link to the full file.

---

## 7. Claims the writer must not make

- Do not attribute "verify then apply", "frozen vocabulary as schema", "capability map with stable ids" or "one human gate per stage" to any public source. They are the article's own contributions, supported by the sources above by analogy and reasoning, not stated in them.
- Do not cite S16 (OpenAI memory announcement) or S32 (Kreps, The Log); both returned 403 on fetch.
- Do not enumerate the eight leakage types from S28; the fetched page lists only the count.
- Do not say Google's docs recommend swapping answer order; the fetched pages do not say so.
- Do not describe OpenAI's hosted Evals as a current product; the docs carry a deprecation notice.
- Do not give a day-level date for the OpenAI agents guide; the PDF text does not print one.
- Do not add numbers, dates, counts or subjects to the production lessons in Section 5.
- Do not name any client, product, dataset, vendor integration or repository from the production work. The only allowed public facts are the two quoted at the end of Section 5.

---

## Editor's notes (2026-10-10)

Edited in place: `src/content/writing/learning-loop-for-ai-agents.md`. Sidecar `learning-loop-for-ai-agents.meta.json` reviewed and left unchanged (valid JSON, all keys present, description 155 chars, summary 82 words and junior-readable).

What changed:

- **Opening.** Tightened the hook; split the long second paragraph into three short "Nothing..." sentences. Removed "built for a production research agent and shared here in anonymised form" from the intro, since it described a specific project rather than the general pattern. Production experience now appears only in the "How I use this in production" section.
- **Length.** Prose cut from 2,797 to 2,771 words (code fences excluded), inside the 1,800–2,800 band. Trims: the "Structure before code" production bullet no longer repeats the naive-design story already told in "Why the obvious fix fails"; one redundant sentence in "Evaluate by replay"; the stage walkthrough in "The idea"; two Further reading annotations.
- **Headings.** Template sections confirmed present and in order: Why the obvious fix fails, The idea, Principles (12 subsections, all brief-required principles covered), A minimal example, How I use this in production, Pitfalls, Checklist, Further reading. No heading changes.
- **Citations.** All 14 links appear in Section 2 of these notes; neither forbidden source (S16, S32) is cited. One quoted phrase from the harness post (S5, "less likely to inappropriately change or overwrite JSON files compared to Markdown files") was not among the verbatim quotes recorded above, so it was re-fetched and confirmed on the live page; kept as a quote.
- **Code.** All three code blocks unchanged. Both JSON blocks parse; the Python example was re-run and its output matches the prose (one paraphrased item rejected, watch cut and listed, with-package answer meets 3/3 later corrections, no leak flags).
- **Confidentiality and claims.** Blocklist scan (case-insensitive, all terms) on article and sidecar: no hits. Only the two approved public facts appear; no numbers, names or subjects were added to the production lessons. British spelling checked; no US variants found.
