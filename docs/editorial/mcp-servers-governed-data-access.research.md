# Research: Part 4 — MCP servers: giving agents governed access to data

Researcher notes for the writer. Checked on 2026-10-04 against the current official docs and a live run.

- Claude Code docs now live at **code.claude.com/docs/en/...**. `docs.claude.com/en/docs/claude-code/*` returns a 301 to there. Cite the code.claude.com URLs.
- Tested with **Claude Code 2.1.289** and the **MCP Python SDK 2.3.0** (the `mcp` package on PyPI).

Primary sources:

- MCP in Claude Code: https://code.claude.com/docs/en/mcp
- Permissions: https://code.claude.com/docs/en/permissions
- Hooks: https://code.claude.com/docs/en/hooks
- Sub-agents: https://code.claude.com/docs/en/sub-agents
- Managed MCP: https://code.claude.com/docs/en/managed-mcp
- MCP Python SDK: https://github.com/modelcontextprotocol/python-sdk (docs at https://py.sdk.modelcontextprotocol.io/, migration guide at https://py.sdk.modelcontextprotocol.io/migration/)

---

## 1. Things that recently changed (writer, read this first)

| Change                                  | Detail                                                                                                                                                                                                                                                                                                             | Source                                                   |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------- |
| **The Python SDK renamed FastMCP**      | In v2, `FastMCP` is now `MCPServer`. Import it with `from mcp.server.mcpserver import MCPServer` (`from mcp.server import MCPServer` also works). **Importing `mcp.server.fastmcp` raises `ModuleNotFoundError`**, and there is no alias. Most blog posts and tutorials still show the v1 import, which now fails. | py.sdk migration guide; python-sdk README                |
| Python SDK v2 run options               | `host` and `port` moved from the constructor to `run()`, e.g. `mcp.run(transport="streamable-http", ...)`. The transport names are still `"stdio"`, `"sse"` and `"streamable-http"`.                                                                                                                               | migration guide                                          |
| Python SDK v2 Context                   | A handler now gets `ctx: Context` injected as a parameter. `ctx.fastmcp` became `ctx.mcp_server`. `ToolError` now lives in `mcp.server.mcpserver.exceptions`.                                                                                                                                                      | migration guide                                          |
| TypeScript SDK v2                       | v2 is split into `@modelcontextprotocol/server` and `@modelcontextprotocol/client` (both 2.3.0 on npm). The old `@modelcontextprotocol/sdk` stays on 1.x (`latest` is 1.32.0). Claude Code's own "v2 runtime" is built on TS SDK 2.0, which adds protocol revision 2026-07-28.                                     | npm registry; mcp docs "MCP client runtimes"             |
| SSE is deprecated                       | "The SSE (Server-Sent Events) transport is deprecated. Use HTTP servers instead, where available." From **v2.1.265**, `claude mcp add --transport http` tries HTTP first and falls back to SSE automatically.                                                                                                      | mcp docs, Option 2                                       |
| `streamable-http` alias                 | In JSON config, `"type": "streamable-http"` is accepted as an alias for `"http"`.                                                                                                                                                                                                                                  | mcp docs, Option 1                                       |
| A `url` with no `type` is an error      | Claude Code reads an entry with no `type` as stdio, so it skips the server and says to add `"type": "http"`. The message changed in v2.1.202.                                                                                                                                                                      | mcp docs, Option 1                                       |
| WebSocket transport                     | `"type": "ws"` is configured through JSON or `add-json` only. `--transport` does not accept `ws`. It supports header auth only, not OAuth.                                                                                                                                                                         | mcp docs, Option 4                                       |
| Workspace trust gates project approvals | From **v2.1.196**, a cloned repo cannot approve its own `.mcp.json` servers. `enableAllProjectMcpServers` or `enabledMcpjsonServers` committed in `.claude/settings.json` is ignored until you trust the folder.                                                                                                   | mcp docs, "Project server approvals and workspace trust" |
| Tool search is on by default            | MCP tool definitions are deferred, so only names and server instructions load at start. `ENABLE_TOOL_SEARCH` controls it.                                                                                                                                                                                          | mcp docs, "Scale with MCP tool search"                   |
| `mcp_server` provenance in hooks        | From **v2.1.274**, PreToolUse input for an MCP tool includes `mcp_server: {name, source}`. The docs say to base trust decisions on `source`, not on the name or the `mcp__` prefix.                                                                                                                                | hooks docs, "PreToolUse input"                           |
| Automatic backgrounding                 | From **v2.1.212**, an MCP call in the main conversation still running after 2 minutes moves to a background task.                                                                                                                                                                                                  | mcp docs                                                 |

