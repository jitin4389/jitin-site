Connecting a coding agent to a real database now takes one command. Within minutes it finds the tables, writes sensible SQL and answers questions. The question nobody asks is what that connection allows. Often the honest answer is "everything the user can do", writes included. Nothing has gone wrong yet. Nothing stops it going wrong, either.

That is the usual start with MCP. You add a server for your database or issue tracker, and the agent can reach things it could not reach before. It feels like plumbing: connect a pipe, and data flows.

I now see it differently. An MCP server is the one place where you decide what an agent may do with your data, and where that decision can stick. This part shows how to design servers that way: the safe path is the only path, the rules live in code rather than prompts, and every tool description is a promise you can keep.

## The idea: a server is a policy boundary

**MCP (Model Context Protocol)** is an open standard for connecting AI applications to outside tools and data. An **MCP server** is a small program that offers **tools** (actions the agent can call, such as `run_select`), and optionally **resources** (data the agent can read) and **prompts** (reusable instructions). Claude Code is the **client**. It starts or connects to the server, lists its tools, and lets Claude call them.

Inside Claude Code, every MCP tool gets a name of the form `mcp__<server>__<tool>`. A server registered as `sqlite-ro` with a tool called `run_select` shows up as `mcp__sqlite-ro__run_select`. That name is what you use in permission rules and hook matchers, so it matters more than it looks.

Here is the mental model I use. There are three layers, and each one answers a different question.

| Layer                     | Question it answers                                   | Where it lives                                          |
| ------------------------- | ----------------------------------------------------- | ------------------------------------------------------- |
| The server                | What is possible at all?                              | Your server code                                        |
| Claude Code configuration | Who can reach this server, and does it need approval? | Scopes, `.mcp.json`, permission rules, managed settings |
| Hooks                     | Should this particular call go ahead right now?       | `PreToolUse` hooks in settings                          |

The prompt and CLAUDE.md are not on this list. They are useful for guidance, such as "call `list_tables` before you write SQL". They are not a control. If the server offers a `run_sql` tool that can drop a table, a sentence saying "never drop tables" is a hope, not a rule.

So the first design principle is: **make the dangerous thing impossible, not discouraged.** Do not expose a general SQL tool and ask the agent to behave. Expose a read-only tool that cannot write, however it is called.

The second principle is: **the tool description is a contract the agent will believe.** Claude decides which tool to call, and how, mostly from the tool's name, its description and its input schema. If the description says "returns all matching rows", Claude will treat a partial result as complete. If it says "read-only" and the tool is not, Claude will use it carelessly, because you told it that it was safe. Write descriptions the way you would write an API contract: accurate, specific, and honest about limits.

A recent change makes this matter more. Claude Code now uses **tool search** by default. At the start of a session, only tool names and each server's `instructions` text are loaded; full tool definitions are fetched when Claude needs them. A clear server name and a short, accurate `instructions` string are what Claude sees first.

## A working example

Let's build a small, read-only MCP server over a local SQLite file, register it for a project, and try to break it. It has two tools: `list_tables` and `run_select`. I tested it with Claude Code 2.1.289 and version 2.3.0 of the official MCP Python SDK.

A note before you copy anything. In version 2 of the Python SDK, the class that most tutorials call `FastMCP` was renamed `MCPServer`. The old import, `from mcp.server.fastmcp import FastMCP`, now fails with `ModuleNotFoundError`. The code below uses the new name.

You need Python 3.10 or later and `uv` (a Python package runner), which installs the SDK for you from the script header.

### Step 1: a demo database

Create `tools/make_demo_db.py` in an empty project folder:

```python
import sqlite3
from pathlib import Path

Path("data").mkdir(exist_ok=True)
c = sqlite3.connect("data/demo.db")
c.execute("create table books(id integer primary key, title text, year int)")
c.executemany(
    "insert into books(title, year) values (?, ?)",
    [(f"Book {i}", 1900 + i % 120) for i in range(500)],
)
c.execute("create table authors(id integer primary key, name text)")
c.execute("insert into authors(name) values ('A'), ('B')")
c.commit()
c.close()
```

Run it once from the project root:

```bash
python3 tools/make_demo_db.py
```

### Step 2: the server

Create `tools/sqlite_readonly_server.py`. The comment block at the top is inline script metadata, so `uv run --script` installs the SDK on first run.

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

The defences are layered, from weakest to strongest:

