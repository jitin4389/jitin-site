/**
 * Articles in the agentic coding series (and future writing). Bodies are plain Markdown in
 * `<slug>.md` next to this file so they can be republished elsewhere unchanged.
 * Intent and series map: docs/intent/writing-series.md.
 */
export type KeyTerm = { term: string; definition: string };

export type Article = {
  slug: string;
  title: string;
  description: string;
  /** "YYYY-MM-DD" */
  date: string;
  tags: string[];
  series?: { name: string; part: number; of: number };
  /** Plain-language "In one minute" summary for readers new to the topic. */
  summary: string;
  keyTerms: KeyTerm[];
  keyPoints: string[];
  /** Beats for a future video (YouTube lecture or Short). Not shown on the site. */
  videoOutline: string[];
};

export const SERIES_NAME = "Agentic coding with Claude Code";

export const articles: Article[] = [
  {
    slug: "context-engineering-claude-md",
    title: "Context engineering: CLAUDE.md, docs and the context window",
    description:
      "Design what your coding agent always knows, loads on demand and never sees. A practical guide to CLAUDE.md, imports, rules and compaction in Claude Code.",
    date: "2026-10-04",
    tags: ["claude-code", "context-engineering", "claude-md", "agentic-coding"],
    series: { name: SERIES_NAME, part: 1, of: 10 },
    summary:
      "An AI coding assistant starts every session with no memory of your project. It only knows what you give it. Most of its mistakes come from instructions that are missing, out of date or lost among too much text, not from a weak model. This article shows how to write a short project notes file that the assistant reads every time, how to keep extra detail out of the way until it is needed, and how to check that the assistant actually picked up what you wrote.",
    keyTerms: [
      {
        term: "Context window",
        definition:
          "The model's working memory for a session: everything it can see at once, including your messages, files it has read and your project instructions.",
      },
      {
        term: "CLAUDE.md",
        definition:
          "A Markdown file of project instructions that Claude Code loads at the start of every session. It guides behaviour but does not enforce it.",
      },
      {
        term: "Import (@path)",
        definition:
          "A line in CLAUDE.md such as @docs/architecture.md that pulls another file into context at launch. It organises content but does not save space.",
      },
      {
        term: "Path-scoped rule",
        definition:
          "A file in .claude/rules/ with a paths list that loads only when Claude reads or edits a matching file.",
      },
      {
        term: "Compaction",
        definition:
          "Claude Code summarising a long conversation to free space. Project-root CLAUDE.md is re-read afterwards; instructions given only in chat may be lost.",
      },
    ],
    keyPoints: [
      "Agents fail more often from missing or stale context than from weak models.",
      "Sort context into three buckets: always know, load when needed, keep out.",
      "CLAUDE.md is advice, not enforcement; use hooks or permissions for hard rules.",
      "Imports keep files tidy but still cost context; path-scoped rules and skills load on demand.",
      "Write down an instruction hierarchy, because Claude Code stacks files without ranking them.",
      "Confirm what loaded with /context and audit for drift with /doctor prompt-audit.",
    ],
    videoOutline: [
      "Hook (Short): the agent ran the wrong test command and wrote confident time-zone bugs. The model was fine; its context was not. One file fixes most of it.",
      "What the context window is, and why every session starts empty.",
      "The three buckets: always know, load when needed, keep out.",
      "How Claude Code stacks CLAUDE.md files and why conflicts get resolved arbitrarily.",
      "Live demo: build the reminders-service CLAUDE.md with two imports and confirm with /context.",
      "The backtick trap and why imports do not save context.",
      "Step two: move testing rules into a path-scoped rule and explain the compaction trade-off.",
      "Production lessons: written hierarchy, stable cached prefix, reading orders for sub-agents, handover.",
      "Pitfalls recap and the same-day checklist.",
    ],
  },
  {
    slug: "mcp-servers-governed-data-access",
    title: "MCP servers: giving agents governed access to data",
    description:
      "Treat MCP servers as where governance lives: read-only tools by construction, rules enforced in servers and hooks, and tool descriptions as contracts.",
    date: "2026-10-04",
    tags: ["claude-code", "mcp", "governance", "agentic-coding"],
    series: { name: SERIES_NAME, part: 4, of: 10 },
    summary:
      "AI coding assistants can now connect to outside systems, such as a database, through small connector programs called MCP servers. That is useful, but the assistant can then do whatever the connection allows, including changing or deleting data. This article shows how to build a small connector that can only read, however it is asked, and how to add a check that stops the wrong helper agent from using sensitive data. The main idea: put the rules in the software itself, not in written instructions the assistant may not follow.",
    keyTerms: [
      {
        term: "MCP (Model Context Protocol)",
        definition:
          "An open standard for connecting AI applications such as Claude Code to outside tools and data through small programs called MCP servers.",
      },
      {
        term: "MCP tool",
        definition:
          "An action an MCP server offers, such as run_select. In Claude Code it is named mcp__<server>__<tool>, and that name is used in permission rules and hooks.",
      },
      {
        term: "Read-only by construction",
        definition:
          "A tool designed so it cannot write even if called badly, for example through a read-only connection and a database authorizer, rather than by asking the agent to behave.",
      },
      {
        term: "Tool description",
        definition:
          "The text and input schema that tell Claude what a tool does. Claude believes it, so it must be accurate and honest about limits.",
      },
      {
        term: "PreToolUse hook",
        definition:
          "A script Claude Code runs before a tool call. Exiting with code 2, or returning a deny decision, blocks the call.",
      },
    ],
    keyPoints: [
      "An MCP server is where you decide what an agent may do with your data, so design it as a policy boundary, not a pipe.",
      "Make dangerous actions impossible in the server; prompts and annotations do not enforce anything.",
      "Let the database engine decide what a query touches; a 'starts with SELECT' check misses WITH ... DELETE.",
      "Cap rows and report truncation, and enforce timeouts inside the server.",
      "Use PreToolUse hooks with matchers ending in .* to restrict sensitive servers to one sub-agent.",
      "Tool descriptions are contracts the agent believes; test them so they never promise more than the code does.",
    ],
    videoOutline: [
      "Hook (Short): this query starts with WITH, passes a 'read-only' check, and deletes your table. Here is the one-line fix that stops it at the database.",
      "What MCP is, and how Claude Code names MCP tools (mcp__server__tool).",
      "The three layers: server, Claude Code configuration, hooks. Why prompts are not on the list.",
      "Tool descriptions as contracts, and why tool search makes server names and instructions matter.",
      "Live build: the read-only SQLite server with the Python SDK v2 (MCPServer, not FastMCP).",
      "Register at project scope: the --env ordering trap, the -- separator and CLAUDE_PROJECT_DIR.",
      "Try to break it: DELETE, WITH ... DELETE, two statements, internal tables, 500 rows.",
      "Production lessons: one governed service, plan-checked SQL, optional tool families, session isolation, one-agent-only hooks, testing descriptions in CI.",
      "Pitfalls recap and the same-day checklist.",
    ],
  },
  {
    slug: "hooks-as-guardrails",
    title: "Hooks as guardrails: enforcing rules in code, not prompts",
    description:
      "Prompts are requests; hooks are rules. How to turn Claude Code team rules into small scripts that block, explain and are easy to change.",
    date: "2026-10-04",
    tags: ["claude-code", "hooks", "guardrails", "agentic-coding"],
    series: { name: SERIES_NAME, part: 6, of: 10 },
    summary:
      "When you tell an AI coding assistant a rule in plain words, it usually follows it, but not always. For rules that really matter, you can add a small script, called a hook, that runs automatically at a fixed moment, such as just before a file is saved. If the script finds a problem, it stops the action and explains why. The assistant cannot forget or skip it, and the people who own the rule can update the rule list without changing any code.",
    keyTerms: [
      {
        term: "Hook",
        definition:
          "A script or handler that Claude Code runs automatically at a fixed point, such as just before a tool runs or just before Claude finishes answering.",
      },
      {
        term: "Hook event",
        definition:
          "The named moment a hook is attached to, for example PreToolUse (before a tool runs) or Stop (when Claude finishes responding).",
      },
      {
        term: "Matcher",
        definition:
          "The part of a hook's configuration that says which tools it applies to, such as Write|Edit. It sees tool names only, not file paths.",
      },
      {
        term: "Exit code 2",
        definition:
          "The signal a command hook uses to block an action. Its error output is shown to Claude as the reason. Other non-zero codes do not block.",
      },
      {
        term: "Fail open / fail closed",
        definition:
          "What a guardrail does when it breaks: let the action through (open) or stop it (closed). It should be a deliberate choice.",
      },
    ],
    keyPoints: [
      "Prompt rules are followed most of the time; rules that must hold every time belong in hooks.",
      "Only exit code 2 (or a JSON deny) blocks; exit 1, crashes and timeouts let the action through.",
      "A PreToolUse deny holds in every permission mode, and settings hooks also fire inside sub-agents.",
      "Keep the rule's data in a file its owners can edit, separate from the hook's code.",
      "A Stop hook that sends an answer back once with a precise reason beats retrying from scratch.",
      "Hooks cannot see every path, such as shell writes, so run the same checks in CI.",
    ],
    videoOutline: [
      "Hook (Short): your AI assistant follows your rules nine times out of ten. Here is the small script that closes the gap.",
      "The problem: why rules written in prompts and CLAUDE.md drift, especially in long sessions and agent-to-agent handoffs.",
      "The mental model: prompts are requests, hooks are turnstiles. The key events: PreToolUse and Stop.",
      "The three facts that make hooks real guardrails: exit code 2, deny beats every permission mode, hooks fire in sub-agents.",
      "Demo part 1: a lexicon file and a PreToolUse hook that blocks hype words in a reports folder.",
      "Demo part 2: a Stop hook that sends an uncited figure back once, and why stop_hook_active matters.",
      "Testing hooks by hand: pipe in sample JSON and check the exit code.",
      "Lessons from production: rule owners edit the data, send back once instead of retrying, enforce in hooks and CI.",
      "Pitfalls: exit 1, timeouts, shell side doors, outdated matchers, untrusted repos.",
      "Close: the same-day checklist and where to read the official reference.",
    ],
  },
];

/** Newest first. */
export function getArticles(): Article[] {
  return [...articles].sort(
    (a, b) =>
      b.date.localeCompare(a.date) ||
      (b.series?.part ?? 0) - (a.series?.part ?? 0),
  );
}

export function getArticle(slug: string): Article | undefined {
  return articles.find((article) => article.slug === slug);
}

export function getTags(): string[] {
  return [...new Set(articles.flatMap((article) => article.tags))].sort();
}

export function tagSlug(tag: string): string {
  return tag
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Previous and next published parts of the same series, by part number. */
export function getSeriesNeighbours(slug: string): {
  previous?: Article;
  next?: Article;
} {
  const current = getArticle(slug);
  if (!current?.series) return {};
  const parts = articles
    .filter((article) => article.series?.name === current.series?.name)
    .sort((a, b) => (a.series?.part ?? 0) - (b.series?.part ?? 0));
  const index = parts.findIndex((article) => article.slug === slug);
  return { previous: parts[index - 1], next: parts[index + 1] };
}
