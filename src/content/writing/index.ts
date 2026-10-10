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
  {
    slug: "slash-commands-repeatable-workflows",
    title: "Slash commands: turning repeated prompts into team workflows",
    description:
      "A Claude Code slash command is a contract, not a saved prompt: it gathers its own context, limits its tools and returns the same shape every time.",
    date: "2026-10-04",
    tags: ["claude-code", "slash-commands", "workflows", "agentic-coding"],
    series: { name: SERIES_NAME, part: 2, of: 10 },
    summary:
      "Most teams type the same few instructions into their AI coding assistant again and again. Claude Code lets you save each one as a small file and run it with a short name, such as /release-notes. The trick is to write that file like a clear job description: it collects the facts it needs, does only what it is allowed to do, gives back results in the same layout every time, and stops so a person can check anything important.",
    keyTerms: [
      {
        term: "Custom slash command",
        definition:
          "A Markdown file whose name becomes a command you type, such as /release-notes. Its body is the prompt Claude Code hands to Claude.",
      },
      {
        term: "Frontmatter",
        definition:
          "A short YAML block between two --- lines at the top of the file that sets options such as description, arguments and allowed-tools.",
      },
      {
        term: "Context injection (!)",
        definition:
          "A line like !`git log` that Claude Code runs before Claude reads the prompt, replacing the line with the command's output.",
      },
      {
        term: "allowed-tools",
        definition:
          "A frontmatter field that pre-approves specific tools for the turn that runs the command. It does not block other tools.",
      },
      {
        term: "disable-model-invocation",
        definition:
          "A frontmatter setting that makes a command manual-only, so Claude cannot decide to run it on its own.",
      },
    ],
    keyPoints: [
      "Treat a slash command as a contract for a repeatable task, not a saved prompt.",
      "Fetch facts with ! lines and @ references at the start instead of trusting the model's memory.",
      "allowed-tools pre-approves for one turn; it is not a sandbox, so restrict with deny rules or disallowed-tools.",
      "Make side-effect commands manual-only and end sensitive ones with a review gate.",
      "Commit commands the team relies on in .claude/commands/; keep personal habits in ~/.claude/commands/.",
      "A command is a prompt, so the model still makes judgement calls; rules that must always hold belong in hooks.",
    ],
    videoOutline: [
      "Hook (Short): your best prompt works for you and drifts for everyone else. Here is how to turn it into a /command your whole team can trust.",
      "The problem: saved prompts carry hidden assumptions about context, scope and when to stop.",
      "The mental model: a command is a contract. It gathers context, constrains tools and returns a fixed shape.",
      "Where commands live: project vs personal vs plugin, and the recent merge of commands into skills.",
      "Demo: building /release-notes with named arguments, ! git lines, an @ file reference and allowed-tools.",
      "Demo: running it normally, with no argument and with a bad tag, and why a clean stop is a feature.",
      "A personal /brief command, and the test for when it should move into the repo.",
      "Lessons from production: staged chores with stop conditions, commands that hand off through files, review gates.",
      "Pitfalls: silent frontmatter typos, zero-based arguments, failing ! lines, allowed-tools is not a sandbox.",
      "Close: the same-day checklist, and how hooks and skills pick up where commands stop.",
    ],
  },
  {
    slug: "sub-agents-delegation",
    title: "Sub-agents: delegation without losing the plot",
    description:
      "Sub-agents are about context isolation and clear contracts, not more AI. How to brief, restrict and check Claude Code sub-agents, with a working example.",
    date: "2026-10-04",
    tags: ["claude-code", "sub-agents", "delegation", "agentic-coding"],
    series: { name: SERIES_NAME, part: 3, of: 10 },
    summary:
      "An AI coding assistant can hand a side task to a helper that works separately and reports back. The helper starts fresh, without your earlier conversation, so the main session stays focused. But the helper only knows what you tell it, and the main assistant may shorten its report before you see it. This article shows how to write a clear task for each helper, limit what it can do, insist on a fixed report format, and make sure the important parts reach you unchanged.",
    keyTerms: [
      {
        term: "Sub-agent",
        definition:
          "A specialised assistant that Claude Code runs in its own context window, with its own instructions and tools, which returns one final message.",
      },
      {
        term: "Orchestrator",
        definition:
          "The main agent that hands out work to sub-agents and stays responsible for the final answer.",
      },
      {
        term: "Brief",
        definition:
          "The task message the orchestrator writes when it delegates. Apart from CLAUDE.md, it is the only context a sub-agent receives about the work.",
      },
      {
        term: "Hand-back",
        definition:
          "The sub-agent's final message. The orchestrator sees only this, not the searches or steps behind it, and may summarise it.",
      },
      {
        term: "SubagentStop hook",
        definition:
          "A script that runs when a sub-agent finishes. Exiting with code 2 sends the sub-agent back to work with the script's message as its next instruction.",
      },
    ],
    keyPoints: [
      "Delegate a task only when you could brief it by email and check it from its output.",
      "A sub-agent sees its brief and CLAUDE.md, not your conversation, so put paths and decisions in the brief.",
      "The orchestrator sees only the final message and may summarise it; ask for verbatim output or hand off through files.",
      "Give each sub-agent the fewest tools and a fixed report shape, and enforce the shape with a SubagentStop hook.",
      "Tools lists cannot restrict paths, and Agent allowlists are ignored inside sub-agent definitions; use hooks for access rules.",
      "Keep the pipeline and failure handling in ordinary code; let the model do the work inside each step.",
    ],
    videoOutline: [
      "Hook (Short): your sub-agent found exactly the right answer, and your main agent quietly threw it away. Here is why, and the one line that fixes it.",
      "The problem: long sessions fill the context window with logs and searches, and 'more agents' is the wrong instinct.",
      "The mental model: a contract with two edges, the brief going in and the hand-back coming out.",
      "When to delegate: the 'could you brief it by email?' test, and when to keep work in the main conversation.",
      "Demo part 1: the investigator, test-writer and reviewer files, and why each has different tools.",
      "Demo part 2: a SubagentStop hook that sends a badly shaped report back once.",
      "Demo part 3: the run, and how the report's shape survived only when the prompt asked for it verbatim.",
      "Lessons from production: decide what survives the hand-back, hand off through files, one methodology per specialist, budgets, access hooks.",
      "Pitfalls: vague descriptions, assumed context, silent frontmatter typos, tools that cannot restrict paths, outdated tutorials.",
      "Close: the same-day checklist and the official docs to read next.",
    ],
  },
  {
    slug: "agent-skills-methodology",
    title: "Agent Skills: methodology the agent carries with it",
    description:
      "Stop relying on the model's memory for your methods. How to design Claude Code skills with a sharp description, rules first and detail loaded on demand.",
    date: "2026-10-04",
    tags: ["claude-code", "agent-skills", "methodology", "agentic-coding"],
    series: { name: SERIES_NAME, part: 5, of: 10 },
    summary:
      "Teams have ways of doing things that usually live in people's heads. A skill writes one of those methods down as a small folder that your AI coding assistant opens only when a task needs it. A short description tells the assistant when to use it. The first page lists the rules it must never break. The rest, such as reference notes and small checking scripts, is read only when a question calls for it. The result: the assistant follows your method instead of making it up as it goes.",
    keyTerms: [
      {
        term: "Skill",
        definition:
          "A folder with a SKILL.md file of instructions, plus optional reference files and scripts, that Claude loads when a task needs it or when you type /skill-name.",
      },
      {
        term: "Description",
        definition:
          "The short frontmatter text Claude always sees and matches your request against. It decides whether the skill is used at all.",
      },
      {
        term: "Progressive disclosure",
        definition:
          "Loading information in stages: names and descriptions always, the SKILL.md body when the skill is used, reference files and script output only when a step needs them.",
      },
      {
        term: "Routing table",
        definition:
          "A table in SKILL.md that sends each kind of question or finding to the one reference file that answers it.",
      },
      {
        term: "allowed-tools",
        definition:
          "A frontmatter field that pre-approves listed tools for the turn that invokes the skill. It does not restrict other tools.",
      },
    ],
    keyPoints: [
      "A skill moves your methodology out of the model's memory and into a folder it loads on demand.",
      "The description is the trigger: third person, what and when, in the words people type.",
      "Put non-negotiable rules first; after compaction only the start of a skill is kept.",
      "Route each case to one reference file, one level deep, so the agent reads only what it needs.",
      "Put deterministic checks in scripts; only their output costs context.",
      "Treat skills as software: version them, review them and gate releases on evidence.",
    ],
    videoOutline: [
      "Hook (Short): your agent had your method in its context and still did the maths in its head. Here is how a skill fixes that.",
      "The problem: methodology pasted into chat and CLAUDE.md grows, costs context every session, and still gets improvised.",
      "The idea: a skill is a folder with SKILL.md, personal or project, and how it relates to slash commands.",
      "Progressive disclosure: description always, instructions on use, references and script output on demand.",
      "The field-manual model: a sharp cover, rules on page one, an index to the rest, and why rules go first.",
      "Demo part 1: building the database-migration-review skill and testing the scanner on its own.",
      "Demo part 2: invoking it with /database-migration-review and by plain question, and what happens with permissions.",
      "Lessons from production: one domain per folder, parameter files with reasons, run only what the question needs, release gates.",
      "Pitfalls: vague descriptions, silent frontmatter typos, buried rules, side effects, allowed-tools is not a fence.",
      "Close: the same-day checklist and the official docs to read next.",
    ],
  },
  {
    slug: "claude-code-in-ci",
    title:
      "Claude Code in CI: GitHub Actions and automated changes you can trust",
    description:
      "Putting an agent in CI puts it in your release path. Narrow permissions, a fixed output shape, a budget and a human approval gate for Claude Code.",
    date: "2026-10-04",
    tags: ["claude-code", "ci", "github-actions", "agentic-coding"],
    series: { name: SERIES_NAME, part: 7, of: 10 },
    summary:
      "You can set up an AI coding assistant to run on its own: every time someone opens a pull request, or every night. That saves time, but anything that runs there can affect what you ship. This article shows five safety habits: let the assistant read code but not change it, make it answer in a fixed format, limit how long and how much it can run, let a plain script do any writing, and have a person approve before anything is posted. It includes two GitHub workflows you can adapt.",
    keyTerms: [
      {
        term: "CI (continuous integration)",
        definition:
          "Automated jobs that run on every push or pull request, such as builds and tests, before changes are merged and shipped.",
      },
      {
        term: "Headless mode (claude -p)",
        definition:
          "Running Claude Code non-interactively from a script: it takes a prompt, does the work, prints a result and exits.",
      },
      {
        term: "Structured output",
        definition:
          "An answer returned as JSON that matches a schema you supply with --json-schema, so later steps read data instead of prose.",
      },
      {
        term: "Required reviewers",
        definition:
          "A GitHub environment setting that pauses a job until a named person approves it.",
      },
      {
        term: "Bare mode (--bare)",
        definition:
          "A headless option that skips the repository's hooks, MCP servers, skills and CLAUDE.md, so code you did not write cannot run in your job.",
      },
    ],
    keyPoints: [
      "An agent in CI is in your release path; treat its output like any untrusted contribution.",
      "Trust comes from the pipeline's shape, not the prompt: read-only, schema, budget, deterministic writes, human gate.",
      "--allowedTools auto-approves tools; pair it with --disallowedTools or dontAsk to actually restrict them.",
      "A denied action does not fail a headless run; check permission_denials if it matters.",
      "Use --bare when claude -p runs on code you did not write, and never give pull_request_target secrets to untrusted checkouts.",
      "Green is not working: keep failing builds red and make silent failures loud.",
    ],
    videoOutline: [
      "Hook (Short): I gave an AI reviewer write access, a secret and no turn limit. Nothing went wrong, but nothing would have stopped it. Here are the five controls I use now.",
      "Why an agent in CI is an agent in your release path, and the contractor mental model.",
      "Three ways to run Claude Code in automation: the GitHub Action, headless claude -p and the Agent SDK.",
      "The five controls: read-only, fixed output shape, budget, deterministic writes, human gate.",
      "Walkthrough: the checklist review workflow, from permissions {} to the JSON schema.",
      "The approval gate: a GitHub environment with required reviewers in front of the only write.",
      "Walkthrough: the nightly failing-test summary with --bare, dontAsk and spending caps.",
      "Production lessons: least privilege, green is not working, descriptions are code, watch the watcher.",
      "Pitfalls: allowedTools does not restrict, denials do not fail runs, pull_request_target secrets.",
      "Same-day checklist and where to read more.",
    ],
  },
  {
    slug: "evaluating-agent-output",
    title: "Evaluating agent output: from vibes to evidence",
    description:
      "If you can't measure an agent, you can't change it safely. Build a small Claude Code eval suite: code checks first, a judge only where needed.",
    date: "2026-10-04",
    tags: ["claude-code", "evals", "testing", "agentic-coding"],
    series: { name: SERIES_NAME, part: 8, of: 10 },
    summary:
      "Most people decide whether their AI coding assistant is working by gut feeling. That stops working when several people change its instructions or a new model arrives. A better way is a small set of repeatable tests, called evals, built from real mistakes the assistant has made. Simple automatic checks come first: did the project's tests pass, and did it leave protected files alone? Only then is a second AI model asked one yes-or-no question about the few things code cannot check. When a test fails, you work out which part caused it, such as the instructions or a tool, before you change anything.",
    keyTerms: [
      {
        term: "Eval",
        definition:
          "A repeatable test of an agent's behaviour: a realistic prompt, a known starting state and checks on what came out.",
      },
      {
        term: "Deterministic check",
        definition:
          "A check written in code that gives the same answer every time, such as running the tests, comparing file hashes or matching a pattern.",
      },
      {
        term: "LLM judge",
        definition:
          "A second model asked one short PASS/FAIL question about an answer, used only where a code check cannot decide.",
      },
      {
        term: "Headless mode",
        definition:
          "Running Claude Code without the interactive interface, with claude -p, so a script can drive it and read the result.",
      },
      {
        term: "Bare mode",
        definition:
          "The --bare flag, which stops a headless run loading local hooks, CLAUDE.md, plugins and MCP servers, so results are the same on every machine.",
      },
    ],
    keyPoints: [
      "If you cannot measure an agent, you cannot change its prompts, skills or model safely.",
      "Build eval cases from real failures, with fabrication and false-premise cases first.",
      "Check the run, the behaviour and the result in code before asking a judge anything.",
      "Check outcomes, not one exact path; agents reach correct answers by different routes.",
      "Pin the model, use --bare in CI and run each case several times before trusting it.",
      "Attribute each failure to a component, and report judge failures rather than auto-retrying.",
    ],
    videoOutline: [
      "Hook (Short): you changed one line in CLAUDE.md. Is your agent better or worse? If you cannot answer in a minute, this is for you.",
      "The problem: judging agents by feel, and why it breaks with shared instructions and new models.",
      "The mental model: an eval is a smoke alarm built from past incidents, not an exam. Grading order: code, then judge, then humans.",
      "The three layers every case checks: the run, the behaviour (tools and files) and the result.",
      "Demo part 1: the invoice fixture and three cases, including the false-premise case.",
      "Demo part 2: the runner, stream-json for tool calls, file hashes and a typed verdict from a cheap judge.",
      "The first-run failure: grading the path instead of the outcome, and the fix.",
      "Running it in CI with bare mode and a pinned model, and when to run it again.",
      "Lessons from production: replay real sessions, attribute failures to a component, report rather than retry.",
      "Pitfalls and the same-day checklist.",
    ],
  },
  {
    slug: "choosing-models-and-providers",
    title: "Choosing models and providers: cloud, gateways and local models",
    description:
      "Treat model choice as an engineering decision: route Claude Code work by task, separate it from the provider, and change it only on eval evidence.",
    date: "2026-10-04",
    tags: ["claude-code", "models", "llm-gateway", "evals", "agentic-coding"],
    series: { name: SERIES_NAME, part: 9, of: 10 },
    summary:
      "An AI coding tool can use different models. Some are fast and cheap. Others are slower and more expensive, but better at hard problems. Teams often pick one because it feels good, then use it for everything. A better way: match each kind of task to a suitable model, write that choice down where the team can see it, and only change it after testing the new option on the same set of example questions. Local or alternative models get the same test, not a free pass.",
    keyTerms: [
      {
        term: "Model alias",
        definition:
          "A short name such as haiku, sonnet or opus that points to a model family. What it points to changes over time and can differ by provider.",
      },
      {
        term: "Subagent",
        definition:
          "A helper agent defined in a Markdown file, with its own instructions, tools and model, that the main Claude Code session can hand work to.",
      },
      {
        term: "LLM gateway",
        definition:
          "A proxy an organisation runs between developers and the model provider. It holds credentials, tracks usage and can switch providers centrally.",
      },
      {
        term: "Prompt caching",
        definition:
          "The provider reuses the unchanged start of a request instead of processing it again, which cuts cost. Each model has its own cache.",
      },
      {
        term: "Eval suite",
        definition:
          "A small, fixed set of test cases with expected answers, run against each model or set-up so changes are judged on evidence.",
      },
    ],
    keyPoints: [
      "Separate three decisions: which kind of model a task needs, where models come from, and how you prove a change is safe.",
      "Put the team default in project settings and give each subagent its own model; switching models mid-session starts a cold cache, so the next turn costs more.",
      "On cloud providers and gateways, pin every alias you use so upgrades become reviewed changes.",
      "A gateway must forward caching markers and headers unchanged, or every turn bills as uncached with no error.",
      "Easy eval cases flatter cheap models; the real differences show in tool use and citation discipline.",
      "Local and non-Claude models are unsupported by Anthropic, so treat them as experiments that must pass the same suite.",
    ],
    videoOutline: [
      "Hook (Short): your team picked its AI model because it felt smart. Here is a short routing table and one script that turn that feeling into evidence.",
      "The problem: one model for everything, a surprising bill, and no way to say whether a change helped.",
      "The mental model: menu, supplier and tasting. Which model per task, where models come from, and how you prove a change.",
      "Routing in Claude Code: aliases, the session model, per-subagent models, opusplan and effort, and why switching mid-session breaks the cache.",
      "Providers and gateways: pinning aliases, keeping credentials out of the repo, and the gateway that silently breaks caching.",
      "Demo: project settings plus summariser and reviewer subagents, and checking which models actually ran.",
      "Demo: the comparison script running the same cases against a fast and a strong configuration, and why easy cases mislead.",
      "Local and open models: what Anthropic supports, and why they go through the same eval suite.",
      "Lessons from production: route by task, configuration not code, stable prompt first, no change without evals.",
      "Close: pitfalls recap and the same-day checklist.",
    ],
  },
  {
    slug: "working-responsibly-with-ai",
    title: "Working responsibly with AI, and explaining it to others",
    description:
      "Responsible AI coding is habits and gates, not a disclaimer. A one-page team agreement, enforced Claude Code settings, and how to explain it all.",
    date: "2026-10-04",
    tags: [
      "claude-code",
      "responsible-ai",
      "permissions",
      "security",
      "agentic-coding",
    ],
    series: { name: SERIES_NAME, part: 10, of: 10 },
    summary:
      "Many teams write down a promise to use AI carefully, but nothing in their tools makes them keep it. This article turns that promise into three things: a one-page team agreement, a few settings that stop the AI assistant from opening secret files or pushing code without a person saying yes, and a small check that catches private names before they go public. It also shows how to explain an AI coding assistant to someone who does not write code, using the picture of a fast new colleague with a limited key card.",
    keyTerms: [
      {
        term: "Promise vs control",
        definition:
          "A promise is a rule written in prose that people and the model must remember. A control is a rule the tool, git host or CI enforces whatever anyone remembers.",
      },
      {
        term: "Permission mode",
        definition:
          "The Claude Code setting that decides which actions run without asking you, such as Manual, plan, auto or bypass. On recent versions, interactive sessions start in auto mode.",
      },
      {
        term: "Deny and ask rules",
        definition:
          "Permission rules in settings. Deny blocks an action in every mode; ask is never auto-approved, prompts a person even in auto mode, and is refused where nobody can answer.",
      },
      {
        term: "Sandbox",
        definition:
          "An operating-system boundary around the shell commands Claude runs, limiting which files and network hosts they can reach. It is off by default.",
      },
      {
        term: "Prompt injection",
        definition:
          "Hostile text in a web page, issue or file that tries to steer the agent into doing something you did not ask for.",
      },
    ],
    keyPoints: [
      "Prompts and CLAUDE.md shape what Claude tries to do; settings decide what Claude Code allows.",
      "Label every rule in your team agreement as enforced or by review, and move the important ones into controls.",
      "On recent versions, interactive sessions start in auto mode, so 'it always asks first' is an outdated assumption.",
      "Deny rules are not a wall on their own; combine them with the sandbox, branch protection and CI checks.",
      "Guardrails must not become leaks: a confidentiality check should report counts, never the terms.",
      "If you cannot explain what your agent may and may not do to a non-developer, tighten your setup.",
    ],
    videoOutline: [
      "Hook (Short): your team's responsible AI policy is a paragraph nobody reads before starting a session. Here is how to turn it into three files that actually stop mistakes.",
      "The problem: printed tokens, unexplained pull requests and leaked client names happen in the gap between policy and terminal.",
      "The mental model: promises versus controls, and why permission rules are enforced by the tool, not the model.",
      "What changed recently: auto mode as the starting mode, ask rules that are never auto-approved, and the limits of deny rules and checkpoints.",
      "Demo part 1: a one-page AI working agreement with every rule labelled enforced or by review.",
      "Demo part 2: a committed .claude/settings.json with deny rules, ask rules and bypass mode switched off.",
      "Demo part 3: a confidentiality check that fails on blocked terms and prints counts only.",
      "Explaining it: the new-colleague-with-a-key-card analogy, the three-sentence version and a day-one list for new hires.",
      "Lessons from production and pitfalls: one human publish, rotate leaked secrets, approval fatigue, keeping attribution on.",
      "Close: the same-day checklist and the official docs to read next.",
    ],
  },
  {
    slug: "learning-loop-for-ai-agents",
    title:
      '"It doesn\'t learn": an architecture for a learning loop in AI agents',
    description:
      "Why 'store the corrections and inject them' fails, and a seven-stage learning loop with provenance, a taxonomy, budgets, replay evaluation and human gates.",
    date: "2026-10-10",
    tags: [
      "ai-agents",
      "learning-loop",
      "memory",
      "evaluation",
      "architecture",
    ],
    summary:
      "Users say their AI assistant does not learn: they correct it, and the next day it makes the same mistake. The model is not the problem. The system around it never records what the user said in a checkable way, never sorts those notes into kinds, and never tests whether they help. This article lays out a loop that does all three: record, enrich, group, extract, serve, evaluate, approve. It also shares what went wrong in production, and a small runnable example.",
    keyTerms: [
      {
        term: "Learning loop",
        definition:
          "A pipeline that turns past interactions into checked, typed notes, serves a small set of them to future sessions, and measures whether answers improved before anything goes live.",
      },
      {
        term: "Interaction record",
        definition:
          "One immutable entry per user turn holding the question, the answer the user actually saw, the feedback, and provenance such as ids and timestamps. Every later file is derived from it.",
      },
      {
        term: "Learning item",
        definition:
          "A single extracted note with a kind (world fact, method rule, answer shape, profile or watch), a scope, a verbatim quote from the user and a pointer to the record it came from.",
      },
      {
        term: "Context package",
        definition:
          "The budgeted, layered text served to a new session: rules first, world facts in 'verify then apply' form, and a list of anything cut for space.",
      },
      {
        term: "Replay evaluation",
        definition:
          "Answering old questions again with and without the package, then scoring the two answers with a blind judge, code guards and the user's own later corrections.",
      },
      {
        term: "Pre-registration",
        definition:
          "Writing the hypothesis, pass line, sample and judge prompt before a run, and pinning code and prompt hashes so results cannot quietly reshape the test.",
      },
    ],
    keyPoints: [
      '"It doesn\'t learn" is a design problem in the system around the model, not a model problem.',
      "Storing corrections and injecting them fails because kinds get mixed, facts go stale, text leaks, lists grow and nothing is measured.",
      "Parse each interaction once into an immutable record with provenance; everything else is a rebuildable view.",
      "Give every learning a kind, a scope and an owner; serve world facts as dated claims to verify, never as statements.",
      "Every served item must quote the user's own words, checked by code against the record.",
      "Budget the package, render it in layers, and list what was cut instead of dropping it silently.",
      "Evaluate by replay against what the user later corrected, pre-register the pass line, and keep one human gate per stage.",
    ],
    videoOutline: [
      "Hook (Short): your users corrected the assistant yesterday and it made the same mistake today. The model is not the problem. Here is the loop that fixes it.",
      "The obvious fix: store corrections, inject them next time, and the five ways it breaks within a month.",
      "The mental model: seven stages, record to approve, drawn as a loop, and why approval is a step rather than a hope.",
      "Record first: one immutable record per turn with the answer the user actually saw, and why enrichment lives in versioned sidecars.",
      "The taxonomy: world facts, method rules, answer shape, profile, standing watches, and the precedence rules that keep them sane.",
      "Humans freeze vocabularies, machines do the volume: letting a model draft labels and then turning the frozen set into a schema.",
      "Serving: verbatim quotes, 'verify then apply' for world facts, budgets, layers and listed cuts.",
      "Evaluation: replay with and without the package, a blind judge in seeded order, a leak scan, and scoring against later corrections.",
      "Pre-registration and the human gate: write the pass line first, pin hashes, record deviations, one approval per stage.",
      "Close: the production lessons that held up and the one-week checklist.",
    ],
  },
];

/** Newest first; within a day, series parts in reading order. */
export function getArticles(): Article[] {
  return [...articles].sort(
    (a, b) =>
      b.date.localeCompare(a.date) ||
      (a.series?.part ?? 0) - (b.series?.part ?? 0),
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