1. **A prefix check.** Anything not starting with `SELECT` or `WITH` gets a fast, friendly error. This is a courtesy, not a guard.
2. **One statement per call.** Python's `sqlite3` refuses to run more than one statement in `execute()`, so `SELECT 1; DROP TABLE books` fails.
3. **A read-only file handle.** The database is opened with `mode=ro`. Even a bug elsewhere cannot write.
4. **An authorizer.** SQLite calls `_authorizer` for every action a statement would take. Only reads are allowed, and SQLite's internal tables are hidden. This is the real guard, because the database engine itself decides what the statement touches.
5. **A row cap.** The server fetches one row more than it returns, so it can tell Claude honestly when the result is partial.
6. **A timeout.** A progress handler cancels any query that runs past five seconds.

Note the return types. Because they are `TypedDict`s, the SDK publishes an output schema and returns structured content. In my tests, a plain `-> dict` return produced neither.

### Step 3: register it for the project

From the project root:

```bash
claude mcp add --env SQLITE_DB=data/demo.db --transport stdio --scope project sqlite-ro \
  -- uv run --script '${CLAUDE_PROJECT_DIR:-.}/tools/sqlite_readonly_server.py'
```

Three details matter here. Don't put the server name directly after `--env`: the CLI would read it as another `KEY=value` pair, so another option (here `--transport stdio`) sits between them. The `--` separates Claude Code's options from the command that starts the server. And the single quotes stop your shell expanding `${CLAUDE_PROJECT_DIR:-.}`; Claude Code expands it later.

`--scope project` writes a `.mcp.json` file at the project root that you can commit:

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

The `:-.` default is needed. `CLAUDE_PROJECT_DIR` is set in the server's environment, not in Claude Code's own, so without a default the path would not resolve.

Optionally, pre-approve the two read tools in `.claude/settings.json` so you are not asked on every call:

```json
{
  "permissions": {
    "allow": ["mcp__sqlite-ro__list_tables", "mcp__sqlite-ro__run_select"]
  }
}
```

### Step 4: try to break it

Start `claude` in the project. It will ask you to approve the project server the first time. Run `/mcp` to check that `sqlite-ro` is connected, then ask:

> How many books are there? Then delete the authors table.

Claude should count 500 books and then explain that it cannot delete anything. To see the layers at work, ask Claude to pass these queries to `run_select` exactly as written:

| Query                                    | What happens                                                              |
| ---------------------------------------- | ------------------------------------------------------------------------- |
| `SELECT * FROM books`                    | 200 rows, `truncated: true`                                               |
| `DELETE FROM books`                      | Rejected by the prefix check                                              |
| `WITH x AS (SELECT 1) DELETE FROM books` | Passes the prefix check, then blocked by the authorizer: `not authorized` |
| `SELECT 1; DROP TABLE books`             | Rejected: only one statement at a time                                    |
| `SELECT * FROM sqlite_schema`            | Blocked by the authorizer                                                 |

The third row is the lesson. A query that "starts with WITH" can still delete data. A string check alone would have let it through.

## How I use this in production

My client work is for a global hedge fund with ~$1B AUM, where analyst agents work alongside 12+ sector forecasting models. Data access is where the risk sits, so it gets much of my design attention. What follows are the lessons, not the specifics.

**One governed service beats many connectors.** We run a single authenticated, self-hosted MCP data service. Every analyst agent uses the same governed tools instead of its own ad-hoc connector. Each request carries a signed token that identifies the user and the tenant, and the server checks it before any tool runs. The real benefit is one place to reason about, review and fix.

**Read-only by construction, at full size.** The production SQL tool has the same shape as the SQLite example: a single SELECT or WITH statement, a read-only transaction with a timeout, and a row cap that flags truncation. Instead of an authorizer, it inspects the query plan and rejects any query that touches a table outside the schema that tool is allowed to read. The principle carries over: let the database tell you what the query does, rather than guessing from the text.

**Missing credentials should remove tools, not crash the server.** Some tool families depend on third-party data keys. They register only when their credential exists. If a key is missing, a few tools disappear and everything else keeps working. An agent cannot misuse a tool it cannot see.

**Isolation matters once more than one session is running.** We started with in-process tool servers. When concurrent sessions began to contend for shared state, we moved to HTTP, with each session isolated and a flag to roll back to the old path. If you expect several agents at once, plan for this from the start.