**Writer note:** the article must use the v2 Python import (`MCPServer`). If you say "FastMCP", say it was the v1 name.

---

## 2. Adding servers: `claude mcp add`

Source: https://code.claude.com/docs/en/mcp ("Installing MCP servers")

```bash
# Remote HTTP (recommended for remote servers)
claude mcp add --transport http <name> <url>
claude mcp add --transport http secure-api https://api.example.com/mcp \
  --header "Authorization: Bearer your-token"

# Remote SSE (deprecated)
claude mcp add --transport sse <name> <url>

# Local stdio
claude mcp add [options] <name> -- <command> [args...]
```

The `--` rule: "For stdio servers, the `--` (double dash) separates Claude's own options, such as `--transport`, `--env`, and `--scope`, from the command and arguments that run the server. Everything after `--` is passed to the server untouched."

The `--env` gotcha (**verified live**): "`--env` accepts multiple `KEY=value` pairs. If the server name comes directly after `--env`, the CLI reads the name as another pair and rejects it." Running `claude mcp add --transport stdio --scope project --env SQLITE_DB=data/demo.db sqlite-ro -- ...` failed with `Invalid environment variable format: sqlite-ro, environment variables should be added as: -e KEY1=value1 -e KEY2=value2`. **Fix:** put `--env` first, or put another option between `--env` and the name.

Short flags: `-t` (`--transport`), `-s` (`--scope`), `-e` (`--env`), `-H` (`--header`).

Other commands:

- `claude mcp list` shows a status per server: `✔ Connected`, `! Needs authentication`, `✘ Failed to connect`, `⏸ Pending approval (run \`claude\` to approve)`, `⊘ Disabled for this project`.
- `claude mcp get <name>`, `claude mcp remove <name>` (add `--scope <scope>` if needed). Removing a remote server also deletes its stored OAuth tokens.
- `claude mcp add-json <name> '<json>'`
- `claude mcp add-from-claude-desktop`
- `claude mcp serve` runs Claude Code itself as a stdio MCP server.
- `claude mcp reset-project-choices` resets the approvals for `.mcp.json` servers.
- `claude mcp login <name>` and `claude mcp logout <name>` (`--no-browser` is supported).
- In a session: `/mcp` opens the panel, and `/mcp reconnect all` retries failed servers (v2.1.284+).
- Server names may use only letters, numbers, hyphens and underscores. Built-in names are reserved: `workspace`, `claude-in-chrome`, `computer-use`, `Claude Preview` and `Claude Browser`.

---

## 3. Scopes and where config lives

Source: mcp docs, "MCP installation scopes"

| Scope           | Loads in             | Shared                   | Stored in                                                         |
| --------------- | -------------------- | ------------------------ | ----------------------------------------------------------------- |
| local (default) | Current project only | No                       | `~/.claude.json`, under `projects["/path/to/project"].mcpServers` |
| project         | Current project only | Yes, via version control | `.mcp.json` at the project root                                   |
| user            | All your projects    | No                       | `~/.claude.json` (top-level `mcpServers`)                         |

- Precedence when names clash: **local > project > user > plugin servers > claude.ai connectors**. The whole entry from the winning source is used, with no merging. Servers from managed `managedMcpServers` rank above all of these (v2.1.259+).
- Note in the docs: MCP "local scope" lives in `~/.claude.json`. This differs from general local settings in `.claude/settings.local.json`.
- **Project approval:** "For security reasons, Claude Code prompts for approval in interactive sessions before using project-scoped servers from `.mcp.json` files."
- **Important for governance:** in `claude -p` runs, Agent SDK sessions and cloud sessions, Claude Code loads project-scoped servers _without asking_. To keep a server out:
  - add it to `disabledMcpjsonServers`, or
  - use `--setting-sources`, or
  - use `--strict-mcp-config` with `--mcp-config`.
