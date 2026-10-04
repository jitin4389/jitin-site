# Research brief: Part 9, "Choosing models and providers: cloud, gateways and local models"

Researcher notes for the writer. Checked on 2026-10-04 against the official docs and a live run of Claude Code v2.1.289 on macOS.

## 0. Read this first

- **Docs have moved.** Claude Code docs now live at `https://code.claude.com/docs/en/...`. The old `docs.claude.com/en/docs/claude-code/*` URLs redirect there. Cite the `code.claude.com` URLs.
- **Primary sources** (short tags used below):
  - **[MODEL]** Model configuration: https://code.claude.com/docs/en/model-config
  - **[COSTS]** Manage costs effectively: https://code.claude.com/docs/en/costs
  - **[CACHE]** How Claude Code uses prompt caching: https://code.claude.com/docs/en/prompt-caching
  - **[GW]** Other LLM gateways: https://code.claude.com/docs/en/llm-gateway
  - **[GW-CONNECT]** Connect Claude Code to an LLM gateway: https://code.claude.com/docs/en/llm-gateway-connect
  - **[GW-PROTO]** Gateway compatibility guide: https://code.claude.com/docs/en/llm-gateway-protocol
  - **[BEDROCK]** Claude Code on Amazon Bedrock: https://code.claude.com/docs/en/amazon-bedrock
  - **[GCP]** Claude Code on Google Cloud's Agent Platform (formerly Vertex AI): https://code.claude.com/docs/en/google-vertex-ai
  - **[DEPLOY]** Enterprise deployment overview: https://code.claude.com/docs/en/third-party-integrations
  - **[SUB]** Subagents: https://code.claude.com/docs/en/sub-agents
  - **[CLI]** CLI reference: https://code.claude.com/docs/en/cli-reference
  - **[CMDS]** Commands: https://code.claude.com/docs/en/commands
  - **[HEADLESS]** Run Claude Code programmatically: https://code.claude.com/docs/en/headless
  - **[ENV]** Environment variables: https://code.claude.com/docs/en/env-vars
  - **[SETREF]** All settings: https://code.claude.com/docs/en/settings-reference
- **The docs change very often.** Almost every section carries "before v2.1.x" notes. Model versions behind each alias have changed several times this year. In the article, **use aliases (`haiku`, `sonnet`, `opus`) and avoid naming model versions or prices.** Say "at the time of writing" where a default matters.
- **Title vs series map.** The intent file lists Part 9 as "Local and open models: when and how". The commissioned title is "Choosing models and providers: cloud, gateways and local models". This brief follows the commissioned title. Local models get one short section, as an option to evaluate. The editor may want to update the series map.
- **What was tested live** (section 3): the project settings and subagent routing example, and the eval comparison script. The gateway configuration was **not** tested live (no gateway available). It is checked against the docs only.

## 1. Fact base

### 1.1 Model aliases

[MODEL, "Model aliases"]

| Alias                    | What it means                                              |
| ------------------------ | ---------------------------------------------------------- |
| `default`                | Clears any override and goes back to the account's default |
| `haiku`                  | Fast, efficient model for simple tasks                     |
| `sonnet`                 | Latest Sonnet, for daily coding                            |
| `opus`                   | Latest Opus, for complex reasoning                         |
| `fable`                  | Fable model, for the longest tasks                         |
| `best`                   | `fable` if available, otherwise `opus`                     |
| `sonnet[1m]`, `opus[1m]` | The 1M-token context variant                               |
| `opusplan`               | Opus in plan mode, then switches to Sonnet for execution   |

- **What an alias resolves to depends on the provider.** For example, at the time of writing, `sonnet` is a newer model on the Anthropic API than on Bedrock or Google Cloud's Agent Platform. [MODEL, "Alias resolution by provider"] Do not print the version table in the article; it will go stale.
- **Default model** is now the latest Opus on Pro, Max, Team, Enterprise, the Anthropic API, Bedrock and Agent Platform (changed in v2.1.280). Microsoft Foundry defaults to an older Sonnet. [MODEL, "Default model behavior"]

