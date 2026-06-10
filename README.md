# Agent Symphony Board

Agent Symphony Board is a local-first agent control plane for coordinating AI agents, human approvals, task dependencies, verification gates, retries, handoffs, and artifacts.

It turns a high-level goal into a live orchestration board that also produces agent-ready execution briefs. Instead of treating work as a linear checklist, the board behaves like a small command center: planners, researchers, implementers, reviewers, verifiers, documenters, and operators each own workstreams that can move in parallel, wait on dependencies, ask for approval, attach evidence, retry, fail, recover, and leave a durable event trail.

Memorable interaction model: **the Conductor listens for silence**. A work item is not done when someone says it is done. It is done when dependencies, gates, approvals, and evidence stop making noise.

## Current Repo Critique

This repository started as **Personal Composer**, a harness-style engineering workflow built around Markdown task artifacts.

### What Was Already Useful

- It established a durable source of truth for a task.
- It made state evidence-based instead of vibes-based.
- It named useful lifecycle steps: intake, spec, plan, coding, review, done, blocked.
- It encouraged scoped implementation, verification evidence, and handoff notes.
- The `money-saver-app/` sample showed realistic task artifacts connected to a small runnable app.

### Why It Was More Harness Than Orchestrator

- The workflow lived mainly in prose. There was no runtime orchestration model.
- A task was the highest-level unit. There was no mission, workstream, role, dependency graph, gate engine, or artifact registry.
- State transitions were manual conventions rather than product behavior.
- Parallelism was implied, not modeled.
- Handoffs, approvals, retries, and verification gates were text sections rather than first-class objects.
- The event history was a document log, not an append-only system timeline.

### Missing Orchestration Primitives

- `Orchestration`: top-level mission, policy, health, event log, and work graph.
- `AgentRole`: explicit owner roles such as planner, researcher, implementer, reviewer, verifier, documenter, and operator.
- `WorkItem`: dependency-aware unit of work with owner, state, gates, artifacts, retries, and acceptance criteria.
- `Handoff`: explicit transfer between roles with context and expected output.
- `Gate`: human approval, test pass, review pass, evidence required, or dependency complete.
- `Artifact`: plans, specs, diffs, test output, screenshots, summaries, docs.
- `Policy`: retry limits and required approvals or verification before done.
- `EventLog`: append-only decisions, state transitions, gate changes, retries, failures, completions, and handoffs.

## What This Is Now

The first product slice is a dependency-free local simulator and framework:

- A Kanban-style orchestration board.
- A Conductor health view with progress, active work, approvals, blockers, retry budget, and evidence coverage.
- Agent lanes grouped by role.
- A dependency view showing work graph edges.
- A compact event feed.
- A generic Skill/Capability model for agent execution guidance.
- `getNextAction(...)` recommendations for what should happen next.
- `getAgentBrief(...)` copy-paste briefs for the next AI agent or human operator.
- Policy-enforced transitions, including approval-before-execution.
- Scenario templates for feature shipping, landing pages, production bugs, and research reports.
- A small domain engine that can later sit behind real agent runners, LLM calls, CI checks, GitHub issues, or chat approvals.

No LLM API integration is required yet. The current app is intentionally local and understandable.

## Quick Start

```bash
npm install
npm test
npm start
```

Open:

```text
http://localhost:4173
```

`npm install` does not need to download runtime dependencies today; the app uses only Node and browser-native JavaScript.

## Repository Shape

```text
index.html
server.js
src/
  main.js                  # Browser UI and simulator actions
  orchestrationEngine.js   # Domain model, transitions, gates, events
  scenarios.js             # Rich example orchestration templates
  styles.css               # Product UI
  assets/
    conductor-mark.svg
tests/
  orchestrationEngine.test.js
money-saver-app/           # Historical sample app and task artifacts
agent-workflow.md          # Original harness workflow
task-template.md           # Original task artifact template
invocation-prompt.md       # Original prompt shape
```

## Core Concepts

### Orchestration

The top-level mission. It owns policy, work items, artifacts, handoffs, and the event log.

Example:

```js
{
  id: "ship-feature",
  title: "Ship a small feature with reviewer and verifier agents",
  policy: {
    maxRetries: 2,
    approvalRequiredBeforeExecution: true,
    verificationRequiredBeforeDone: true
  },
  workItems: [],
  artifacts: [],
  handoffs: [],
  eventLog: []
}
```

### AgentRole

Roles are stable responsibilities, not specific vendors or models:

- `planner`: turns goals into work structure.
- `researcher`: gathers context and constraints.
- `implementer`: changes code, content, or configuration.
- `reviewer`: checks quality, scope, and regressions.
- `verifier`: runs tests, captures evidence, and validates acceptance criteria.
- `documenter`: prepares summaries, release notes, and handoff docs.
- `operator`: handles approvals, release decisions, incidents, and recovery.

### Skill / Capability

Skills are generic execution capabilities. They are intentionally not tied to a company, plugin, model, or vendor.

Built-in skills:

- `requirement-clarification`
- `research-context`
- `planning`
- `implementation`
- `testing`
- `review`
- `verification`
- `documentation`
- `release-decision`

Work items can declare `requiredSkills` or `recommendedSkills`. If neither is present, the engine infers a skill from the owner role and current state.

### WorkItem

A work item is a coordinated unit of work:

```js
{
  id: "verify",
  title: "Verify behavior and evidence",
  ownerRole: "verifier",
  state: "waiting_dependency",
  dependencies: ["implement"],
  requiredSkills: ["verification", "testing"],
  acceptanceCriteria: ["Test output exists", "Manual QA notes exist"],
  gates: [
    { id: "verify-tests", type: "test_pass", label: "Focused tests", status: "open" }
  ],
  artifacts: [],
  retryCount: 0
}
```

### Handoff

A handoff is not just assignment reassignment. It records:

- From role.
- To role.
- Work item.
- Context.
- Expected output.
- Event log entry.

This makes transfer explicit enough for real agents or humans to resume without reconstructing the conversation.

### Gate

Gates decide whether work can advance:

- `human_approval`
- `test_pass`
- `review_pass`
- `evidence_required`
- `dependency_complete`

A done claim is rejected when required gates are still open.

### Next Action

`getNextAction(orchestration, workItemId)` turns board state into operating guidance:

- Recommended action.
- Recommended role.
- Recommended skill.
- Blockers.
- Required evidence.
- Allowed transitions.
- Short instruction text for the next agent.

This is the product hinge between "task board" and "agent control plane." A work item can always answer: what state am I in, who should handle me, what capability should they use, what should they read, what evidence is missing, and which transitions are currently allowed.

### Agent Brief

`getAgentBrief(orchestration, workItemId)` returns a copy-pasteable brief for an AI agent session.

Each brief includes:

- Mission title.
- Work item title.
- Current state.
- Recommended role and skill.
- Dependencies and their states.
- Gates and gate status.
- Artifacts to inspect.
- Acceptance criteria.
- Next action.
- Blockers.
- Required evidence.
- Allowed transitions.
- Completion rules.

Every work card has a **Brief** action that opens this generated handoff panel.

### Artifact

Artifacts are evidence and durable outputs:

- Plans
- Specs
- Diffs
- Test output
- Review notes
- Screenshots
- Summaries
- Release notes
- Incident notes

The board tracks evidence coverage so the mission can expose work that looks complete but has no proof.

### Policy

Policy turns preferences into guardrails:

- Max retries before recovery failure.
- Approval required before execution.
- Verification required before done.

The current simulator enforces retry budget, done-gate checks, verification evidence, and approval-before-execution. If `approvalRequiredBeforeExecution` is true, a work item with an open human approval gate cannot move into `in_progress`.

### EventLog

The event log is append-only mission memory:

- Mission created.
- Work transitioned.
- Dependencies released.
- Gate passed or blocked.
- Artifact attached.
- Approval requested.
- Handoff created.
- Retry used.
- Recovery failure reached.

## Board and State Model

The lifecycle supports parallel work:

| State | Meaning |
| --- | --- |
| `intake` | Mission or work is captured but not shaped. |
| `decomposition` | Goal is being broken into workstreams. |
| `assignment` | Ownership and dependencies are being set. |
| `ready` | Dependencies are satisfied and work can start. |
| `in_progress` | An agent or human is actively working. |
| `waiting_dependency` | The work is blocked by upstream work. |
| `needs_review` | Output exists and needs reviewer judgment. |
| `needs_human_approval` | A human decision is required. |
| `verifying` | Evidence, tests, or acceptance checks are being gathered. |
| `done` | Required gates and evidence are satisfied. |
| `blocked` | Progress needs a decision, dependency, or recovery action. |
| `failed_recovery` | Retry policy is exhausted and recovery is needed. |

Dependency release is automatic. When an upstream item reaches `done`, dependent work moves from `waiting_dependency` to `ready`.

## Example Orchestration

