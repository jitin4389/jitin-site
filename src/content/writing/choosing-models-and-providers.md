Most teams pick a model the way they pick an editor theme. Someone tries the newest one, likes how it writes, and it becomes the default for everything. A few weeks later the bill has jumped, or a cheaper model has quietly taken over work that needed the strong one. Nobody can say whether the change helped.

I have made both mistakes. Each time, the decision rested on how the output _felt_, not on anything I had measured.

This part treats model and provider choice as an engineering decision. Route work to a model by task. Write the routing down where the team can see it. Change it only when your own evals say the change is safe. Local and alternative models go through the same process: candidates you test, not shortcuts you assume.

## The idea: three decisions, not one

Three separate decisions hide inside "which model do we use". Pulling them apart is most of the work.

1. **Which kind of model does this task need?** A short summary of a log file and a plan for a ten-file refactor are different jobs. One needs speed and low cost. The other needs careful reasoning, because a wrong plan is expensive to undo.
2. **Where do the models come from?** The Anthropic API, a cloud provider such as Amazon Bedrock or Google Cloud's Agent Platform (formerly Vertex AI), or an **LLM gateway**: a proxy your organisation runs between developers and the model provider, which holds the credentials and tracks usage.
3. **How do you know a change is safe?** By running the same small set of test cases (an **eval suite**) against the old and new set-up, and comparing results and cost.

I think of it as a kitchen. The menu says which dish each table gets. The supplier says where the ingredients come from. The tasting before service says whether a new supplier is good enough. You can change suppliers without reprinting the menu, but you never skip the tasting.

### Decision 1: route by task

Claude Code gives you five dials.

- **Aliases.** `haiku`, `sonnet` and `opus` name a model family rather than a version. Anthropic's own cost guidance says Sonnet handles most coding tasks well and costs less than Opus, that Opus is for complex architectural decisions or multi-step reasoning, and that simple subagent tasks can use `haiku`. What each alias points to changes over time and differs by provider, so I avoid hard-coding versions in shared files.
- **The session model.** Set with `/model` in a session, `claude --model` at startup, the `ANTHROPIC_MODEL` environment variable, or the `model` key in a settings file. That is also the order of priority: `/model` and `--model` beat the variable, and the variable beats the settings file.
- **Per-subagent models.** A **subagent** is a helper agent with its own instructions, tools and context, defined in a Markdown file. Its `model` field can be an alias, a full model ID, or `inherit`. This is the cleanest way to say "summaries go to the fast model, reviews go to the strong one".
- **`opusplan`.** A special alias that uses Opus in plan mode and Sonnet when it starts making changes. Each switch in or out of plan mode is a model switch, so it starts a fresh cache.
- **Effort.** A second dial beside the model, set with `/effort` or `--effort`. Lowering effort on simple work cuts thinking cost without changing the model.

One rule holds all of this together: **switching model mid-session is not free.** Claude Code relies on **prompt caching**, where the provider reuses the unchanged start of each request instead of processing it again. Each model has its own cache, so after a switch the whole conversation is processed again at full input price. The docs' advice is to pick your model and effort level at the top of a session. To mix models, use subagents: each one has its own context and cache anyway.

### Decision 2: where models come from

The provider changes more than the bill.

- **On a cloud provider**, aliases follow Claude Code's built-in defaults unless you pin them. The docs warn that these can lag the newest release, and that an unpinned deployment moved to Opus as the default at one point, billed at the Opus rate. Pin each alias with `ANTHROPIC_DEFAULT_OPUS_MODEL`, `ANTHROPIC_DEFAULT_SONNET_MODEL` and `ANTHROPIC_DEFAULT_HAIKU_MODEL`. Some features also differ; for example, the web search tool is not available on Bedrock.
- **Through a gateway**, you get central credentials, per-team usage tracking, budgets and audit logs. The cost, in the docs' words, is that "the gateway becomes infrastructure your organization operates". It must forward Claude Code's headers and request fields unchanged, including the markers that switch on prompt caching. A gateway that strips those markers still returns success, and then every turn bills the whole conversation as uncached input.

The useful split is this: **the project settings file says which kind of model each task gets; a personal or managed settings file says where those models come from.** Changing provider then touches only the second file.

### Decision 3: where local and open models fit