- Enterprise: `managed-mcp.json` gives exclusive control. It lives at `/Library/Application Support/ClaudeCode/managed-mcp.json` on macOS, `/etc/claude-code/managed-mcp.json` on Linux and WSL, and `C:\Program Files\ClaudeCode\managed-mcp.json` on Windows. The managed settings also offer `managedMcpServers`, `allowedMcpServers`, `deniedMcpServers` and `allowManagedMcpServersOnly`. Source: https://code.claude.com/docs/en/managed-mcp

`.mcp.json` shape (docs):

```json
{
  "mcpServers": {
    "shared-server": {
      "type": "http",
      "url": "https://example.com/mcp"
    }
  }
}
```

Fields used in the docs:

- `type` (`stdio` | `http` | `sse` | `ws`)
- `command` and `args` (stdio)
- `url` (remote)
- `env`
- `headers`
- `headersHelper`
- `timeout` (ms, per server)
- `alwaysLoad` (exempts the server from tool-search deferral)
- `oauth` options

---

## 4. Environment variable expansion in `.mcp.json`

Source: mcp docs, "Environment variable expansion in `.mcp.json`"

- Syntax: `${VAR}` and `${VAR:-default}`.
- Expansion works in: `command`, `args`, `env`, `url` and `headers`.
- If a variable is unset and has no default, the config still loads. `claude mcp list` and `/mcp` show a warning, and the literal `${VAR}` text is used.
- Credential variables read as empty in a remote server's `url` and `headers`. This covers `ANTHROPIC_API_KEY`, `ANTHROPIC_AUTH_TOKEN`, `AWS_BEARER_TOKEN_BEDROCK`, `HTTPS_PROXY`, `NPM_TOKEN` and similar names. A `:-default` is ignored for these. To pass one through, copy it into a variable with a name of your own.
- `CLAUDE_PROJECT_DIR` is set **in the spawned stdio server's environment** to the project root, not in Claude Code's own environment. So "referencing it via `${VAR}` expansion in the `command` or `args` of a project-scoped `.mcp.json` entry ... requires a default such as `${CLAUDE_PROJECT_DIR:-.}`." **Verified live:** `${CLAUDE_PROJECT_DIR:-.}/server.py` worked.
- `/mcp`, `claude mcp list` and `claude mcp get` show `${VAR}` by name, never the resolved value. The `/mcp` detail view does this from v2.1.268.

---

## 5. Authentication

Source: mcp docs, "Authenticate with remote MCP servers"

- OAuth 2.0 is for remote HTTP and SSE servers. Run `/mcp`, select the server and follow the browser flow. Or run `claude mcp login <name>` from the shell.
- "Authentication tokens are stored securely and refreshed automatically." On a 401, Claude Code refreshes, reconnects and retries once.
- Options:
  - `--callback-port <port>` for a pre-registered redirect URI (`http://localhost:PORT/callback`)
  - `--client-id` and `--client-secret` for servers without dynamic client registration (or the `MCP_CLIENT_SECRET` env var)
- A static `headers.Authorization` that the server rejects is reported as a failed connection. It does **not** fall back to OAuth.
- `headersHelper` is a script that prints a JSON object of headers to stdout at connect time. It is meant for SSO and short-lived tokens. It can read `CLAUDE_CODE_MCP_SERVER_NAME` and `CLAUDE_CODE_MCP_SERVER_URL`, and it is re-run on 401/403. A `headersHelper` in `.mcp.json` does not run until the folder is trusted. **This maps to production note 5** (short-lived machine-to-machine tokens), although our note describes background refresh, not necessarily this mechanism. Don't claim we used `headersHelper`.
- Non-interactive (`-p`) runs cannot do OAuth. Sign in first in an interactive session.

---

## 6. Tool naming, permissions and hooks

**Naming** (mcp, hooks and permissions docs):

- MCP tools are named `mcp__<server>__<tool>`, e.g. `mcp__github__search_repositories`.
- Plugin servers use `mcp__plugin_<plugin>_<server>__<tool>`.
- claude.ai connectors use `mcp__claude_ai_<server>__<tool>`.
- **Verified live:** our server registered as `sqlite-ro` exposed `mcp__sqlite-ro__list_tables` and `mcp__sqlite-ro__run_select`.

