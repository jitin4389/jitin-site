export const meta = {
  name: "architecture-article",
  description:
    "Research, write, edit and evaluate standalone AI-architecture articles (no series, no product specifics)",
  phases: [
    { title: "Research", detail: "public sources on the topic" },
    { title: "Write", detail: "draft article + metadata sidecar" },
    { title: "Edit", detail: "voice, clarity, structure, length" },
    {
      title: "Evaluate",
      detail: "accuracy, originality, confidentiality, claims, code, clarity",
    },
    { title: "Revise", detail: "one revision loop for REVISE verdicts" },
  ],
};

// Standalone-article variant of editorial-team.workflow.js. Same team and gates; the article is an
// architecture piece grounded in public sources and generalised lessons, not a Claude Code tutorial.
// Args: { repo, articles: [{ slug, topic, problemStatement, principles, sourcesFocus, exampleIdea, angle, productionNotes }] }

const REPO = args.repo;
const COMMON = `
You are part of an editorial team producing an ORIGINAL standalone article for Jitin Gupta's personal site (repo: ${REPO}).
Audience: engineers, architects and tech leads who run LLM agents or assistants for real users. Juniors should be able to follow the "In one minute" summary.
Voice: Jitin, first person, practical, calm, no hype, British English spelling (behaviour, organisation). Short paragraphs, plain words, define jargon once. Opinions are stated as opinions; principles are explained with reasons.
HARD RULES:
- Original content only. Do not reproduce the structure or wording of any single source; synthesise and cite.
- The article is GENERAL. It describes an architecture and its principles, not a specific project. Never describe a specific client, product, dataset, research subject, user, vendor or repository. Production experience is from client work and MUST stay anonymised: the only allowed public facts are those in ${REPO}/../profile_builder/drafts/00-facts.md (e.g. "a global hedge fund with ~$1B AUM", "12+ sector forecasting models"). Do NOT introduce any other numbers about client work (no counts of sessions, turns, clusters, packages, users, costs, percentages, dates of the work).
- A private blocklist of confidential terms is at ${REPO}/.confidential-terms. No term in it may appear in anything you write. Never copy any of its terms into your output, reports or notes.
- Every factual claim about a public source (a paper, a vendor document, a blog post) must come from a page you fetched, with its URL. When unsure, say less rather than guess. Do not invent citations.
- Article bodies are plain Markdown (GFM tables and fenced code allowed). NO JSX, NO import/export lines, NO HTML components. Headings start at "##" (the page renders the H1 title). Diagrams are fenced text blocks (no Mermaid).
`;

const ARTICLE_TEMPLATE = `
Body structure (Markdown, 1,800–2,800 words of prose excluding code):
- An opening of 2–3 short paragraphs: the problem as a practitioner meets it (no heading). Start from the complaint "it doesn't learn".
- "## Why the obvious fix fails" — why "store the corrections and inject them next time" breaks down (kinds of learning get mixed, stale facts, leaks, growth without bound, nothing measured).
- "## The idea" — the learning loop as a mental model: record → enrich → group → extract → serve → evaluate → approve, with a fenced text diagram.
- "## Principles" — the architecture principles, one short subsection each (a bold rule, the reason, what it looks like in practice). Cover at least: a deterministic, immutable record with provenance; add-only versioned enrichment; a taxonomy of learnings (world facts vs method rules vs answer shape vs profile vs standing watches; general vs subject-specific; per-user vs shared); humans freeze vocabularies, machines do the volume; every served item cites the user's own words; world facts are "verify then apply", never statements; budgets and layered rendering; evaluate by replay before serving; measure against what the user later corrected; pre-register experiments and pin the code; one human gate per stage; repeatable batch runs (files in, files out, versions, caches, cost ceilings).
- "## A minimal example" — a small, ORIGINAL, copy-pasteable example: the record and learning-item shapes (JSON), one rendered context package (Markdown), and a short Python replay-evaluation skeleton with a stub judge. Everything must parse or run as given; no external services.
- "## How I use this in production" — anonymised lessons from the production notes provided, written as lessons, not boasts. No numbers, names or subjects.
- "## Pitfalls" — 5–7 concrete mistakes and how to avoid them.
- "## Checklist" — a short "- [ ]" task list the reader can apply this week.
- "## Further reading" — 4–7 links to public sources you verified exist (vendor engineering posts and docs, papers), each with one line on why it is worth reading.
`;