People ask about running a local or open model behind Claude Code, to save money or keep code on their machine. Anthropic's gateway documentation says it "doesn't support routing Claude Code to non-Claude models through any gateway". Claude Code's tool use, caching and context handling are built and tested against Claude models.

That does not make the idea wrong to explore. It makes a local model an unsupported experiment that faces the same eval suite as anything else. If it passes your hard cases at a cost and speed you accept, you have evidence. If it only passes the easy ones, you have learned that cheaply.

## A working example

Here is a small project: a routing table, project settings, two subagents, and a script that runs the same eval cases against two configurations. Everything except the gateway snippet was tested on Claude Code v2.1.289 on macOS.

### Step 1: write the routing table down

Put this in your repo, for example in `docs/model-routing.md`. It is for people, not for the tool.

| Task                                          | Model                          | Why                                           |
| --------------------------------------------- | ------------------------------ | --------------------------------------------- |
| Summarise a diff, log or file                 | `haiku`, in a subagent         | Low risk, high volume, easy to check          |
| Routine edits, renames, test fixes            | `sonnet`, main session         | A sensible default for most coding            |
| Planning a multi-file change                  | `opus`, or `opusplan`          | A wrong plan is expensive to undo             |
| Reviewing a plan or diff before you accept it | `opus`, in a reviewer subagent | Catching a wrong assumption is worth the cost |
| Judge in an eval suite                        | A fast model, then spot-check  | Many calls; first confirm it agrees with you  |
| Trying a new model or provider                | Whatever you are testing       | Behind the eval suite, never on faith         |

### Step 2: encode it in project settings

Create `.claude/settings.json`. It is committed, so it holds no secrets.

```json
{
  "model": "sonnet",
  "fallbackModel": ["haiku"],
  "env": {
    "CLAUDE_CODE_SUBAGENT_MODEL": "haiku"
  }
}
```

`model` sets the team default. `fallbackModel` is used only when the main model is overloaded or unavailable, not for login or billing errors. `CLAUDE_CODE_SUBAGENT_MODEL` is the default for subagents that do not name their own model. It does not change the built-in Explore and Plan subagents unless you also set `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1`.

Now the two subagents. `.claude/agents/summariser.md`:

```markdown
---
name: summariser
description: Summarises files, diffs or logs in a few bullet points. Use for any read-only summary.
tools: Read, Glob, Grep
model: haiku
---

Summarise what you are given in at most five bullet points. Do not suggest changes.
```

`.claude/agents/reviewer.md`:

```markdown
---
name: reviewer
description: Reviews a plan or a diff for correctness and risk before it is accepted.
tools: Read, Glob, Grep
model: opus
---

Review the plan or change you are given. List correctness problems first, then risks. Be specific.
```

Check that the routing works. Ask for a summary, then list the models that ran:

```bash
claude -p "Use the summariser subagent to summarise .claude/agents/reviewer.md, then reply DONE." \
  --output-format json | python3 -c "import json,sys; print(list(json.load(sys.stdin)['modelUsage']))"
```

You should see two model IDs: the main session's Sonnet and the subagent's Haiku. In an interactive session, `/tasks` shows the model each subagent is running on.

### Step 3 (optional): route your own sessions through a gateway

If your organisation runs a gateway, this goes in **your personal** `~/.claude/settings.json`, never in the committed project file. I have checked it against the docs but not run it, because it needs a real gateway.

```json
{
  "apiKeyHelper": "~/bin/get-gateway-key.sh",
  "env": {
    "ANTHROPIC_BASE_URL": "https://llm-gateway.example.com",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "REPLACE-with-the-sonnet-id-your-gateway-serves",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "REPLACE-with-the-haiku-id-your-gateway-serves"
  }
}
```

`apiKeyHelper` is a command that prints only the credential, so the key never sits in a file. Pinning the alias targets turns a model upgrade into a reviewed configuration change. Run `/status` afterwards and look for the base URL line and a credential line. One billing point: while a gateway credential is active, requests bill per token to the credential's owner, not to a Claude subscription.

Notice what did not change: the project file still says `sonnet` and the subagents still say `haiku` and `opus`.

### Step 4: compare two configurations on the same cases

Make a folder called `fixture/` with two tiny files.

```python
# fixture/stats.py
def mean(values):
    return sum(values) / len(values)


def clamp(x, low, high):
    return max(low, min(x, high))
```

