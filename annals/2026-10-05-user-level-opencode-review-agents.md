# User-level OpenCode documentation review agents

- Date: 2026-10-05
- Status: implemented
- Scope: user-level OpenCode configuration (outside this repository); recorded here because it governs how documentation in this repository is reviewed
- Repository: LiveMindIO/blog (origin ssh://git@git.jacoby6000.com:2222/LiveMindIO/blog.git)
- Branch: main
- HEAD at recording: 36b6709 ("Update Dolphin debugging guide for managed launches")
- Working tree: dirty with unrelated modifications to `src/content/posts/dolphin-debugging-stack.md` and `src/layouts/PostLayout.astro`; agent files themselves are uncommitted stdio config outside the repo
- Authoring agent: build (gpt-6.1-sol), source session `ses_ef311a1c4ffekbQPQ9p37M2gSO`, source response `msg_10d27a5540013e58XyOKr4HJWi`

## Decision summary

Three user-level OpenCode agents were created at `~/.config/opencode/agents/`:

> **Correction (2026-10-05, later same session):** the placement in plural `agents/` and `mode: subagent` below are superseded. The agents were moved to `~/.config/opencode/agent/` and set to `mode: all`. See [2026-10-05-user-level-review-agents-agent-dir-mode-all.md](2026-10-05-user-level-review-agents-agent-dir-mode-all.md).

- `technical-user.md` — reviews user-facing docs/tutorials for technically capable non-experts; wants concise working instructions.
- `invested-expert-user.md` — reviews developer-facing docs for engineers who want internals, rationale, and contribution guidance.
- `average-user.md` — reviews nontechnical user-facing docs for literal, unambiguous instructions.

Each is `mode: subagent`, denies `edit`, `shell`, and `subagent` permissions (read-only reviewers), and inherits the invoking session's model (no `model` field configured).

## Context

The user asked for invocable user-level agents matching three audience profiles. The build agent fetched the OpenCode V2 agents documentation, checked `~/.config/opencode` (which contained `agent/` singular, holding `annalist.md`, but no `agents/` directory), then created the three files under `~/.config/opencode/agents/` (plural, per V2 docs at https://opencode.ai/v2/docs/agents).

## Evidence and verification

- Files created successfully via patch tool; YAML frontmatter validated (mode `subagent`, non-empty description/body, all permission effects `deny`).
- A Mem0 `task_learning` memory records the creation (memory id `79f2dbbd-6413-4ff9-a5c9-2fd696c465d0`).
- Later in the same session (msg_10d27066d001iBxRlNqEtSLnWL) the user reported the agents did not appear. Verification followed:
  - `~/.config/opencode/agents/` lists `average-user.md`, `invested-expert-user.md`, `technical-user.md`.
  - `opencode debug agents` lists all three plus `annalist` (from `~/.config/opencode/agent/annalist.md`, singular directory), indicating both the singular `agent/` and plural `agents/` directories are discovered in opencode v2.0.19 — this was observed but not formally documented upstream.
  - `opencode api get /api/agent` returns `{ "location": {"directory": "/home/jbarber"}, "data": [...] }`; the three agents appear with `mode: "subagent"`.
- User-facing guidance given: run `opencode reload` if a session does not pick up new agents; invoke as subagents (e.g. "Use the technical-user subagent to review this document"); they will not appear in the primary-agent switcher because their mode is `subagent`.

## Options considered

- Placing agents under `~/.config/opencode/agent/` (singular), matching the pre-existing `annalist.md` location — rejected in favor of the plural `agents/` path documented for V2, though singular also worked in practice.
- Giving the agents explicit models — rejected; subagents inherit the parent session's model when none is configured.
- Making them primary agents — rejected; they are intended as reviewers invoked by a parent agent.

## Consequences

- The three reviewers are available to any session; existing sessions may need `opencode reload`.
- No changes to this repository's content or config were made by that session.
- A tooling lesson: `/api/agent` wraps agents in `{location, data}`, so naive array parsing fails.

## Open questions / gaps

- Whether `agent/` (singular) is a supported user-level agent directory in V2 or an accident of the existing `annalist.md` layout is unresolved; no upstream doc fetched confirms the singular path.
- No issue, PR, or tag tracks this configuration; it lives outside version control.

## Subsequent developments

- 2026-10-05: The plural `agents/` placement and `mode: subagent` claims above (Decision summary line "Each is `mode: subagent`", and the Options considered rejection of singular `agent/`) were reversed later in the same source session after the user reported the agents were not visible. The agents now live in `~/.config/opencode/agent/` with `mode: all`; verified via `opencode reload` and `opencode debug agents`. See [2026-10-05-user-level-review-agents-agent-dir-mode-all.md](2026-10-05-user-level-review-agents-agent-dir-mode-all.md) for the full record. Overall decision status remains `implemented`.