### 1.2 How to set the model, and precedence

[MODEL, "Setting your model"; ENV]

Highest priority first:

1. In a session: `/model <alias|name>`, or `/model` for the picker. In the picker, `Enter` switches and saves as default; `s` switches for this session only.
2. At startup: `claude --model <alias|name>`.
3. Environment variable: `ANTHROPIC_MODEL=<alias|name>`.
4. Settings file: `"model"` key (allowed in any settings file, including a project's `.claude/settings.json`). [SETREF]
5. Default for new sessions: `ANTHROPIC_DEFAULT_MODEL` (v2.1.236+). Only applies when nothing above, and no organisation default, applies.

- [ENV] states it directly: "`--model` and `/model` override `ANTHROPIC_MODEL`", and Claude Code "reads the variable first and uses the `model` setting only when the variable is unset."
- **Resumed sessions keep their original model** (`claude --resume`) unless that model is retired or blocked, or the provider uses provider-specific IDs. `--model` and `ANTHROPIC_MODEL` still win. [MODEL]

### 1.3 Model-related environment variables

[MODEL, "Environment variables"]

| Variable                                                    | Purpose                                                                              |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `ANTHROPIC_DEFAULT_OPUS_MODEL`                              | Full model ID the `opus` alias points to                                             |
| `ANTHROPIC_DEFAULT_SONNET_MODEL`                            | Full model ID the `sonnet` alias points to                                           |
| `ANTHROPIC_DEFAULT_HAIKU_MODEL`                             | Full model ID for `haiku`; **also used for background tasks** such as session titles |
| `ANTHROPIC_DEFAULT_FABLE_MODEL`                             | Full model ID for `fable`                                                            |
| `CLAUDE_CODE_SUBAGENT_MODEL`                                | Default model for subagents and teammates                                            |
| `ANTHROPIC_CUSTOM_MODEL_OPTION` (+ `_NAME`, `_DESCRIPTION`) | Adds one custom entry to the `/model` picker                                         |

- **Deprecated:** `ANTHROPIC_SMALL_FAST_MODEL`. Use `ANTHROPIC_DEFAULT_HAIKU_MODEL`. [MODEL]

### 1.4 Per-task model choice inside Claude Code

These are the documented levers for "fast model for routine work, strong model for hard work".

- **`opusplan`**: Opus while in plan mode, Sonnet while executing. [MODEL, "opusplan model setting"] Each plan-mode toggle is a model switch, so it starts a fresh prompt cache. [CACHE, "Switching models"]
- **Subagent `model` frontmatter**: accepts an alias (`sonnet`, `opus`, `haiku`, `fable`), a full model ID, or `inherit`. [SUB, "Choose a model"]
- **Subagent model resolution order** (current, since v2.1.251): [SUB]
  1. Per-invocation `model` parameter (Claude can pass one)
  2. The subagent's `model` frontmatter (`inherit` = main model)
  3. `CLAUDE_CODE_SUBAGENT_MODEL`
  4. The main conversation's model
  - _Changed:_ before v2.1.251, `CLAUDE_CODE_SUBAGENT_MODEL` came first and overrode everything.
  - `CLAUDE_CODE_SUBAGENT_MODEL` alone does **not** change the built-in Explore and Plan subagents. To force one model on every subagent, also set `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1` (v2.1.257+).
  - `/tasks` shows which model each subagent is running on (v2.1.242+).
- **Skill `model` frontmatter**: overrides the model for the rest of the current turn only. The session model resumes on the next prompt. [Skills page, frontmatter reference: https://code.claude.com/docs/en/skills] This is a model switch for that turn, so it misses the cache. [CACHE]
- **Effort level** is a second dial besides model: `/effort`, `--effort`, `CLAUDE_CODE_EFFORT_LEVEL`. Levels `low`, `medium`, `high`, `xhigh`, `max` on current models. [MODEL, "Effort levels"] Lowering effort is the documented way to cut thinking cost on simple tasks. [COSTS, "Adjust extended thinking"]
- **Anthropic's own guidance** [COSTS, "Choose the right model"]: "Sonnet handles most coding tasks well and costs less than Opus. Reserve Opus for complex architectural decisions or multi-step reasoning." And: "For simple subagent tasks, specify `model: haiku`."
- **Fallback models:** `--fallback-model sonnet,haiku` or the `fallbackModel` setting (an array). Used when the primary is overloaded or unavailable, not for auth or billing errors. Chain capped at 3 models. [MODEL, "Fallback model chains"; CLI]

### 1.5 Restricting models (team policy)

[MODEL, "Restrict model selection"]

- `availableModels`: an allowlist. Entries can be families (`sonnet`), version prefixes, or full IDs.
- `enforceAvailableModels: true` (v2.1.175+) makes the Default option obey the allowlist.
- `deniedModels` (v2.1.283+) blocks specific models.
- `availableModelsMatch: "exact"` for exact matching.

### 1.6 Providers: what changes when you leave the Anthropic API

**Amazon Bedrock** [BEDROCK]

- Easiest path: run `claude`, choose **3rd-party platform → Amazon Bedrock**, or run `/setup-bedrock`. The wizard writes to the `env` block of `~/.claude/settings.json`.
- Manual: `CLAUDE_CODE_USE_BEDROCK=1`. `AWS_REGION` is optional if your profile sets one (fallback order: `AWS_REGION`, `AWS_DEFAULT_REGION`, profile region, `us-east-1`).
- Credentials: default AWS SDK chain (`aws configure`, access keys, `AWS_PROFILE` with SSO, `aws login`), or a Bedrock API key in `AWS_BEARER_TOKEN_BEDROCK`. Settings `awsAuthRefresh` and `awsCredentialExport` handle refresh.
- **Pin model versions** with `ANTHROPIC_DEFAULT_OPUS_MODEL` etc. (example values use inference profile IDs such as `us.anthropic.claude-sonnet-4-6`). Docs warn that without pinning, aliases follow Claude Code's built-in default, which "can lag the newest release and may not yet be available in your account."
- **Cost warning in the docs:** an unpinned deployment moved to Opus as the default from v2.1.207, "billed at the Opus rate".
- Background tasks on Bedrock use the default Sonnet model (not Haiku) unless you set `ANTHROPIC_DEFAULT_HAIKU_MODEL` or select a primary model.
- `/logout` is unavailable; the WebSearch tool is not available on Bedrock.
- IAM actions needed: `bedrock:InvokeModel`, `bedrock:InvokeModelWithResponseStream`, `bedrock:ListInferenceProfiles`, `bedrock:GetInferenceProfile` (plus two marketplace actions).
- Uses the Bedrock Invoke API, **not** the Converse API.
- Newer: a "Mantle" endpoint (`CLAUDE_CODE_USE_MANTLE=1`) serves Claude in the native Anthropic API shape. Mention only if needed.

**Google Cloud's Agent Platform, formerly Vertex AI** [GCP]

- _Renamed._ Docs now call it "Google Cloud's Agent Platform, formerly Vertex AI". Variable names keep the `VERTEX` spelling. The login menu still says "Google Vertex AI".
- Wizard: `/login` → 3rd-party platform → Google Vertex AI, or `/setup-vertex`.
- Manual:
  ```bash
  export CLAUDE_CODE_USE_VERTEX=1
  export CLOUD_ML_REGION=global
  export ANTHROPIC_VERTEX_PROJECT_ID=YOUR-PROJECT-ID
  ```
  Per-model region overrides use `VERTEX_REGION_CLAUDE_*`.
- Auth: standard Google Cloud credentials (Application Default Credentials). Optional `gcpAuthRefresh` setting.
- IAM: `roles/aiplatform.user` (needs `aiplatform.endpoints.predict`).
- Same pinning advice and the same background-model and Opus-default cost notes as Bedrock.

**Comparison** [DEPLOY]: prompt caching is "Enabled by default" on every option. Cost tracking lives in the provider's billing tool (AWS Cost Explorer, GCP Billing, Azure Cost Management) for cloud providers, and in the usage dashboard for Anthropic plans. `allowedProviders` (managed settings, v2.1.285+) limits which providers a machine may use.

### 1.7 LLM gateways

**What a gateway gives you** [GW]: one place for credentials (provider key stays server-side), usage tracking per developer or team, cost controls (budgets, rate limits), audit logging, and provider switching without touching developer machines. The trade-off, quoted: "the gateway becomes infrastructure your organization operates", and it must be kept updated as Claude Code adds features.

**Developer-side configuration** [GW-CONNECT]

- Two variables: `ANTHROPIC_BASE_URL` and a credential.
- Credential choice:
  - `ANTHROPIC_AUTH_TOKEN` → sent as `Authorization: Bearer`
  - `ANTHROPIC_API_KEY` → sent as `x-api-key`
  - `apiKeyHelper` (settings key; a command that prints the credential) → sent in **both** headers
- Settings-file form (persist in `~/.claude/settings.json` or `.claude/settings.local.json`):
  ```json
  {
    "env": {
      "ANTHROPIC_BASE_URL": "https://llm-gateway.example.com",
      "ANTHROPIC_AUTH_TOKEN": "sk-gateway-key"
    }
  }
  ```
- **Warning in the docs:** "Don't put the credential in a project's `.claude/settings.json`. That file is committed and shared."
- A settings-file `env` value wins over a shell export of the same variable.
- `apiKeyHelper` output is cached for 5 minutes by default; change with `CLAUDE_CODE_API_KEY_HELPER_TTL_MS`. From v2.1.227 the helper must print only the credential.
- Verify with `/status`: look for the `Anthropic base URL` line and an `Auth token` or `API key` line.
- Optional: `ANTHROPIC_CUSTOM_HEADERS` (routing/tenant headers), `CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY=1` (fills `/model` from the gateway's `/v1/models`), `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1` (egress-locked networks; also disables auto-update).
- **Billing note** [GW]: while a gateway credential or `apiKeyHelper` is active, requests bill per token to the credential's owner, not to a claude.ai subscription. Setting only `ANTHROPIC_BASE_URL` without a credential keeps the subscription login active.
- Cloud-provider format through a gateway: `ANTHROPIC_BEDROCK_BASE_URL` + `CLAUDE_CODE_SKIP_BEDROCK_AUTH=1` + `CLAUDE_CODE_USE_BEDROCK=1`; similarly `ANTHROPIC_VERTEX_BASE_URL` + `CLAUDE_CODE_SKIP_VERTEX_AUTH=1` + `CLAUDE_CODE_USE_VERTEX=1`.

**Gateway requirements** [GW-PROTO]

- Must expose at least one format:

  | Format                    | Selected by                                                | Endpoints                                                             | Forward unchanged                                                             |
  | ------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
  | Anthropic Messages        | `ANTHROPIC_BASE_URL`                                       | `/v1/messages`, `/v1/messages/count_tokens` (optional)                | `anthropic-beta`, `anthropic-version` headers                                 |
  | Bedrock InvokeModel       | `ANTHROPIC_BEDROCK_BASE_URL` + `CLAUDE_CODE_USE_BEDROCK=1` | `/model/{model}/invoke`, `/model/{model}/invoke-with-response-stream` | `anthropic_beta`, `anthropic_version` body fields                             |
  | Agent Platform rawPredict | `ANTHROPIC_VERTEX_BASE_URL` + `CLAUDE_CODE_USE_VERTEX=1`   | `:rawPredict`, `:streamRawPredict`                                    | `anthropic-beta`, `anthropic-version` headers, `anthropic_version` body field |

- Stream responses; do not buffer. Forward keep-alive pings (Claude Code aborts a stream after five minutes of silence by default).
- Treat headers and body fields as **open lists**: forward `anthropic-*` headers and body fields unchanged rather than allowlisting what you see today.
- Useful attribution headers Claude Code sends: `x-claude-code-session-id`, `x-claude-code-agent-id`, `x-claude-code-parent-agent-id`. Optional routing hints (`x-claude-code-request-class` etc.) need `CLAUDE_CODE_GATEWAY_HINT_HEADERS=1` behind a custom base URL (v2.1.273+).
- **Prompt caching through a gateway:** forward `cache_control` markers unchanged. If a gateway strips them while returning success, "your entire conversation history bills as uncached input on every turn". [GW-PROTO; CACHE] This is the single most useful gateway fact for the article.
- If the upstream rejects newer fields (`400 ... Extra inputs are not permitted`), set `CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS=1`. [GW-CONNECT troubleshooting]

### 1.8 Third-party and local models: what the docs say

- **Not supported.** Quote from [GW]: "Anthropic doesn't endorse, maintain, or audit third-party gateway products, and doesn't support routing Claude Code to non-Claude models through any gateway."
- Gateway model discovery keeps only IDs containing `claude` or `anthropic`. [GW-PROTO, "Model discovery"]
- On LiteLLM specifically, [COSTS] says several large enterprises reported using it to track spend by key, and that it is "unaffiliated with Anthropic and has not been audited for security."
- **Implication for the article:** local or open models can be tried behind an Anthropic-format endpoint, but this is outside what Anthropic supports. Present it as an option to _evaluate_ with the same eval suite, not a recommendation. Do not write setup steps (the course covers that; it would also break the originality rule).

### 1.9 Cost tracking

- **`/cost` is now an alias for `/usage`.** `/stats` is another alias. [CMDS] _Changed:_ older tutorials show `/cost` as its own command.
- `/usage` Session block shows total cost, API and wall duration, code changes, and usage by model with input, output, cache read and cache write tokens. It is an **estimate at list price** unless an admin sets `modelPricing` in managed settings. For subscribers the dollar figure "isn't relevant for billing purposes". [COSTS]
- From v2.1.251, `/usage` adds a `Prompt cache (main)` line: request count, share of input from cache, misses, and warm or cold state. From v2.1.260 it can name the likely cause of the last miss. [COSTS; CACHE]
- Totals reset on `/clear` (since v2.1.211).
- **Scripted runs:** `claude -p ... --output-format json` returns `total_cost_usd` and a per-model breakdown (`modelUsage`). Both are client-side estimates. [HEADLESS] Confirmed live (section 3): top-level keys include `result`, `is_error`, `total_cost_usd`, `usage`, `modelUsage`, `num_turns`, `duration_ms`.
- **`--max-budget-usd <amount>`**: print mode only; stops once spend reaches the cap; subagent spend counts. [CLI]
- **Anthropic's published averages** (enterprise deployments): about $13 per developer per active day, $150–250 per developer per month, under $30 per active day for 90% of users. [COSTS] Safe to quote, attributed to Anthropic.
- Organisation tracking: Console usage page and workspace limits (API), cloud billing consoles (Bedrock/Agent Platform/Foundry), OpenTelemetry on every setup, or a gateway. [COSTS]

### 1.10 Prompt caching behaviour

[CACHE]

- Automatic. The API caches the **prefix** of each request. Match is exact: a change anywhere in the prefix recomputes everything after it.
- Claude Code orders each request so stable content comes first: system prompt and tool definitions → project context (CLAUDE.md, memory) → conversation.
- **Actions that invalidate the cache:** switching models (each model has its own cache), changing effort level on most models, turning on fast mode, connecting or removing an MCP server when tools load upfront, some plugin changes, denying a whole tool (without tool search), compaction, many images, upgrading Claude Code.
- **Actions that keep the cache:** editing repo files, editing CLAUDE.md mid-session (the edit also does not apply until `/clear`, `/compact` or restart), changing permission mode, invoking skills and commands, `/rewind`, spawning a subagent.
- **Tip from the docs:** "Pick your model and effort level at the top of a session, then save `/compact` for natural breaks between tasks."
- **TTL:** one hour for the main conversation on a subscription within plan usage; five minutes on API key, cloud providers, or usage credits. Set with the `promptCacheTtl` / `subagentPromptCacheTtl` settings or `CLAUDE_CODE_PROMPT_CACHE_TTL` / `CLAUDE_CODE_SUBAGENT_PROMPT_CACHE_TTL` (values `5m` or `1h`, v2.1.242+). One-hour writes bill at a higher rate.
- **Subagents** start their own cache; they do not read the parent's.
- **Disable:** `DISABLE_PROMPT_CACHING=1` (or per family: `_HAIKU`, `_SONNET`, `_OPUS`, `_FABLE`). For debugging only.
- **Check it:** status line fields `cache_creation_input_tokens` and `cache_read_input_tokens`; a high read-to-creation ratio means caching works.
- Confirmed live: a one-line `-p` run reported both `cache_creation_input_tokens` and `cache_read_input_tokens` in `usage`, with writes under `ephemeral_1h_input_tokens` (subscription login).

### 1.11 Recently changed or deprecated (summary for the editor)

| Item                         | Status                                                                     |
| ---------------------------- | -------------------------------------------------------------------------- |
| Docs location                | Moved to `code.claude.com/docs/en/...`                                     |
| `/cost`                      | Now an alias for `/usage`                                                  |
| `ANTHROPIC_SMALL_FAST_MODEL` | Deprecated → `ANTHROPIC_DEFAULT_HAIKU_MODEL`                               |
| Vertex AI                    | Renamed "Google Cloud's Agent Platform"; `VERTEX` variable names unchanged |
| Default model                | Latest Opus on most plans and providers since v2.1.280                     |
| `CLAUDE_CODE_SUBAGENT_MODEL` | Now a default, below frontmatter (since v2.1.251)                          |
| Prompt cache TTL controls    | New settings `promptCacheTtl`, `subagentPromptCacheTtl` (v2.1.242)         |
| `deniedModels`               | New (v2.1.283)                                                             |
| `allowedProviders`           | New, managed only (v2.1.285)                                               |

## 2. Mapping the production notes to the docs

The writer may use only these five notes, as worded. Below is how each connects to a documented feature, so the article can say "here is how you do the same in Claude Code".

| Note                                                                                                                        | Claude Code equivalent                                                                                                                                                                                                       |
| --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| (1) Route by task: stronger model for orchestration and hard reasoning, fast low-cost model for the judge and summaries     | `opusplan`; subagent `model` frontmatter; `CLAUDE_CODE_SUBAGENT_MODEL`; the eval script's per-config `model` [MODEL, SUB]                                                                                                    |
| (2) Provider-agnostic gateway layer keeps model choice a configuration change                                               | `ANTHROPIC_BASE_URL` + credential in settings `env`; "provider switching" is a listed gateway benefit, but only if the gateway exposes one Anthropic-format endpoint [GW]                                                    |
| (3) Large static part of prompts cached, small time-sensitive part not                                                      | Same principle as Claude Code's layer ordering (stable first, changing last) [CACHE]                                                                                                                                         |
| (4) Changes accepted only after the eval suite runs; differences showed in tool use and citation discipline more than prose | The comparison script below; ties back to Part 8                                                                                                                                                                             |
| (5) Long sessions use server-side context management                                                                        | API context editing: https://platform.claude.com/docs/en/build-with-claude/context-editing. Claude Code sends a `context_management` field to Anthropic-format endpoints [GW-PROTO], and also compacts automatically [COSTS] |

Do not add numbers to any of these. Do not name the client.

## 3. Proposed working example (tested)

One small set of files. Three parts: a decision table, a settings example, and a comparison script. A gateway variant is shown as configuration only.

### 3.1 Original decision table

| Task                                          | Model choice                                    | Why                                                |
| --------------------------------------------- | ----------------------------------------------- | -------------------------------------------------- |
| Summarise a diff, log or file                 | `haiku` (in a subagent)                         | Low risk, high volume; summaries are easy to check |
| Routine edits, renames, test fixes            | `sonnet` (main session)                         | Anthropic's suggested default for most coding      |
| Planning a multi-file change                  | `opus` (or `opusplan`)                          | Mistakes here are expensive to undo                |
| Reviewing a plan or diff before you accept it | `opus` (in a reviewer subagent)                 | Catching a wrong assumption is worth the cost      |
| Judge in an eval suite                        | Fast model, then spot-check                     | Many calls; check that it agrees with you first    |
| Trying a new model or provider                | Whatever you are testing, behind the eval suite | No change without evidence                         |

### 3.2 Project settings and subagents

`.claude/settings.json` (committed; no secrets):

```json
{
  "model": "sonnet",
  "fallbackModel": ["haiku"],
  "env": {
    "CLAUDE_CODE_SUBAGENT_MODEL": "haiku"
  }
}
```

`.claude/agents/summariser.md`:

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

**Tested live:** in a folder with these files, `claude -p "Use the summariser subagent to summarise stats.py, then reply DONE." --output-format json` reported two models in `modelUsage`: the main session on the current Sonnet and the subagent on Haiku. So the project `model` key and the subagent `model` field both took effect.

Notes for the writer:

- `CLAUDE_CODE_SUBAGENT_MODEL` here is only a default for subagents without their own `model`. It does not change built-in Explore and Plan unless `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1` is also set. [SUB]
- An individual can still override per session with `/model` or `--model`.
- Optional alternative to show: `"model": "opusplan"` for "plan with Opus, build with Sonnet". Not tested live.

### 3.3 Gateway pattern (docs-checked, not tested live)

Personal settings, `~/.claude/settings.json` (never the committed project file):

```json
{
  "apiKeyHelper": "~/bin/get-gateway-key.sh",
  "env": {
    "ANTHROPIC_BASE_URL": "https://llm-gateway.example.com",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "claude-sonnet-4-6",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "claude-haiku-4-5"
  }
}
```

- `apiKeyHelper` prints only the credential; Claude Code sends it in both `Authorization` and `x-api-key`. [GW-CONNECT]
- Pinning the alias targets means a model upgrade becomes a reviewed config change. Model IDs above are examples; use the IDs your gateway serves. Writer should keep them clearly marked as examples.
- Check with `/status` (base URL line, credential line).
- Point for the article: the project file says _which kind_ of model each task gets (`sonnet`, `haiku`, `opus`). The personal or managed file says _where_ those models come from. Swapping provider changes only the second file.

### 3.4 Comparison script: same eval cases, two configurations

Part 8 is not written yet. This script assumes a simple JSONL case format. **The writer of Part 8 and this part must agree the case format.** If Part 8 uses a different shape, adapt `run_case` only.

`evals/cases.jsonl` (the test cases used here, against two tiny files `stats.py` and `text.py`):

```json
{"id": "find-crash", "prompt": "Which function in stats.py raises an error when given an empty list? Reply with the function name only.", "expect": "^\\W*mean\\W*$"}
{"id": "trace-output", "prompt": "What does slugify('Hello, World!') in text.py return? Reply with the returned string only, no quotes.", "expect": "^\\W*hello-world\\W*$"}
{"id": "no-hallucinated-import", "prompt": "Does any Python file in this folder import the requests library? Reply yes or no only.", "expect": "^\\W*no\\W*$"}
```

Fixture files:

```python
# stats.py
def mean(values):
    return sum(values) / len(values)


def clamp(x, low, high):
    return max(low, min(x, high))
```

```python
# text.py
import re


def slugify(title):
    return re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
```

`evals/configs.json`:

```json
[
  { "name": "fast", "model": "haiku" },
  { "name": "strong", "model": "sonnet" }
]
```

A gateway configuration is just another entry, for example `{"name": "via-gateway", "model": "sonnet", "env": {"ANTHROPIC_BASE_URL": "https://llm-gateway.example.com"}}`. (Not tested live.) The credential should come from `apiKeyHelper` or the environment, never from this file.

`evals/compare_configs.py`:

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

**Tested live** (Claude Code v2.1.289, macOS, subscription login): both configs passed 3/3; the fast config's estimated cost was a little under half the strong config's. Output shape:

```text
| config | model | passed | cost (USD) | failures |
| --- | --- | --- | --- | --- |
| fast | haiku | 3/3 | 0.1115 | - |
| strong | sonnet | 3/3 | 0.2367 | - |
```

Writer guidance on these numbers:

- They are my own test, not client data, so they may be shown, but label them "one run on my machine; your numbers will differ". Costs are list-price estimates (`total_cost_usd`), not a bill.
- The useful lesson: on easy cases both models pass, so the cheap one wins. The suite only tells you something when it includes hard cases (tool use, refusing to invent facts). That links to production note (4).
- Flags verified in [CLI]: `--model`, `--tools`, `--output-format json`, `--max-budget-usd` (print mode only), `--no-session-persistence` (print mode only).

## 4. Pitfalls worth covering

1. **Switching models mid-task is not free.** Each model has its own cache, so the next turn re-reads everything uncached. Pick model and effort at the start. [CACHE]
2. **Unpinned aliases on cloud providers** move when Claude Code updates, including to a more expensive default. Pin with `ANTHROPIC_DEFAULT_*_MODEL`. [BEDROCK, GCP]
3. **Gateway strips `cache_control`** → every turn bills as uncached, with no error. Check `/usage` for the `Prompt cache (main)` line. [CACHE, GW-PROTO]
4. **Credential in the committed project settings file.** The docs warn against it. [GW-CONNECT]
5. **Comparing on easy cases only.** Cheap models look as good as strong ones. Add cases that need tool use or exact citation.
6. **Eval runs pick up your personal setup.** User-level CLAUDE.md, hooks and MCP servers load in `-p` runs too, which changes cost and behaviour. Run comparisons in a clean folder, and consider `--bare` for the leanest baseline (skips CLAUDE.md, hooks, skills, MCP discovery) [CLI]. Not tested with this script.
7. **Assuming non-Claude models are supported.** They are not, per [GW]. If you try one, the eval suite is the gate.
8. **Reading `/usage` dollars as a bill.** It is a list-price estimate; subscribers are billed by plan. [COSTS]

## 5. Checklist candidates

- Default model set in project settings; per-task models set in subagent files.
- Alias targets pinned wherever you use a cloud provider or gateway.
- Gateway credentials in personal or managed settings only; `/status` checked.
- Gateway forwards `anthropic-*` headers, body fields and `cache_control` unchanged.
- `/usage` shows a high cache hit share in long sessions.
- No model or provider change merged without the eval comparison.
- Any local or open model treated as an unsupported experiment until it passes the same suite.

## 6. Originality and confidentiality notes

- No overlap with the course project, tools or sequence: no auth provider, no database MCP, no local-model walkthrough. The fixture (`stats.py`, `text.py`) and cases are new.
- Production content limited to the five provided notes. No client names, numbers, tools or repos.
- This file was checked against the confidential-terms blocklist after writing (no matches).

## Editor's notes (2026-10-04)

- **Opening:** tightened the hook into shorter sentences; replaced "Six weeks later the bill has doubled" with "A few weeks later the bill has jumped" so the piece adds no new numbers; turned the thesis paragraph into three short imperatives.
- **Headings:** "The idea" became "The idea: three decisions, not one"; "Decision 2: choose where models come from" became "Decision 2: where models come from"; Step 3 heading reworded to "Step 3 (optional): point the project at a gateway". Template order checked: intro, idea, working example, production, pitfalls, checklist, further reading.
- **Cuts:** removed "you can build in ten minutes" (unverified claim); shortened the kitchen analogy, the subagent-mixing sentence, and the two pitfalls that repeated Decision 1 and 2 wording. Prose is now about 2,430 words (excluding code), inside the 1,500 to 2,500 range.
- **Production section:** replaced "the first thing I check after any change to it is that prompt caching still works" with a pointer to the caching pitfall, so the section stays within the five approved notes and adds no new practice claim.
- **Code blocks:** unchanged; checked against section 3 of this brief (settings, subagents, cases, configs and runner match).
- **Links:** all six Further reading links are official `code.claude.com/docs/en/...` pages listed in section 0.
- **Sidecar:** summary rewritten in shorter sentences for junior readers; key point 2 now says a model switch "starts a cold cache" (more precise than "discards"); video hook no longer says "ten-line table" (the table has six rows).
- **Checks:** confidential-terms blocklist scan of article, sidecar and this brief: no matches. No new client facts or numbers added.
