export const meta = {
  name: "agentic-coding-series-launch",
  description:
    "Research, write, edit and evaluate the 3 launch articles of the agentic coding series",
  phases: [
    { title: "Research", detail: "official Claude Code docs per article" },
    { title: "Write", detail: "draft article + metadata sidecar" },
    { title: "Edit", detail: "voice, clarity, structure, length" },
    {
      title: "Evaluate",
      detail: "accuracy, originality, confidentiality, claims, runnable code",
    },
    { title: "Revise", detail: "one revision loop for REVISE verdicts" },
  ],
};

const REPO = args.repo;
const COMMON = `
You are part of an editorial team producing an ORIGINAL article series for Jitin Gupta's personal site (repo: ${REPO}).
Read the agreed intent first: ${REPO}/docs/intent/writing-series.md (series map, audience, format, boundaries).
Series: "${args.seriesName}" (10 parts). Audience: working developers and tech leads who already use AI coding assistants; juniors should be able to follow the "In one minute" summary.
Voice: Jitin, first person, practical, calm, no hype, British English spelling (behaviour, organisation). Short paragraphs, plain words, define jargon once.
HARD RULES:
- Original content only. A Udemy course outline was used ONLY as a topic map. Never mirror its sequence, its project (a workout tracker app), or its example tools (Clerk auth, Neon database MCP, Ollama/qwen walkthrough). Course outline titles for reference: ${JSON.stringify(args.courseOutline)}.
- Production experience comes from client work and MUST be anonymised: never name the client, the hedge fund, people, internal product or code names, data vendors, or repos. Allowed public facts are only those in ${REPO}/../profile_builder/drafts/00-facts.md (e.g. "a global hedge fund with ~$1B AUM", "12+ sector forecasting models", "15+ person team"). Do NOT introduce any other numbers about the client work (no counts of tools, agents, criteria, sessions, percentages).
- A private blocklist of confidential terms is at ${REPO}/.confidential-terms. No term in it may appear in anything you write. Never copy any of its terms into your output, reports or notes.
- Facts about Claude Code (settings keys, hook events, exit codes, JSON shapes, CLI flags, file locations, MCP config) must match CURRENT official Anthropic documentation (docs.claude.com / docs.anthropic.com Claude Code pages). When unsure, say less rather than guess.
- Article bodies are plain Markdown (GFM tables and fenced code allowed). NO JSX, NO import/export lines, NO HTML components. Headings start at "##" (the page renders the H1 title).
`;

const ARTICLE_TEMPLATE = `
Body structure (Markdown, 1,500–2,500 words of prose excluding code):
- An opening of 2–3 short paragraphs: the problem, from a practitioner's point of view (no heading).
- "## The idea" — the concept and the mental model.
- "## A working example" — a small, ORIGINAL, copy-pasteable example the reader can try today (real file contents with fenced code blocks and language tags). It must actually work with current Claude Code.
- "## How I use this in production" — anonymised patterns from the production notes provided, written as lessons, not boasts.
- "## Pitfalls" — 4–6 concrete mistakes and how to avoid them.
- "## Checklist" — a short "- [ ]" task list the reader can apply the same day.
- "## Further reading" — 3–6 links to official Anthropic docs pages you verified exist.
`;

const SIDECAR = `
Also write a metadata sidecar JSON file at ${REPO}/docs/editorial/{slug}.meta.json with exactly these keys:
{ "slug", "title", "description" (≤ 160 chars, for SEO), "tags" (3–5 short tags), "summary" (the "In one minute" plain-language paragraph, 60–90 words, no jargon), "keyTerms": [{"term","definition"}] (3–5), "keyPoints": [string] (4–6 one-line takeaways), "videoOutline": [string] (6–10 beats for a future 6–10 min YouTube lecture; the first beat is a hook usable as a 45-second Short) }
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
1. accuracy — verify every Claude Code fact against current official docs (fetch the pages; settings keys, hook event names, exit-code semantics, JSON shapes, MCP config format and CLI commands).
2. originality — nothing mirrors the course outline's sequence, project or example tools; examples are original.
3. confidentiality — read ${REPO}/.confidential-terms and confirm NONE of its terms appear (case-insensitive) in the article or sidecar; also no client/person/vendor/product names. Never write any blocklisted term in your report; refer to "a blocklisted term" with its line location only.
4. claims — no numbers or specifics about the client work beyond the allowed facts file.
5. code — extract every fenced code block to a temp dir under /tmp and syntax-check it: JSON with python3 -m json.tool, Python with python3 -m py_compile, bash with bash -n, YAML by parsing, TypeScript/JS by node --check when plain JS. Report failures precisely.
6. clarity — structure follows the template, 1,500–2,500 words of prose, plain language, juniors can follow the summary, sidecar complete and valid JSON with all keys.
Verdict PASS only if no blocker/major issues and every score ≥ 4. Write your full report to ${REPO}/docs/editorial/${a.slug}.evaluation${round > 1 ? "-r" + round : ""}.md (Markdown: verdict, scores table, issues, code-check log). Return the structured result.`;
}

const results = await pipeline(
  args.articles,
  (a) =>
    agent(
      `${COMMON}
ROLE: Researcher for part ${a.part}: "${a.topic}".
Goal: a fact base the writer can rely on. Use WebFetch/WebSearch on official Anthropic documentation for Claude Code (docs.claude.com / docs.anthropic.com) covering: ${a.docsFocus}.
Capture exact, current details (config file names and locations, JSON/YAML shapes, event names, exit-code behaviour, CLI commands, limits) with the source URL for each. Note anything recently changed or deprecated.
Then propose ONE small original working example for the article (${a.exampleIdea}) and verify it against the docs.
Anonymised production notes the writer may use (do not add to them, do not look for more in other repos): ${a.productionNotes}
Write everything to ${REPO}/docs/editorial/${a.slug}.research.md (create the folder if needed). Return a 5-line summary.`,
      { label: `research:${a.slug}`, phase: "Research" },
    ),

  (_r, a) =>
    agent(
      `${COMMON}
ROLE: Writer for part ${a.part}: "${a.topic}". Slug: ${a.slug}.
Inputs: research notes at ${REPO}/docs/editorial/${a.slug}.research.md (rely on them for facts; they include the production notes).
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
Improve in place: sharpen the opening hook, cut filler and hype, keep paragraphs short, make headings scannable, ensure the template sections are present and in order, keep prose within 1,500–2,500 words, make the "summary" readable by a junior developer, check every link is an official Anthropic docs URL, and keep code blocks intact unless clearly wrong (then fix against ${REPO}/docs/editorial/${a.slug}.research.md). Keep Jitin's first-person voice and British spelling. Do not add claims or numbers.
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
Fix every issue in the evaluator's report at ${REPO}/docs/editorial/${a.slug}.evaluation.md, blockers and majors first, minors where cheap. Re-verify any changed Claude Code fact against official docs. Keep structure, voice and length rules. Return a list of fixes made.`,
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
    return { slug: a.slug, part: a.part, review };
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
