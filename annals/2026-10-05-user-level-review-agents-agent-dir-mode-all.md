# User-level review agents moved to `agent/` and mode `all`

- Date: 2026-10-05
- Status: implemented (supersedes placement/mode claims in [2026-10-05-user-level-opencode-review-agents.md](2026-10-05-user-level-opencode-review-agents.md))
- Scope: user-level OpenCode configuration (outside this repository); recorded here because it governs how documentation in this repository is reviewed
- Repository: LiveMindIO/blog (origin ssh://git@git.jacoby6000.com:2222/LiveMindIO/blog.git)
- Branch: main
- HEAD at recording: 36b6709 ("Update Dolphin debugging guide for managed launches"); superseding change predates this annals update
- Working tree: dirty with unrelated modifications to `src/content/posts/dolphin-debugging-stack.md` and `src/layouts/PostLayout.astro`; agent files remain uncommitted stdio config outside the repo
- Authoring agent: build (gpt-6.1-sol), source session `ses_ef311a1c4ffekbQPQ9p37M2gSO`, source response `msg_10d2d3bca001igixUo0NfUV2fS`

## Decision summary

The three user-level review agents were moved from `~/.config/opencode/agents/` (plural) to `~/.config/opencode/agent/` (singular, alongside `annalist.md`), and their `mode` was changed from `subagent` to `all`. `opencode reload` succeeded and `opencode debug agents` was verified to list all three as visible with `mode: all`.

## Context

After the initial placement, the user reported twice that only Annalist was visible:

- msg_10d27066d001iBxRlNqEtSLnWL: "The agents you said you created appear to not exist" — addressed by confirming the files existed under plural `agents/` and that OpenCode's API listed them with `mode: "subagent"`, plus guidance to run `opencode reload` (response msg_10d27a5540013e58XyOKr4HJWi).
- msg_10d2ca771001RmOY2ACVukEuKg: "I thnk they're supposed to be in singular `agent`. I still only see the annalist (in the singular dir)" — addressed by moving the files and changing the mode (response msg_10d2d3bca001igixUo0NfUV2fS).

## Evidence and verification

- Patch tool moved `technical-user.md`, `invested-expert-user.md`, `average-user.md` to `~/.config/opencode/agent/` and changed each `mode: subagent` to `mode: all` (msg_10d2caba1001wna2FpGXdoJeE7).
- `opencode reload` printed "Configuration reloaded" (msg_10d2ce28e001zYFOpqovw9bHXT).
- `opencode debug agents | python ...` printed `average-user: mode=all, visible`, `invested-expert-user: mode=all, visible`, `technical-user: mode=all, visible` (msg_10d2d0170001kXrhsCBjYeoAiT).
- Repo-side verification during this review: `~/.config/opencode/agent/` contains `annalist.md` and the three reviewers, each with `mode: all`; `~/.config/opencode/agents/` still exists but is empty.
- The Mem0 task_learning memory `79f2dbbd-6413-4ff9-a5c9-2fd696c465d0` was updated in place to describe the singular-directory location, `mode: all`, the move from plural, and the reload verification.

## Options considered

- Keep the plural `agents/` path and instruct the user to reload — tried and rejected after the user still saw only Annalist (msg_10d2ca771001RmOY2ACVukEuKg).
- Move to singular `agent/` only, keep `mode: subagent` — rejected; the user's complaint was invisibility, and `subagent` mode keeps agents out of the primary-agent selector.
- Move to singular `agent/` and set `mode: all` — chosen; matches where Annalist lives, keeps subagent invocation available, and makes the agents directly selectable.

## Consequences

- All four user-level agents now reside together in `~/.config/opencode/agent/` with consistent visibility.
- The empty legacy `~/.config/opencode/agents/` directory remains; removing it is harmless follow-up but was not done in this change.
- The plural-`agents/` directory and `mode: subagent` claims in [2026-10-05-user-level-opencode-review-agents.md](2026-10-05-user-level-opencode-review-agents.md) are superseded; that record's overall decision (three read-only documentation reviewers) remains implemented.
- Existing sessions must run `opencode reload` (or restart) to pick up the change.

## Reconsideration triggers

- Upstream OpenCode V2 documentation formally stating which user-level agent directory is canonical.
- Any regression where agents defined in singular `agent/` fail to load.

## Open questions / gaps

- Whether the singular `agent/` directory is officially supported or an accident of the pre-existing `annalist.md` layout remains unresolved, as in the earlier record.
- The exact cause of the user's initial invisibility (stale session cache vs. plural-vs-singular discovery) was not isolated; both directory and mode were changed together.
