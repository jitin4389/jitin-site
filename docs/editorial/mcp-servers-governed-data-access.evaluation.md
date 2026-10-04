# Evaluation: mcp-servers-governed-data-access (round 1)

**Verdict: PASS.** There are no blocker or major issues, and every score is 4 or higher. Two minor fixes are listed below. They are worth making before publishing, but they do not block it.

## Scores

| Dimension       | Score | Notes                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accuracy        | 4     | Checked every Claude Code fact against the current docs at code.claude.com (mcp, permissions, hooks, sub-agents, managed-mcp, settings, cli-reference), fetched 2026-10-04. All hold except one over-simplified explanation of `--env` ordering (issue 1). The Python SDK claims were checked by running the code against `mcp` 2.3.0, the current PyPI release.                            |
| Originality     | 5     | The example is a read-only SQLite server with an authorizer, a books/authors demo database and a "try to break it" table. There is no workout app, Clerk, Neon seed-data MCP or Ollama. The structure does not follow the course outline.                                                                                                                                                   |
| Confidentiality | 5     | None of the blocklist terms appear in the article or the sidecar (case-insensitive substring scan of every term). No client, person, vendor, product or repository names. The "librarian" sub-agent label already appears in the site's published case study, and the research notes supply it as anonymised.                                                                               |
| Claims          | 5     | Client facts used: "a global hedge fund with ~$1B AUM" and "12+ sector forecasting models", both in the approved facts file. No other numbers about the client work. The 200-row cap and 5-second timeout belong to the demo, not production.                                                                                                                                               |
| Code            | 5     | All 8 fenced blocks pass the syntax checks. The server also ran end to end under a real MCP client, and every row of the article's "try to break it" table behaved exactly as described (log below).                                                                                                                                                                                        |
| Clarity         | 5     | Follows the same template as the sibling parts: idea, working example, production, pitfalls, checklist, further reading. 2,204 words of prose, excluding code. Headings start at `##`. No JSX, imports or HTML components in the body. Jargon (MCP, server, client, tool search, authorizer) is defined on first use. The sidecar is valid JSON with the same keys as the sibling sidecars. |

## Facts verified against the official docs

- **Tool naming.** `mcp__<server>__<tool>` is used in permission rules and hook matchers.
- **Tool search.** On by default. Only tool names and server instructions load at session start. The docs advise server authors to write clear instructions.
- **`CLAUDE_PROJECT_DIR`.** It is set in the server's environment, not Claude Code's own. Using it in `command` or `args` of a project `.mcp.json` entry needs a default such as `${CLAUDE_PROJECT_DIR:-.}`. The docs say this word for word.
- **`.mcp.json` shape.** `mcpServers` → name → `type: "stdio"`, `command`, `args`, `env`. This matches the docs' examples.
- **Approval.** Project servers prompt for approval in interactive sessions. In `claude -p`, Agent SDK and cloud sessions they load without asking. `disabledMcpjsonServers` and `--strict-mcp-config` with `--mcp-config` are both documented remedies.
- **Permission rules.** An unanchored `mcp__*` allow is skipped with a warning. Deny and ask rules accept it. Settings files skip `mcp__` rules that have parentheses.
- **Hook matchers.** `mcp__memory` without `.*` is compared as an exact string and matches no tool. `mcp__<server>__.*` matches every tool on that server.
- **`agent_type`.** It appears in hook input inside a sub-agent, or when the session uses `--agent`.
- **Exit 2.** Exit 2 blocks `PreToolUse`, and stderr is shown to Claude.
- **Sub-agent `mcpServers` frontmatter.** Defining a server inline keeps it out of the main conversation. The docs say this word for word.
- **Output limits.** A warning appears above 10,000 tokens. The default limit is 25,000 (`MAX_MCP_OUTPUT_TOKENS`). Above the limit, the result is saved to a file and Claude gets the path.
- **Timeouts.** The default `MCP_TOOL_TIMEOUT` is about 28 hours. A main-conversation call still running after two minutes moves to a background task.
- **Versions.** Claude Code 2.1.289 is the current npm `latest`. `mcp` 2.3.0 is the current PyPI release.
- **SDK v2.** `from mcp.server.fastmcp import FastMCP` raises `ModuleNotFoundError` in v2, which points to `MCPServer`. A `-> dict` return produces no output schema, as the article says.
- **Links.** All five further-reading links return HTTP 200.

## Issues

1. **Minor. Accuracy. Line 225, the `--env` explanation.** The article says "`--env` comes before the server name, because the CLI reads anything right after `--env` as another `KEY=value` pair." The docs' actual rule is narrower. If the server name comes _directly_ after `--env`, it is read as a pair, so put another option such as `--transport stdio` in between. The docs also show `--env` placed _after_ the name (`claude mcp add example --env API_KEY=... -- npx ...`). The article's command is correct; only the stated rule is too strong.
   - **Fix:** "Do not put the server name directly after `--env`. The CLI would read it as another `KEY=value` pair, so another option, here `--transport stdio`, sits between them."
2. **Minor. Spelling consistency. Line 326.** "dataset-catalog server" sits next to "catalogue" in the same paragraph. The series uses British spelling.
   - **Fix:** "dataset-catalogue server".

Optional nuance (not scored): the `only_librarian.py` hook compares `agent_type` exactly. A sub-agent shipped in a plugin may report a plugin-scoped name, and a session started with `--agent librarian` would pass in the main conversation. The article already mentions `--agent`, so this is fine as written.

## Code-check log

Blocks were extracted to `/tmp/mcp-eval-r1/`.

| Block | Language | Content                     | Check                   | Result |
| ----- | -------- | --------------------------- | ----------------------- | ------ |
| 1     | Python   | `make_demo_db.py`           | `python3 -m py_compile` | OK     |
| 2     | bash     | run the DB script           | `bash -n`               | OK     |
| 3     | Python   | `sqlite_readonly_server.py` | `python3 -m py_compile` | OK     |
| 4     | bash     | `claude mcp add ...`        | `bash -n`               | OK     |
| 5     | JSON     | `.mcp.json`                 | `python3 -m json.tool`  | OK     |
| 6     | JSON     | `permissions.allow`         | `python3 -m json.tool`  | OK     |
| 7     | JSON     | `PreToolUse` hook           | `python3 -m json.tool`  | OK     |
| 8     | Python   | `only_librarian.py`         | `python3 -m py_compile` | OK     |

Functional run. Block 1 created `data/demo.db`. Block 3 was started with `uv run --script` (it resolved `mcp` 2.3.0) and driven by a stdio MCP client:

- `list_tables` and `run_select` are listed with `read_only_hint=True` and have an output schema.
- `list_tables` → `{authors: [id, name], books: [id, title, year]}`.
- `SELECT count(*) FROM books` → 500.
- `SELECT * FROM books` → 200 rows, `truncated: true`.
- `DELETE FROM books` → error from the prefix check.
- `WITH x AS (SELECT 1) DELETE FROM books` → `Query failed: not authorized` (the authorizer).
- `SELECT 1; DROP TABLE books` → `Rejected: You can only execute one statement at a time.`
- `SELECT * FROM sqlite_schema` → refused by the authorizer ("access ... is prohibited").
- An infinite `WITH RECURSIVE` query → `Query exceeded 5s and was cancelled.`
- An ordinary JOIN → succeeds.