```python
# fixture/text.py
import re


def slugify(title):
    return re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
```

Write the cases in `evals/cases.jsonl`, one per line. Each has a prompt and a regular expression the answer must match.

```jsonl
{"id": "find-crash", "prompt": "Which function in stats.py raises an error when given an empty list? Reply with the function name only.", "expect": "^\\W*mean\\W*$"}
{"id": "trace-output", "prompt": "What does slugify('Hello, World!') in text.py return? Reply with the returned string only, no quotes.", "expect": "^\\W*hello-world\\W*$"}
{"id": "no-hallucinated-import", "prompt": "Does any Python file in this folder import the requests library? Reply yes or no only.", "expect": "^\\W*no\\W*$"}
```

List the configurations to compare in `evals/configs.json`:

```json
[
  { "name": "fast", "model": "haiku" },
  { "name": "strong", "model": "sonnet" }
]
```

Then the runner, `evals/compare_configs.py`:

```python
#!/usr/bin/env python3
"""Run the same eval cases against several Claude Code configurations.

Usage: python3 evals/compare_configs.py evals/cases.jsonl evals/configs.json fixture/
"""
import json
import os
import re
import subprocess
import sys

cases_path, configs_path, workdir = sys.argv[1:4]
cases = [json.loads(line) for line in open(cases_path) if line.strip()]
configs = json.load(open(configs_path))


def run_case(config, case):
    cmd = [
        "claude", "-p", case["prompt"],
        "--model", config["model"],
        "--tools", "Read,Glob,Grep",      # read-only: evals must not edit files
        "--output-format", "json",
        "--max-budget-usd", "0.50",       # hard stop per case
        "--no-session-persistence",
    ]
    env = {**os.environ, **config.get("env", {})}
    proc = subprocess.run(cmd, cwd=workdir, env=env, capture_output=True, text=True, timeout=300)
    try:
        out = json.loads(proc.stdout)
    except json.JSONDecodeError:
        return False, 0.0, f"no JSON (exit {proc.returncode})"
    answer = (out.get("result") or "").strip()
    passed = not out.get("is_error") and re.search(case["expect"], answer, re.I | re.M) is not None
    return passed, out.get("total_cost_usd", 0.0), answer


print("| config | model | passed | cost (USD) | failures |")
print("| --- | --- | --- | --- | --- |")
for config in configs:
    passed, cost, failures = 0, 0.0, []
    for case in cases:
        ok, case_cost, answer = run_case(config, case)
        passed += ok
        cost += case_cost
        if not ok:
            failures.append(f"{case['id']}: {answer[:40]!r}")
    print(f"| {config['name']} | {config['model']} | {passed}/{len(cases)} "
          f"| {cost:.4f} | {'; '.join(failures) or '-'} |")
```

Run it from the project root:

```bash
python3 evals/compare_configs.py evals/cases.jsonl evals/configs.json fixture/
```

One run on my machine printed this. Your numbers will differ, and the cost column is a list-price estimate from `total_cost_usd`, not a bill.

```text
| config | model | passed | cost (USD) | failures |
| --- | --- | --- | --- | --- |
| fast | haiku | 3/3 | 0.1115 | - |
| strong | sonnet | 3/3 | 0.2367 | - |
```

Read that result carefully. Both passed everything, so on these cases the cheap model wins. But these cases are easy. The suite only becomes useful once it holds cases the cheap model might fail: questions that need several tool calls, answers that must quote a file exactly, or prompts where the honest answer is "that does not exist". Add those before you trust the verdict.

A new provider or a local model is just another entry in `configs.json`, with an `env` block such as `{"ANTHROPIC_BASE_URL": "https://llm-gateway.example.com"}`. Keep the credential in `apiKeyHelper` or your shell, never in this file.

## How I use this in production

My current client work is for a global hedge fund with ~$1B AUM, where agents help build and maintain 12+ sector forecasting models. These are the lessons that carried over, written as patterns rather than numbers.

**Route by task, and write the route down.** The orchestration and the hard reasoning go to a stronger model. The judge in our evals and routine summaries go to a fast, low-cost model. Once each agent's model sat in its own definition file, a routing change became a reviewable diff like any other.