const SIDECAR = `
Also write a metadata sidecar JSON file at ${REPO}/docs/editorial/{slug}.meta.json with exactly these keys:
{ "slug", "title", "description" (≤ 160 chars, for SEO), "tags" (3–5 short tags), "summary" (the "In one minute" plain-language paragraph, 60–90 words, no jargon), "keyTerms": [{"term","definition"}] (4–6), "keyPoints": [string] (5–7 one-line takeaways), "videoOutline": [string] (6–10 beats for a future 6–10 min YouTube lecture; the first beat is a hook usable as a 45-second Short) }
`;

const EVAL_SCHEMA = {
  type: "object",
  properties: {
    verdict: { type: "string", enum: ["PASS", "REVISE"] },
    scores: {
      type: "object",
      properties: {
        accuracy: { type: "integer", minimum: 1, maximum: 5 },
        originality: { type: "integer", minimum: 1, maximum: 5 },
        confidentiality: { type: "integer", minimum: 1, maximum: 5 },
        claims: { type: "integer", minimum: 1, maximum: 5 },
        code: { type: "integer", minimum: 1, maximum: 5 },
        clarity: { type: "integer", minimum: 1, maximum: 5 },
      },
      required: [
        "accuracy",
        "originality",
        "confidentiality",
        "claims",
        "code",
        "clarity",
      ],
    },
    issues: {
      type: "array",
      items: {
        type: "object",
        properties: {
          severity: { type: "string", enum: ["blocker", "major", "minor"] },
          location: { type: "string" },
          problem: { type: "string" },
          fix: { type: "string" },
        },
        required: ["severity", "location", "problem", "fix"],
      },
    },
    wordCount: { type: "integer" },
    summary: { type: "string" },
  },
  required: ["verdict", "scores", "issues", "wordCount", "summary"],
};

function evaluatePrompt(a, round) {
  return `${COMMON}
ROLE: Evaluator (round ${round}). Be strict and independent; you did not write this.
Article file: ${REPO}/src/content/writing/${a.slug}.md and sidecar ${REPO}/docs/editorial/${a.slug}.meta.json. Research notes: ${REPO}/docs/editorial/${a.slug}.research.md.
Check and score 1–5 each:
1. accuracy — fetch every linked source and confirm the article describes it correctly; architecture opinions must be presented as opinions with reasons, not as facts about the industry.
2. originality — the piece synthesises; no section mirrors one source's structure or wording.
3. confidentiality — read ${REPO}/.confidential-terms and confirm NONE of its terms appear (case-insensitive) in the article or sidecar; also no client, product, person, vendor, dataset, research-subject or repository names, and nothing that describes a specific project rather than a general pattern. Never write any blocklisted term in your report; refer to "a blocklisted term" with its line location only.
4. claims — no numbers or specifics about client work beyond the allowed facts file.
5. code — extract every fenced code block to a temp dir and check it: JSON with python3 -m json.tool, Python with python3 -m py_compile and then actually run it (it must run without network or extra packages), bash with bash -n, YAML by parsing. Report failures precisely.
6. clarity — structure follows the template, 1,800–2,800 words of prose, plain language, juniors can follow the summary, sidecar complete and valid JSON with all keys.
Verdict PASS only if no blocker/major issues and every score ≥ 4. Write your full report to ${REPO}/docs/editorial/${a.slug}.evaluation${round > 1 ? "-r" + round : ""}.md (Markdown: verdict, scores table, issues, code-check log). Return the structured result.`;
}