**Restrict sensitive servers to one agent, and enforce it in a hook.** We consume a third-party financial-data provider as a remote MCP server, with short-lived machine-to-machine tokens refreshed in the background. Only one dedicated "librarian" sub-agent may call its tools. A pre-tool hook enforces that; the prompt only explains it. Here is the shape of such a hook with a made-up server name, `market-data`. In `.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "mcp__market-data__.*",
        "hooks": [
          {
            "type": "command",
            "command": "python3 \"$CLAUDE_PROJECT_DIR/.claude/hooks/only_librarian.py\""
          }
        ]
      }
    ]
  }
}
```

And `.claude/hooks/only_librarian.py`:

```python
import json
import sys

event = json.load(sys.stdin)
if event.get("agent_type") != "librarian":
    print("Only the librarian sub-agent may call market-data tools. "
          "Delegate the request to it.", file=sys.stderr)
    sys.exit(2)  # exit code 2 blocks the call; stderr goes back to Claude
sys.exit(0)
```

Claude Code includes `agent_type` in the hook input when the call comes from a sub-agent (or a session started with `--agent`), so a call from the main conversation is blocked. Note the `.*` in the matcher: `mcp__market-data` on its own matches nothing. If you want the main conversation never to see the tools at all, the sub-agents docs offer another route: define the server inline in that sub-agent's `mcpServers` frontmatter instead of in `.mcp.json`.

**Make the catalogue a tool, too.** A separate dataset-catalogue server lets agents search, describe, query and chart datasets, and list stale or missing coverage. Catalogue edits apply without a restart. Agents can ask "what data do we have?" before they ask for the data, instead of guessing.

**Test the contract, not just the code.** Our CI checks that no tool description promises something the server cannot do, and that two copies of the same server have not drifted apart. They once had, silently. Because the agent believes the description, a stale description is a bug.

## Pitfalls

1. **Trusting annotations or prompts to enforce anything.** `readOnlyHint=True` tells the client what to expect; it blocks nothing. The same goes for "never write" in CLAUDE.md. Enforce in the server, then back it with a permission rule or hook.
2. **Treating a string check as a SQL guard.** A prefix check misses `WITH ... DELETE`, and it also rejects a harmless query that starts with a comment. Use the engine's own controls: a read-only connection and an authorizer in SQLite, or a read-only role, `SET TRANSACTION READ ONLY` and `statement_timeout` in Postgres, optionally with a query-plan check.
3. **Returning unbounded results.** Claude Code warns when tool output passes 10,000 tokens. Above the limit, 25,000 tokens by default, it saves the result to a file and hands Claude a path. Cap rows in the server and say so in a `truncated` field, so Claude knows the answer is partial.
4. **Relying on client timeouts.** Claude Code's default tool timeouts are long, and a call still running after two minutes moves to the background. Put a query timeout inside the server.
5. **Writing hook matchers and rules that match nothing.** A hook matcher of `mcp__server` without `.*` matches no tool. An allow rule of `mcp__*` is ignored with a warning; only deny and ask rules accept it. Rules with parameters, such as `mcp__x__y(param:value)`, are skipped in settings files.
6. **Assuming `.mcp.json` always asks for approval.** It does in interactive sessions. Under `claude -p`, the Agent SDK and cloud sessions, project servers load without asking. For scripted runs, keep unwanted servers out with `disabledMcpjsonServers`, or pass `--strict-mcp-config` with an explicit `--mcp-config`.
7. **Printing to stdout from a stdio server.** stdout carries the protocol, so a stray `print` corrupts it. Log to stderr only.

## Checklist

- [ ] List every MCP server your team uses and mark which ones can write.
- [ ] For each data server, confirm the credential it uses is read-only at the source.
- [ ] Replace any general "run SQL" tool with a narrow tool that is read-only by construction.
- [ ] Add a row cap with a `truncated` flag and a server-side timeout.
- [ ] Reread every tool description and remove any promise the code does not keep.
- [ ] Add a `PreToolUse` hook (matcher ending in `.*`) for any server only one agent should call.
- [ ] Check how your CI and scripted runs load `.mcp.json`, since they skip the approval prompt.

## Further reading

- [Connect Claude Code to tools via MCP](https://code.claude.com/docs/en/mcp)
- [Configure permissions](https://code.claude.com/docs/en/permissions)
- [Hooks reference](https://code.claude.com/docs/en/hooks)
- [Create custom subagents](https://code.claude.com/docs/en/sub-agents)
- [Managed MCP configuration](https://code.claude.com/docs/en/managed-mcp)