**Permission rules** (https://code.claude.com/docs/en/permissions, "MCP" section):

- `mcp__puppeteer` matches every tool from that server, and so does `mcp__puppeteer__*`.
- `mcp__puppeteer__puppeteer_navigate` matches one tool.
- Deny and ask rules accept `"mcp__*"` (every MCP tool from every server).
- Allow globs work **only after a literal `mcp__<server>__` prefix**. An unanchored allow such as `"mcp__*"` is skipped with a warning.
- Parameter matching on MCP tools (`mcp__x__y(param:value)`) is **not** supported in settings files: "it skips any `mcp__` rule that has parentheses". It works only as a deny via `--disallowedTools`.

**Server-side approval flag:**

- A tool whose `tools/list` entry has `_meta["anthropic/requiresUserInteraction"]: true` prompts on every call. This holds even in `bypassPermissions` mode, and allow rules don't skip it.
- In `dontAsk` mode the call is denied.

**Hook matchers** (hooks docs, "Match MCP tools"):

- Matchers are regex. `mcp__memory__.*` matches every tool from the server, and `mcp__.*__write.*` matches write tools on any server.
- **A matcher such as `mcp__memory` (no `.*`) is compared as an exact string and matches no tool.** This is a pitfall worth stating.

**Hook inputs and exit codes:**

- PreToolUse input includes `tool_name`, `tool_input`, `tool_use_id` and, for MCP tools, `mcp_server` (v2.1.274+).
- Inside a sub-agent, hook input carries `agent_id` and `agent_type`. This is the documented basis for production note 5: a PreToolUse hook can deny a server's tools unless `agent_type` is the permitted sub-agent.
- Exit code 2 blocks the PreToolUse call. Exit code 1 is a _non-blocking_ error, and the action proceeds. Cross-reference part 6.

**Sub-agent scoping** (sub-agents docs, "Scope MCP servers to a subagent"):

- The `mcpServers` frontmatter field takes inline definitions (same schema as `.mcp.json`, YAML) or names of servers already configured.
- "To keep an MCP server out of the main conversation entirely ... define it inline here rather than in `.mcp.json`. The subagent gets the tools; the parent conversation doesn't."
- Plugin sub-agents ignore `mcpServers`.

---

## 7. Output limits, timeouts and context

Source: mcp docs, "MCP output limits and warnings" and the Tips under "Installing"

**Output size:**

- Claude Code warns when an MCP tool's output exceeds **10,000 tokens**. This threshold is fixed.
- The default limit is **25,000 tokens**. Raise it with `MAX_MCP_OUTPUT_TOKENS`, e.g. `MAX_MCP_OUTPUT_TOKENS=50000`.
- An over-limit result with no images is **saved to a file** in the session's `tool-results` directory under `~/.claude/projects/`. The conversation gets a message naming the path, and Claude reads the file when it needs the content.
- A server can raise the limit for a single tool with `_meta["anthropic/maxResultSizeChars"]` in its `tools/list` entry, up to a hard ceiling of 500,000 characters. Image results still count against the token limit.
- This is a good argument for a **server-side row cap with a `truncated` flag**: the agent knows the result is partial instead of getting a file pointer.

**Timeouts:**

- `MCP_TIMEOUT` sets the server startup timeout, e.g. `MCP_TIMEOUT=10000 claude`.
- A per-server `"timeout"` (ms) in `.mcp.json` is a hard wall-clock limit per call and overrides `MCP_TOOL_TIMEOUT`. Values under 1000 are ignored. An unset `MCP_TOOL_TIMEOUT` defaults to about 28 hours.
- `CLAUDE_CODE_MCP_TOOL_IDLE_TIMEOUT` sets the idle abort: 5 minutes by default for remote servers and 30 minutes for stdio.
- Remote servers also have a per-request timer, set to at least 60 s.
- **Takeaway:** enforce your own query timeout inside the server. The client-side defaults are long.

**Tool search and context:**

- Only tool names and server instructions load at the start of a session.
- Tool descriptions and server instructions are truncated at 2,048 characters by default (`CLAUDE_CODE_MAX_MCP_DESCRIPTION_LENGTH`, v2.1.280+).
- `alwaysLoad: true` on a server, or `_meta["anthropic/alwaysLoad"]` on a tool, skips deferral.
- **Writer angle:** the server `instructions` text now matters, because it is what Claude sees before searching.

**Reconnection and dynamic tools:**

- Claude Code reconnects a remote server automatically, with up to 5 backoff attempts. **It does not reconnect a stdio server automatically.**
- On a `list_changed` notification, Claude Code refetches tools in an interactive session.

---

## 8. Resources and prompts

Source: mcp docs, "Use MCP resources" and "Use MCP prompts as commands"

**Resources:**

- Type `@` to see the resources from connected servers.
- The reference format is `@server:protocol://resource/path`, e.g. `@github:issue://123` or `@postgres:schema://users`. (A WebFetch summary I got first claimed `@mcp__server__resource`. That is **wrong**. Use the docs' form.)
- Claude Code also gives Claude tools to list and read resources when a server supports them.

**Prompts:**

- Server prompts show up as commands, listed as `/servername:promptname (MCP)`. Typing `/mcp__servername__promptname` also runs them.
- Arguments are space-separated.

**Elicitation:** servers can ask the user for input mid-task, in form mode or URL mode.

---

## 9. Building a server: Python SDK v2 basics

Source: python-sdk README and the migration guide

- Install with `uv add "mcp[cli]"` or `pip install "mcp[cli]"`. Requires Python 3.10+.
- `MCPServer("Name", instructions=...)`. Add tools with `@mcp.tool()` and resources with `@mcp.resource("scheme://{param}")`.
- Type hints _are_ the input schema. "no JSON Schema (`a: int, b: int` _is_ the schema)".
- `mcp.run()` defaults to stdio. Use `mcp.run(transport="streamable-http")` for HTTP.
- `uv run mcp dev server.py` opens the MCP Inspector.
- **Structured output (verified):** a return type of `TypedDict` (or a Pydantic model) produces an `outputSchema` and `structuredContent`. A plain `-> dict` return gave **no** structured content and **no** output schema in SDK 2.3.0.
- `@mcp.tool(annotations=ToolAnnotations(readOnlyHint=True, destructiveHint=False, idempotentHint=True))` publishes behaviour hints. **These are hints for the client, not enforcement.** The server must enforce read-only itself.
- Raise `ToolError(...)` to return an error result. **Verified:** the client sees `is_error=True` with the message `Error executing tool run_select: ...`.
- stdio servers must log to **stderr**. stdout carries the protocol. This is a general stdio rule; the SDK README doesn't spell it out.

---

## 10. Proposed working example (verified end to end)

**What it is:** a tiny read-only MCP server over one local SQLite file. It has two tools:

- `list_tables`
- `run_select`

The project in the example is a neutral `books`/`authors` demo database, deliberately unlike the course's workout tracker.

**Defences, in layers.** This is the point of the article: _read-only by construction, not by prompt_.

1. **A cheap prefix check.** Only `SELECT` or `WITH` is accepted. This is a fast, friendly error, not the real guard.
2. **Single statement.** Python's `sqlite3` `execute()` refuses more than one statement and raises `ProgrammingError: You can only execute one statement at a time.`
3. **Read-only file handle.** The file is opened with `file:...?mode=ro` and `uri=True`.
4. **A SQLite authorizer.** It allows only SELECT, READ, FUNCTION and RECURSIVE actions. Everything else is denied, and so is reading `sqlite_*` internal tables. This is SQLite's version of production note 2's query-plan inspection: the database engine itself decides what the statement touches.
   - **Key teaching moment (verified):** `WITH x AS (SELECT 1) DELETE FROM books` _passes the prefix check_ but is stopped by the authorizer (`not authorized`). A "starts with SELECT/WITH" check alone is not enough.
5. **Row cap.** The server fetches `MAX_ROWS + 1` rows and returns at most 200, with `truncated: true` when more existed.
6. **Timeout.** `set_progress_handler` aborts the query after 5 s. **Verified:** an infinite `WITH RECURSIVE` query was cancelled in about 5 s.

### Code: `tools/sqlite_readonly_server.py`

PEP 723 inline dependencies, so `uv run --script` installs the SDK automatically. In the run I tested, the file sat at the project root. The article can use `tools/` if the paths change to match.

```python
# /// script
# requires-python = ">=3.10"
# dependencies = ["mcp>=2.3,<3"]
# ///
"""A tiny read-only MCP server over one local SQLite file.

Two tools: list_tables and run_select. Read-only by construction:
the file is opened read-only, a SQLite authorizer allows only reads,
one statement per call, a row cap that reports truncation, and a timeout.
"""

import logging
import os
import sqlite3
import sys
import time
from contextlib import closing
from pathlib import Path
from typing import Any, TypedDict

from mcp.server.mcpserver import MCPServer
from mcp.server.mcpserver.exceptions import ToolError
from mcp.types import ToolAnnotations

# stdio servers must never print to stdout: stdout carries the protocol.
logging.basicConfig(stream=sys.stderr, level=logging.INFO)
log = logging.getLogger("sqlite-readonly")


class TablesResult(TypedDict):
    tables: dict[str, list[str]]


class SelectResult(TypedDict):
    columns: list[str]
    rows: list[list[Any]]
    row_count: int
    truncated: bool


PROJECT_DIR = Path(os.environ.get("CLAUDE_PROJECT_DIR", "."))
DB_PATH = PROJECT_DIR / os.environ.get("SQLITE_DB", "data/demo.db")
MAX_ROWS = 200
TIMEOUT_SECONDS = 5.0

# Actions a SELECT legitimately needs. Everything else is denied.
_ALLOWED_ACTIONS = {
    sqlite3.SQLITE_SELECT,
    sqlite3.SQLITE_READ,
    sqlite3.SQLITE_FUNCTION,
    getattr(sqlite3, "SQLITE_RECURSIVE", 33),  # WITH RECURSIVE
}


def _authorizer(action, arg1, arg2, db_name, trigger):
    if action not in _ALLOWED_ACTIONS:
        return sqlite3.SQLITE_DENY
    if action == sqlite3.SQLITE_READ and arg1 and arg1.startswith("sqlite_"):
        return sqlite3.SQLITE_DENY  # keep internal tables out
    return sqlite3.SQLITE_OK


def _connect(deadline: float | None = None) -> sqlite3.Connection:
    if not DB_PATH.exists():
        raise ToolError(f"Database not found: {DB_PATH}")
    conn = sqlite3.connect(f"file:{DB_PATH}?mode=ro", uri=True)
    if deadline is not None:
        # Called every N SQLite VM steps; a non-zero return aborts the query.
        conn.set_progress_handler(lambda: int(time.monotonic() > deadline), 10_000)
    return conn


mcp = MCPServer(
    "sqlite-readonly",
    instructions="Read-only access to the project's demo SQLite database. "
    "Call list_tables first, then run_select with one SELECT statement.",
)

READ_ONLY = ToolAnnotations(readOnlyHint=True, destructiveHint=False, idempotentHint=True)


@mcp.tool(annotations=READ_ONLY)
def list_tables() -> TablesResult:
    """List user tables and their columns in the demo database."""
    with closing(_connect()) as conn:  # sqlite3's own 'with' does not close
        names = [r[0] for r in conn.execute(
            "SELECT name FROM sqlite_schema WHERE type = 'table' "
            "AND name NOT LIKE 'sqlite_%' ORDER BY name")]
        tables = {
            n: [c[1] for c in conn.execute("SELECT * FROM pragma_table_info(?)", (n,))]
            for n in names
        }
    return {"tables": tables}


@mcp.tool(annotations=READ_ONLY)
def run_select(sql: str) -> SelectResult:
    """Run ONE read-only SELECT (or WITH ... SELECT) statement.

    Returns at most 200 rows; 'truncated' is true when more rows existed.
    Queries are cancelled after 5 seconds.
    """
    statement = sql.strip().rstrip(";").strip()
    if not statement.lower().startswith(("select", "with")):
        raise ToolError("Only SELECT or WITH ... SELECT statements are allowed.")

    deadline = time.monotonic() + TIMEOUT_SECONDS
    conn = _connect(deadline)
    try:
        conn.set_authorizer(_authorizer)  # set after setup so only the user query is checked
        cur = conn.execute(statement)  # sqlite3 refuses more than one statement here
        rows = cur.fetchmany(MAX_ROWS + 1)
    except sqlite3.ProgrammingError as e:  # e.g. "You can only execute one statement at a time."
        raise ToolError(f"Rejected: {e}") from e
    except sqlite3.DatabaseError as e:  # not authorized, interrupted (timeout), syntax errors
        if "interrupted" in str(e):
            raise ToolError(f"Query exceeded {TIMEOUT_SECONDS:.0f}s and was cancelled.") from e
        raise ToolError(f"Query failed: {e}") from e
    finally:
        conn.close()

    truncated = len(rows) > MAX_ROWS
    rows = rows[:MAX_ROWS]
    log.info("run_select returned %d rows (truncated=%s)", len(rows), truncated)
    return {
        "columns": [d[0] for d in cur.description or []],
        "rows": [list(r) for r in rows],
        "row_count": len(rows),
        "truncated": truncated,
    }


if __name__ == "__main__":
    mcp.run()  # stdio by default
```

### Register it at project scope

```bash
claude mcp add --env SQLITE_DB=data/demo.db --transport stdio --scope project sqlite-ro \
  -- uv run --script '${CLAUDE_PROJECT_DIR:-.}/tools/sqlite_readonly_server.py'
```

- Quote the `${...}` in single quotes so your shell does not expand it.
- `--env` comes before the name (see §2).

**Verified result:** `claude mcp add` printed `Added stdio MCP server sqlite-ro ... to project config` and wrote this `.mcp.json` (shown here with the `tools/` path):

```json
{
  "mcpServers": {
    "sqlite-ro": {
      "type": "stdio",
      "command": "uv",
      "args": [
        "run",
        "--script",
        "${CLAUDE_PROJECT_DIR:-.}/tools/sqlite_readonly_server.py"
      ],
      "env": {
        "SQLITE_DB": "data/demo.db"
      }
    }
  }
}
```

`claude mcp get sqlite-ro` then showed `Scope: Project config (shared via .mcp.json)` and `Status: ⏸ Pending approval (run \`claude\` to approve)`.

### Optional settings snippet: pre-allow the two read tools

For `.claude/settings.json`, following the permissions docs syntax:

```json
{
  "permissions": {
    "allow": ["mcp__sqlite-ro__list_tables", "mcp__sqlite-ro__run_select"]
  }
}
```

### Test evidence

**Harness:** the SDK `Client` over stdio, SDK 2.3.0, Python 3.12, SQLite 3.43.2.

| Input                                                  | Result                                                               |
| ------------------------------------------------------ | -------------------------------------------------------------------- |
| `list_tables`                                          | `{"tables":{"authors":["id","name"],"books":["id","title","year"]}}` |
| `SELECT id, title FROM books ORDER BY id LIMIT 3;`     | 3 rows, `truncated:false` (the trailing `;` is fine)                 |
| `SELECT * FROM books` (500 rows)                       | `row_count:200, truncated:true`                                      |
| `WITH x AS (SELECT 1) DELETE FROM books`               | error: `Query failed: not authorized`                                |
| `SELECT 1; DROP TABLE books`                           | error: `Rejected: You can only execute one statement at a time.`     |
| `DELETE FROM books`                                    | error: `Only SELECT or WITH ... SELECT statements are allowed.`      |
| `SELECT * FROM sqlite_schema`                          | error: `access to sqlite_master.type is prohibited`                  |
| infinite `WITH RECURSIVE` count                        | error after about 5 s: `Query exceeded 5s and was cancelled.`        |
| `WITH a AS (SELECT * FROM authors) SELECT name FROM a` | 2 rows, OK                                                           |

**End to end in Claude Code 2.1.289:** `claude -p ... --allowedTools "mcp__sqlite-ro__list_tables" "mcp__sqlite-ro__run_select"` was run in the project. Per the docs, `-p` loads project servers without the approval prompt. It called both tools and returned `{"columns":["n"],"rows":[[500]],"row_count":1,"truncated":false}` for `SELECT count(*) AS n FROM books`.

To make the demo DB:

```python
import sqlite3
c = sqlite3.connect("data/demo.db")
c.execute("create table books(id integer primary key, title text, year int)")
c.executemany("insert into books(title, year) values (?, ?)",
              [(f"Book {i}", 1900 + i % 120) for i in range(500)])
c.execute("create table authors(id integer primary key, name text)")
c.execute("insert into authors(name) values ('A'), ('B')")
c.commit()
```

### Honest limits of the example (put these in Pitfalls)

- The prefix check rejects a query that starts with a comment, and the single-statement check is SQLite's own. Neither is a SQL parser. **The authorizer and the read-only handle are the real guards.**
- The authorizer's allowed set is SQLite-specific. Postgres needs a different approach:
  - a read-only role
  - `SET TRANSACTION READ ONLY` with `statement_timeout`
  - optionally an `EXPLAIN` check of the tables a query touches, which is the production pattern in note 2
- `ToolAnnotations(readOnlyHint=True)` informs clients but enforces nothing.
- Stdio servers are not auto-reconnected. If the process dies, reconnect from `/mcp`.
- The 200-row cap and 5 s timeout are example values. They are not production numbers.

---

## 11. Anonymised production notes (as given; do not add to them)

Do not add numbers. Do not name the client, vendors, products or repos. The only allowed client descriptor is "a global hedge fund with ~$1B AUM". The other approved claims are "12+ sector forecasting models" and a "15+ person team", if relevant.

1. **One governed data service.** We run one authenticated, self-hosted MCP data service, so every analyst agent uses the same governed tools instead of ad-hoc connectors. Each request carries a signed token that identifies the user and tenant, and the token is checked before any tool runs.
2. **Read-only SQL by construction.**
   - only a single SELECT or WITH statement
   - a read-only transaction with a timeout
   - a row cap that flags truncation
   - an inspection of the query plan that rejects any table outside the schema that tool may touch

   _The SQLite example mirrors this shape at small scale._

3. **Optional tool families.** They register only when their credential exists, so a missing vendor key removes a few tools instead of crashing the server.
4. **From in-process to HTTP.** We moved from in-process tool servers to HTTP after concurrent sessions contended for shared state. Each session is now isolated, with a flag to roll back.
5. **A remote third-party server.** A third-party financial-data provider is consumed as a remote MCP server. Its short-lived machine-to-machine tokens are refreshed in the background. Only one dedicated "librarian" sub-agent may call its tools, and a pre-tool hook enforces this. _Docs-grounded mechanism: a PreToolUse hook matching `mcp__<server>__.*`, checking `agent_type`, exiting 2 or returning a deny. Alternative: define the server inline in that sub-agent's `mcpServers` frontmatter so the main conversation never sees it._
6. **A dataset-catalog server.** It lets agents search, describe, query and chart datasets, and list stale or missing coverage. Catalog edits apply without a restart. _Docs angle: `list_changed` notifications make Claude Code refetch tools in interactive sessions. Don't claim this is how we did it._
7. **CI checks.** CI checks that no tool description promises something the server can't do, and that two copies of a server haven't drifted. They once did, silently.

---

## 12. Suggested pitfalls list (all docs-grounded)

- Using the v1 `FastMCP` import on SDK v2 gives `ModuleNotFoundError`.
- Putting the server name right after `--env` makes the CLI reject it.
- Forgetting `--` before a stdio command means its flags get parsed as Claude's.
- A JSON entry with `url` but no `type` is read as stdio and skipped.
- `${CLAUDE_PROJECT_DIR}` in `.mcp.json` `command`/`args` needs `:-.`.
- `${ANTHROPIC_API_KEY}`-style credential variables read as empty in remote `url`/`headers`.
- A hook matcher `mcp__server` without `.*` matches nothing.
- An allow glob `mcp__*` is ignored. Deny `mcp__*` works.
- `mcp__x__y(param:value)` rules in settings files are skipped.
- `claude -p` and the SDK load `.mcp.json` servers without approval.
- Results over 25k tokens are moved to a file. Cap rows in the server and say when you did.
- Logging to stdout from a stdio server corrupts the protocol.
- Read-only annotations are hints. Enforce in the server.

## 13. Originality check

The example uses SQLite books/authors, Python SDK v2 and stdio at project scope. None of these overlap with the course's project (a workout tracker), its auth example or its hosted-Postgres MCP seed-data example. The topic overlaps only at the level of "MCP exists" in the topic map.

---

## Editor's notes (2026-10-04)

- Tightened the opening hook (three shorter paragraphs, same argument; dropped "data vendor" from the intro list).
- Renamed "The idea" to "The idea: a server is a policy boundary" for scannability. Template order unchanged: idea, working example, production, pitfalls, checklist, further reading.
- Removed the non-Anthropic `uv` hyperlink; `uv` is now defined in plain text. All remaining links are code.claude.com docs.
- Production section: cut filler ("security theatre") and softened two unsupported effect claims ("most of my design effort", "cuts a lot of guessing"). No facts or numbers added.
- Pitfall 6: corrected `--strict-mcp-config` to say it is used with an explicit `--mcp-config` (per section 3). Split stdout logging into its own pitfall 7.
- Meta summary: names MCP servers in plain words for junior readers.
- Code blocks unchanged; checked against sections 4, 6, 7 and 10. Prose is about 2,200 words (code excluded). Blocklist check: no hits.