const results = await pipeline(
  args.articles,
  (a) =>
    agent(
      `${COMMON}
ROLE: Researcher for "${a.topic}".
Problem statement to ground the piece in: ${a.problemStatement}
Principles the article must cover (generalised; find public support or counter-views for each): ${a.principles}
Goal: a fact base the writer can rely on. Use WebFetch/WebSearch on PUBLIC sources: ${a.sourcesFocus}. For each source record URL, author, date, the 3–6 points that matter for this article, and exact short quotes where wording matters. Prefer primary sources (vendor engineering blogs and docs, papers) over summaries. Note where sources disagree.
Then propose ONE small original example for the article (${a.exampleIdea}) and write it out in full: the JSON shapes, one rendered package, and the Python skeleton. Run the Python yourself and paste the output.
Anonymised production lessons the writer may use (do not add to them, do not look for more in other repos; keep them general): ${a.productionNotes}
Write everything to ${REPO}/docs/editorial/${a.slug}.research.md (create the folder if needed). Return a 5-line summary.`,
      { label: `research:${a.slug}`, phase: "Research" },
    ),

  (_r, a) =>
    agent(
      `${COMMON}
ROLE: Writer for "${a.topic}". Slug: ${a.slug}.
Inputs: research notes at ${REPO}/docs/editorial/${a.slug}.research.md (rely on them for sources and the example; they include the production lessons).
Angle: ${a.angle}
${ARTICLE_TEMPLATE}
Write the article body to ${REPO}/src/content/writing/${a.slug}.md.
${SIDECAR.replace("{slug}", a.slug)}
Return the title and word count.`,
      { label: `write:${a.slug}`, phase: "Write" },
    ),

  (_w, a) =>
    agent(
      `${COMMON}
ROLE: Editor for ${REPO}/src/content/writing/${a.slug}.md and its sidecar ${REPO}/docs/editorial/${a.slug}.meta.json.
Improve in place: sharpen the opening hook, cut filler and hype, keep paragraphs short, make headings scannable, ensure the template sections are present and in order, keep prose within 1,800–2,800 words, make the "summary" readable by a junior developer, check every link is one the research notes verified, and keep code blocks intact unless clearly wrong (then fix against the research notes). Keep Jitin's first-person voice and British spelling. Do not add claims, names or numbers. Remove anything that reads as a description of a specific project rather than a general pattern.
Append a short "Editor's notes" section to ${REPO}/docs/editorial/${a.slug}.research.md listing what you changed. Return a 3-line summary.`,
      { label: `edit:${a.slug}`, phase: "Edit" },
    ),

  async (_e, a) => {
    let review = await agent(evaluatePrompt(a, 1), {
      label: `evaluate:${a.slug}`,
      phase: "Evaluate",
      schema: EVAL_SCHEMA,
    });
    if (review && review.verdict === "REVISE") {
      await agent(
        `${COMMON}
ROLE: Reviser for ${REPO}/src/content/writing/${a.slug}.md and ${REPO}/docs/editorial/${a.slug}.meta.json.
Fix every issue in the evaluator's report at ${REPO}/docs/editorial/${a.slug}.evaluation.md, blockers and majors first, minors where cheap. Re-verify any changed source claim by fetching the page. Keep structure, voice and length rules. Return a list of fixes made.`,
        { label: `revise:${a.slug}`, phase: "Revise" },
      );
      const second = await agent(evaluatePrompt(a, 2), {
        label: `re-evaluate:${a.slug}`,
        phase: "Revise",
        schema: EVAL_SCHEMA,
      });
      review = second
        ? { ...second, revised: true, firstRound: review }
        : review;
    }
    return { slug: a.slug, review };
  },
);

const ok = results.filter(Boolean);
log(
  `Finished ${ok.length}/${args.articles.length}: ` +
    ok
      .map((r) => `${r.slug}=${r.review ? r.review.verdict : "no-review"}`)
      .join(", "),
);
return ok;
