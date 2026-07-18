# Model selection and comparison

**Research snapshot: 2026-07-14. I did not run a model benchmark for this release.**

## Recommendation

Choose models by operating role, then validate the entire **model + prompt + tools + agent loop + runtime** on fixed tasks. Do not choose one model for every role or copy a vendor leaderboard into an architecture claim.

This is the allocation I use when configuring models locally. Crab does not force these choices on a fresh install.

| Role | Local setup | What matters most | Recommendation |
|---|---|---|---|
| Primary | Internal primary profile | Repository judgment, reliable tool use, multi-step edits, synthesis | Use the strongest model available under the real latency/cost budget; keep it as sole writer |
| Scout / subagent | Internal subagent profile | Fast bounded discovery and clean evidence return | Use a capable, cheaper/faster model only after it passes read-only tool and citation fixtures |
| Pruner | Internal pruning profile | Stable direct streaming, faithful compression, low latency, recoverable refs | Optimize for fidelity and protocol reliability, not coding-leaderboard rank |
| Reviewer | Read-only independent pass | Finding regressions and challenging assumptions | Prefer a separate pass; consider a different model family when correlated errors matter |
| Exceptional escalation | Supervised Codex profile | Hard task where extra compute materially helps | Keep explicit and supervised; do not nest orchestration without a concrete need |

Exact internal model identifiers are not part of the package. I do not map those profiles to public checkpoints or assign them unsupported scores.

## Comparison protocol

Pin and report:

- model/checkpoint, release date, quantization, serving backend, and hardware;
- context limit, chat template, tool parser, and stop conditions;
- system policy, tool schemas, retries, and turn/time/token budgets;
- repository snapshot, dependencies, fixture, and exact test command;
- repeated-trial count and uncertainty.

Use representative tasks: navigation, focused bug fix, multi-file change, test repair, terminal setup, documentation/refactor, tool-call recovery, and unsafe-command/secret-handling cases.

Report at least:

| Outcome | Why it matters |
|---|---|
| Tests-passing task success (`n/N`) | Concrete denominator, not a cherry-picked anecdote |
| Human-reviewed correctness and regressions | Tests can miss behavioral damage |
| Invalid/failed tool calls and retries | Measures agent-loop compatibility |
| Wall time, tokens/tool calls, hardware, and cost | Makes routing trade-offs visible |
| Unsafe action attempts / permission outcomes | Capability without boundary discipline is not success |
| Failure taxonomy | Shows whether the model, parser, tool, environment, or policy failed |

Safe claim: “Under this pinned harness and fixture set, X passed `n/N` tasks.”  
Unsafe claim: “X is the best coding model.”

## Public benchmark signals—and their limits

| Signal | Useful for | Caveat |
|---|---|---|
| [SWE-bench Verified](https://www.swebench.com/verified.html) | Historical repository-issue resolution on a human-filtered set of 500 instances; review covered problem clarity, test-patch correctness, and solvability | Results describe an agent/harness system, not base-model capability in isolation |
| [SWE-bench evaluation guide](https://www.swebench.com/SWE-bench/guides/evaluation/) | Reproducible patch-and-test evaluation in a containerized Docker environment | Measures the selected dataset, repository, patch, tests, and harness—not general private-repository performance |
| [Terminal-Bench 2.0](https://www.tbench.ai/benchmarks/terminal-bench-2) | End-to-end terminal-agent evaluation over 89 tasks across software engineering, ML, security, data science, and other domains | Scores are tied to benchmark revision and agent/harness configuration; make 2.0/2.1 differences explicit |
| [Harbor runner](https://www.harborframework.com/docs/tutorials/running-terminal-bench) | Official documentation for running Terminal-Bench 2.0 by selecting a dataset, model, and agent | The result is an agent/harness-system result, not a base-model-only score |

OpenAI's **February 23, 2026** discussion, [“Why SWE-bench Verified no longer measures frontier coding capabilities”](https://openai.com/index/why-we-no-longer-evaluate-swe-bench-verified/), reports contamination and explains why OpenAI no longer treats it as a frontier-capability measure. Microsoft Research's **May 2025** [SWE-bench Goes Live](https://www.microsoft.com/en-us/research/publication/swe-bench-goes-live/) describes overfitting and contamination risks in static benchmarks. These warnings require date, task split, harness, and holdout evidence; they do not prove every historical score unusable.

Never merge Terminal-Bench 2.0 and [2.1](https://www.tbench.ai/news/terminal-bench-2-1) scores or compare different agent/harness configurations as if they measured the base model alone.

## Open-weight candidates to evaluate

These are candidates, not recommendations or measured equivalents to the source routing.

| Candidate | Officially stated artifact facts | Potential role | Validation caveat |
|---|---|---|---|
| [Qwen3-Coder-Next](https://huggingface.co/Qwen/Qwen3-Coder-Next) and [repository](https://github.com/QwenLM/Qwen3-Coder) | Official model repository marked Apache-2.0; 80B total / 3B activated parameters, 262,144-token native context, and documented tool calling with Qwen's SGLang/vLLM parser | Scout/reviewer candidate first | Promote only after fixed fixtures measure retention, parser/chat-template behavior, recovery, latency, and hardware fit |
| [Mistral Devstral Small 1.0](https://docs.mistral.ai/models/model-cards/devstral-small-1-0-25-05) | 24B, 128k context, and coding-agent/tool-use positioning; Mistral lists retirement on 2025-11-30 | Legacy/archived comparison only | Verify the exact checkpoint license, notices, function-call format, and runtime before redistribution or deployment |
| [OpenAI gpt-oss-20b / 120b](https://openai.com/index/gpt-oss-model-card/) | Open-weight reasoning models under Apache 2.0 plus a separate usage policy; up to 128k context, agentic/tool-use positioning, and OpenAI's Harmony format | Local scout/reviewer or controlled primary experiment | Apply both the artifact license and [usage policy](https://huggingface.co/openai/gpt-oss-20b/blob/main/USAGE_POLICY); verify tokenizer, parser, runtime, and Harmony support |

Open-weight means released model parameters, not necessarily open training data/code or unrestricted use. A context limit and tool-calling example also do not guarantee useful retention, affordable hardware, quantization quality, or reliable calls here. Verify the exact checkpoint, tokenizer, runtime, license, notices, and usage policy before redistribution or commercial use.

[Pi upstream](https://github.com/badlogic/pi-mono) exposes integration paths for selected OpenAI-compatible and local model endpoints. Verify the current provider configuration for each endpoint, model, tokenizer, and tool parser; this establishes an option, not compatibility or performance for every model.

## Proposed local evaluation gate

1. Build 12–20 synthetic/public fixtures across the task categories above.
2. Hold the Crab policy, tools, budgets, and repository revisions constant.
3. Run at least three trials per model/role combination.
4. Keep a new private holdout separate from public benchmark tasks.
5. Record raw test results and failure categories without sessions or secrets.
6. Promote a model into a role only if it meets that role's latency, fidelity, safety, and cost threshold.

Until that work exists, the defensible recommendation is architectural: use the strongest reliable primary you can afford, cheaper bounded specialists only where they pass role-specific fixtures, and a dedicated faithful pruner.