**Keep model choice a configuration change.** Every agent talks to models through a provider-agnostic gateway layer. That means trying a different model or provider is a configuration change, not a code change. It also means the gateway is ours to maintain, including the caching behaviour covered in the pitfalls below.

**Put the stable part of the prompt first.** Our prompts have a large static part (instructions, methodology, tool definitions) and a small part that changes with every request (the date, the latest data). The static part is cached; the time-sensitive part is not. Claude Code orders its own requests the same way, so keep `CLAUDE.md` stable.

**No model change without the eval suite.** We accept a model or provider change only after the eval suite has run on it. The surprise was where models differed. Their prose was often hard to tell apart. The differences showed up in tool use (calling the right tool, with the right inputs, at the right time) and in citation discipline (quoting a source for each figure, and saying so when there is none). If your cases only grade the wording of the answer, you will miss exactly the differences that matter.

**Long sessions need context management, not just a bigger model.** Our long-running agent sessions use server-side context management, where the API clears old tool results as the conversation grows, so the agent keeps working without dragging its whole history along. In Claude Code the equivalent is automatic compaction, plus `/compact` at natural breaks between tasks. A bigger context window postpones the problem; it does not remove it.

## Pitfalls

**Switching models in the middle of a task.** The next turn reprocesses the whole conversation at full price. Choose model and effort at the start, and use subagents when one task needs a different model.

**Leaving aliases unpinned on a cloud provider or gateway.** An unpinned alias moves when Claude Code updates: sometimes to a model your account cannot use yet, sometimes to a more expensive default. Pin each alias you use, and treat an upgrade as a reviewed change.

**A gateway that silently breaks caching.** If the gateway drops the cache markers or allowlists only the headers it knows today, requests still succeed but bill as uncached. In a long session, `/usage` shows a `Prompt cache (main)` line with the share of input served from cache. If that share is low on a warm session, check the gateway before blaming the model.

**Committing a credential.** Gateway keys belong in `~/.claude/settings.json`, `.claude/settings.local.json`, managed settings or an `apiKeyHelper` command. The docs say plainly not to put them in the project's `.claude/settings.json`, because that file is committed and shared.

**Comparing models on easy cases, in a noisy set-up.** On easy cases every model passes and the cheapest looks best. Also, a `claude -p` run still loads your personal `CLAUDE.md`, hooks and MCP servers, which change both cost and behaviour. Run comparisons in a clean folder, add hard cases, and consider the `--bare` flag, which skips most of that loading, for a leaner baseline. Bare mode does not use your subscription login, so it needs `ANTHROPIC_API_KEY` or an `apiKeyHelper`.

**Reading the dollar figure as a bill.** `/usage` (which `/cost` now opens) and `total_cost_usd` are estimates at list price. Subscribers are billed by plan; cloud users are billed in their provider's console. Use the estimate to compare configurations, not to forecast an invoice.

## Checklist

- [ ] Write a one-page routing table: which task gets which kind of model, and why.
- [ ] Set the team default `model` in `.claude/settings.json`, and give each subagent its own `model`.
- [ ] Pin every alias you use with `ANTHROPIC_DEFAULT_*_MODEL` if you are on a cloud provider or gateway.
- [ ] Keep gateway credentials out of committed files, and confirm the set-up with `/status`.
- [ ] Open `/usage` in a long session and check the prompt cache line.
- [ ] Copy the comparison script and add at least one hard case: a multi-step tool question or a "does this exist?" trap.
- [ ] Agree as a team that no model or provider change merges without the comparison table in the pull request.

## Further reading

- [Model configuration](https://code.claude.com/docs/en/model-config): aliases, precedence, `opusplan`, effort, fallbacks and restricting models.
- [Manage costs effectively](https://code.claude.com/docs/en/costs): `/usage`, choosing the right model, and team-level cost tracking.
- [How Claude Code uses prompt caching](https://code.claude.com/docs/en/prompt-caching): what keeps the cache warm and what breaks it.
- [Connect Claude Code to an LLM gateway](https://code.claude.com/docs/en/llm-gateway-connect): base URL, credentials, `apiKeyHelper` and troubleshooting.
- [Subagents](https://code.claude.com/docs/en/sub-agents): defining helpers and choosing a model for each.
- [Enterprise deployment overview](https://code.claude.com/docs/en/third-party-integrations): comparing the Anthropic API, Bedrock, Google Cloud and gateways.
