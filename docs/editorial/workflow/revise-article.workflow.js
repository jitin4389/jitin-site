export const meta = {
  name: "revise-article",
  description:
    "Revise a published article against a review brief (and optional slide deck), then edit and evaluate it",
  phases: [
    { title: "Revise", detail: "apply the brief; place the slides" },
    { title: "Edit", detail: "voice, clarity, structure" },
    { title: "Evaluate", detail: "accuracy, originality, confidentiality, claims, code, clarity" },
    { title: "Fix", detail: "one fix loop for REVISE verdicts" },
  ],
};

// Args: { repo, slug, brief (markdown text), slidesManifest? (path to JSON: [{n, src, title, sub, caption, alt}]), wordRange: [min, max] }

const REPO = args.repo;
const SLUG = args.slug;
const ARTICLE = `${REPO}/src/content/writing/${SLUG}.md`;
const SIDECAR = `${REPO}/docs/editorial/${SLUG}.meta.json`;
const RESEARCH = `${REPO}/docs/editorial/${SLUG}.research.md`;
const [MIN_WORDS, MAX_WORDS] = args.wordRange ?? [2500, 3800];

const COMMON = `
You are part of an editorial team revising an ORIGINAL standalone article on Jitin Gupta's personal site (repo: ${REPO}).
Article: ${ARTICLE}. Sidecar metadata: ${SIDECAR}. Research notes with verified sources: ${RESEARCH}.
Audience: engineers, architects and tech leads who run LLM agents for real users; juniors should follow the "In one minute" summary.
Voice: Jitin, first person, practical, calm, no hype, British English spelling. Short paragraphs, plain words, define jargon once. Opinions stated as opinions, with reasons.
HARD RULES:
- The article is GENERAL: an architecture and its principles, never a specific client, product, dataset, research subject, user, vendor or repository. The only allowed facts about client work are in ${REPO}/../profile_builder/drafts/00-facts.md; add NO other numbers about it.
- A private blocklist is at ${REPO}/.confidential-terms. No term in it may appear in anything you write; never copy a term from it into any output.
- Every factual claim about a public source must come from a page in the research notes or one you fetched; cite with its URL. Do not invent citations.
- Plain Markdown only (GFM tables, fenced code, images as ![alt](src "caption")). No JSX, no HTML, no import/export. Headings start at "##". Diagrams are either the provided slide images or fenced text.
- Code must run as given with python3 and the standard library; JSON must parse.
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
      required: ["accuracy", "originality", "confidentiality", "claims", "code", "clarity"],
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

const SLIDES = args.slidesManifest
  ? `
SLIDES: a deck of slide images exists for this article; the manifest is at ${args.slidesManifest} (JSON: n, src, title, sub, caption, alt). Read it.
Place EVERY slide exactly once, as a Markdown image on its own line: ![<alt from manifest>](<src> "<caption from manifest>"). Put each slide at the start of the section it illustrates, before the prose of that section (slide 1 goes before the first paragraph). The prose must not repeat what the slide says; it explains, argues and adds what the slide cannot. A reader who looks only at the slides and captions must still get the argument; a reader who skips the slides must lose nothing.`
  : "";

function evaluatePrompt(round) {
  return `${COMMON}
ROLE: Evaluator (round ${round}). Strict and independent; you did not write this.
Brief that the revision had to satisfy:
${args.brief}
Check and score 1–5 each:
1. accuracy — fetch every linked source and confirm the article describes it correctly; architecture opinions are presented as opinions with reasons; no technical over-statement (check especially: prompt caching claims, pointwise vs pairwise judging, what the example code actually does versus what the prose claims).
2. originality — synthesis, not a mirror of one source.
3. confidentiality — read ${REPO}/.confidential-terms and confirm NONE of its terms appear (case-insensitive) in the article or sidecar; no client, product, person, vendor, dataset, research-subject or repository names; nothing describes a specific project rather than a general pattern. Never write a blocklisted term in your report; refer to "a blocklisted term" with its line.
4. claims — no numbers or specifics about client work beyond the allowed facts file.
5. code — extract every fenced code block to a temp dir; JSON with python3 -m json.tool; Python with py_compile and then RUN it (standard library, no network); confirm the printed output matches the prose's description of it.
6. clarity — the brief's structural items are done; every slide from the manifest appears exactly once with its caption and the prose around it does not duplicate it; ${MIN_WORDS}–${MAX_WORDS} words of prose; the "summary", "keyPoints" and "videoOutline" in the sidecar reflect the revised article; sidecar valid JSON with all keys.
Verdict PASS only if no blocker/major issues and every score ≥ 4. Write the report to ${REPO}/docs/editorial/${SLUG}.evaluation-rev${round}.md and return the structured result.`;
}

phase("Revise");
await agent(
  `${COMMON}
ROLE: Reviser. Rewrite ${ARTICLE} in place to satisfy this brief, keeping everything that already works:
${args.brief}
${SLIDES}
Length: ${MIN_WORDS}–${MAX_WORDS} words of prose excluding code. Keep the sidecar ${SIDECAR} in step: update title/description/tags/summary/keyTerms/keyPoints/videoOutline where the brief says so, keep "date".
Run every code block you touch with python3 and paste the output into a short "Revision notes" section appended to ${RESEARCH} (what changed, why, what you verified). Return a 6-line summary.`,
  { label: `revise:${SLUG}`, phase: "Revise" },
);

phase("Edit");
await agent(
  `${COMMON}
ROLE: Editor for ${ARTICLE} and ${SIDECAR}. Improve in place: a concrete opening, scannable headings, short paragraphs, no filler or hype, slide captions and prose not duplicating each other, consistent terminology, British spelling, links only to sources the research notes verified. Keep the first-person voice and all code intact unless clearly wrong. Do not add claims, names or numbers. Prose must stay within ${MIN_WORDS}–${MAX_WORDS} words.
Append "Editor's notes (revision)" to ${RESEARCH}. Return a 3-line summary.`,
  { label: `edit:${SLUG}`, phase: "Edit" },
);

phase("Evaluate");
let review = await agent(evaluatePrompt(1), { label: `evaluate:${SLUG}`, phase: "Evaluate", schema: EVAL_SCHEMA });
if (review && review.verdict === "REVISE") {
  phase("Fix");
  await agent(
    `${COMMON}
ROLE: Fixer for ${ARTICLE} and ${SIDECAR}. Fix every issue in ${REPO}/docs/editorial/${SLUG}.evaluation-rev1.md, blockers and majors first, minors where cheap. Re-verify any changed source claim by fetching the page; re-run any changed code. Keep structure, voice and length rules. Return a list of fixes.`,
    { label: `fix:${SLUG}`, phase: "Fix" },
  );
  const second = await agent(evaluatePrompt(2), { label: `re-evaluate:${SLUG}`, phase: "Fix", schema: EVAL_SCHEMA });
  review = second ? { ...second, revised: true, firstRound: review } : review;
}
log(`${SLUG}: ${review ? review.verdict : "no-review"}`);
return { slug: SLUG, review };