The default scenario is **Ship a small feature with reviewer and verifier agents**.

It decomposes into:

1. Planner frames the feature contract and waits for human scope approval.
2. Researcher inspects existing behavior.
3. Planner decomposes implementation beats after scope and research are complete.
4. Implementer builds the product slice and must attach diff evidence.
5. Reviewer checks regressions and must pass a review gate.
6. Verifier attaches test output and evidence.
7. Documenter prepares operator handoff.
8. Operator records the release decision behind a human approval gate.

Other built-in scenarios:

- **Build a landing page**: audience brief, visual references, wireframe, responsive build, copy review, visual QA.
- **Investigate a production bug**: triage, logs, hypothesis, patch, regression test, incident review.
- **Prepare a research report**: question framing, source gathering, synthesis, report draft, confidence review.

Use **Simulate Next Beat** to watch the mission advance through approvals, parallel-ready work, review, verification, dependency release, and done checks.

## Proposed Architecture

The product should evolve in layers:

### 1. Domain Engine

File: `src/orchestrationEngine.js`

Responsibilities:

- Hold orchestration state.
- Enforce dependency release.
- Enforce gates before done.
- Enforce approval-before-execution.
- Track retries and recovery failure.
- Attach artifacts.
- Record append-only events.
- Record handoffs.
- Recommend next actions.
- Generate copy-paste agent briefs.

### 2. Scenario and Decomposition Layer

File: `src/scenarios.js`

Responsibilities:

- Provide local templates for common mission types.
- Make decomposition understandable before adding real LLM calls.
- Later: swap template selection for model-assisted planning with human approval.

### 3. Product UI

File: `src/main.js`

Responsibilities:

- Render board columns.
- Render Conductor health.
- Render role lanes.
- Render dependencies.
- Render event log.
- Render Agent Brief panels on work cards.
- Provide local simulator actions.

### 4. Future Agent Runner Layer

Not implemented yet.

Possible adapters:

- LLM agent runner.
- GitHub issue or PR adapter.
- CI/test adapter.
- Browser QA adapter.
- Slack or email approval adapter.
- Artifact storage adapter.

## Implementation Plan

This first version was implemented in small steps:

1. Add a runtime orchestration model with roles, states, gates, artifacts, handoffs, policy, dependency release, retries, and event log.
2. Add rich example scenarios that feel like real coordinated missions.
3. Build a local board UI with Conductor health, Kanban columns, role lanes, dependency view, and event feed.
4. Add simulator actions for approval, start, review, verify, done, block, retry, and handoff.
5. Add focused tests for dependency release, gate enforcement, retry policy, handoffs, and health.
6. Add skills, next-action selection, agent brief generation, and approval-before-execution enforcement.
7. Rewrite this README so the product direction is clear.

## Why This Is Not Just A Task Tracker

A task tracker records work. Agent Symphony Board coordinates work.

The difference:

- Dependencies are executable, not just labels.
- Done requires gates and evidence, not only a status change.
- Handoffs preserve context and expected output.
- Retry budget is explicit.
- Agent roles are first-class.
- Skills make agent capability expectations explicit.
- Agent Briefs turn board state into copy-paste execution instructions.
- Artifacts are attached to the work graph.
- The event log becomes mission memory.
- The Conductor view shows orchestration health, not just task count.

## Verification

Run:

```bash
npm test
```

Current test coverage checks:

- Dependency release.
- Gate enforcement before done.
- Retry exhaustion into recovery failure.
- Explicit handoff records.
- Mission health summaries.
- Next-action selection.
- Skill recommendation.
- Agent brief generation.
- Approval-before-execution enforcement.
- Blocked next actions when gates or evidence are missing.

## Future Roadmap

- Drag-and-drop board transitions.
- Real decomposition assistant with approval before execution.
- Persistent mission storage.
- Import existing Markdown task artifacts into work items.
- Evidence upload for screenshots, test logs, diffs, and docs.
- Human approval inbox.
- Agent execution adapters.
- Agent Brief export and copy-to-clipboard.
- CI adapter that can pass or fail gates automatically.
- GitHub issue and pull request synchronization.
- Timeline view with critical path and idle-time detection.
- Policy editor for different mission types.
- Multi-mission dashboard.

## Historical Workflow

The original Personal Composer files remain in the repo:

- `agent-workflow.md`
- `task-template.md`
- `invocation-prompt.md`
- `money-saver-app/docs/tasks/`

Those files are still useful as source material. The product direction is now to lift their best discipline into a real orchestration surface.
