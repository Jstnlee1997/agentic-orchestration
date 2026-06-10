import { GATE_TYPES, STATES } from "./orchestrationEngine.js";

const defaultPolicy = {
  maxRetries: 2,
  approvalRequiredBeforeExecution: true,
  verificationRequiredBeforeDone: true
};

export const scenarios = [
  {
    id: "ship-feature",
    title: "Ship a small feature with reviewer and verifier agents",
    metaphor: "The Conductor listens for silence: no work is done until dependencies, approvals, and evidence stop making noise.",
    status: "active",
    policy: defaultPolicy,
    workItems: [
      {
        id: "scope",
        title: "Frame the feature contract",
        ownerRole: "planner",
        state: STATES.NEEDS_HUMAN_APPROVAL,
        acceptanceCriteria: ["User value is stated", "Non-goals are explicit", "Approval gate is passed"],
        gates: [
          { id: "scope-approval", type: GATE_TYPES.HUMAN_APPROVAL, label: "Scope approval", status: "pending" }
        ]
      },
      {
        id: "research",
        title: "Inspect existing behavior",
        ownerRole: "researcher",
        state: STATES.IN_PROGRESS,
        acceptanceCriteria: ["Relevant files are named", "Risks are recorded"],
        artifacts: ["artifact-research-notes"]
      },
      {
        id: "plan",
        title: "Decompose into implementation beats",
        ownerRole: "planner",
        state: STATES.WAITING_DEPENDENCY,
        dependencies: ["scope", "research"],
        acceptanceCriteria: ["Tasks are independently verifiable", "Dependencies are linked"]
      },
      {
        id: "implement",
        title: "Implement the product slice",
        ownerRole: "implementer",
        state: STATES.WAITING_DEPENDENCY,
        dependencies: ["plan"],
        acceptanceCriteria: ["Code is scoped", "Artifacts include a diff summary"],
        gates: [
          { id: "implement-evidence", type: GATE_TYPES.EVIDENCE_REQUIRED, label: "Diff evidence", status: "open" }
        ]
      },
      {
        id: "review",
        title: "Review for regressions",
        ownerRole: "reviewer",
        state: STATES.WAITING_DEPENDENCY,
        dependencies: ["implement"],
        acceptanceCriteria: ["Review notes are attached", "No unresolved severity-one findings"],
        gates: [
          { id: "review-pass", type: GATE_TYPES.REVIEW_PASS, label: "Review pass", status: "open" }
        ]
      },
      {
        id: "verify",
        title: "Verify behavior and evidence",
        ownerRole: "verifier",
        state: STATES.WAITING_DEPENDENCY,
        dependencies: ["implement"],
        acceptanceCriteria: ["Test output exists", "Manual QA notes exist"],
        gates: [
          { id: "verify-tests", type: GATE_TYPES.TEST_PASS, label: "Focused tests", status: "open" },
          { id: "verify-evidence", type: GATE_TYPES.EVIDENCE_REQUIRED, label: "Evidence bundle", status: "open" }
        ]
      },
      {
        id: "handoff",
        title: "Prepare operator handoff",
        ownerRole: "documenter",
        state: STATES.WAITING_DEPENDENCY,
        dependencies: ["review", "verify"],
        acceptanceCriteria: ["Release notes are concise", "Known risks are named"]
      },
      {
        id: "ship",
        title: "Release decision",
        ownerRole: "operator",
        state: STATES.WAITING_DEPENDENCY,
        dependencies: ["handoff"],
        acceptanceCriteria: ["Go/no-go is recorded", "Rollback note exists"],
        gates: [
          { id: "ship-approval", type: GATE_TYPES.HUMAN_APPROVAL, label: "Release approval", status: "pending" }
        ]
      }
    ],
    artifacts: [
      {
        id: "artifact-research-notes",
        workItemId: "research",
        type: "research-notes",
        title: "Existing behavior map",
        body: "Routes, tests, and risky shared modules identified."
      }
    ],
    handoffs: [],
    eventLog: []
  },
  {
    id: "landing-page",
    title: "Build a landing page",
    metaphor: "The board treats creative work like a score: research sets tempo, implementation adds melody, verification checks the room can hear it.",
    status: "active",
    policy: defaultPolicy,
    workItems: [
      { id: "brief", title: "Clarify audience and offer", ownerRole: "planner", state: STATES.READY, acceptanceCriteria: ["Audience named", "Primary action selected"] },
      { id: "market-scan", title: "Collect visual references", ownerRole: "researcher", state: STATES.READY, acceptanceCriteria: ["Three references summarized"] },
      { id: "wireframe", title: "Draft page structure", ownerRole: "planner", state: STATES.WAITING_DEPENDENCY, dependencies: ["brief", "market-scan"], acceptanceCriteria: ["Sections fit first viewport", "CTA path is clear"] },
      { id: "build", title: "Build responsive page", ownerRole: "implementer", state: STATES.WAITING_DEPENDENCY, dependencies: ["wireframe"], acceptanceCriteria: ["Desktop and mobile layouts work"], gates: [{ id: "build-evidence", type: GATE_TYPES.EVIDENCE_REQUIRED, label: "Screenshot evidence", status: "open" }] },
      { id: "copy-review", title: "Review conversion copy", ownerRole: "reviewer", state: STATES.WAITING_DEPENDENCY, dependencies: ["build"], acceptanceCriteria: ["Headline names the offer", "No placeholder copy"] },
      { id: "visual-qa", title: "Verify visual quality", ownerRole: "verifier", state: STATES.WAITING_DEPENDENCY, dependencies: ["build"], acceptanceCriteria: ["No overlap", "Assets render"], gates: [{ id: "visual-qa-pass", type: GATE_TYPES.TEST_PASS, label: "Browser QA", status: "open" }] }
    ],
    artifacts: [],
    handoffs: [],
    eventLog: []
  },
  {
    id: "production-bug",
    title: "Investigate a production bug",
    metaphor: "Recovery mode is a quiet incident room: every retry burns budget and every claim needs evidence.",
    status: "active",
    policy: { ...defaultPolicy, maxRetries: 3 },
    workItems: [
      { id: "triage", title: "Capture impact and blast radius", ownerRole: "operator", state: STATES.IN_PROGRESS, acceptanceCriteria: ["Affected users named", "Severity set"] },
      { id: "logs", title: "Collect logs and reproduction facts", ownerRole: "researcher", state: STATES.READY, acceptanceCriteria: ["Repro path exists", "Logs attached"] },
      { id: "hypothesis", title: "Form failure hypothesis", ownerRole: "planner", state: STATES.WAITING_DEPENDENCY, dependencies: ["triage", "logs"], acceptanceCriteria: ["Likely cause named", "Fallback plan exists"] },
      { id: "patch", title: "Patch narrowest cause", ownerRole: "implementer", state: STATES.WAITING_DEPENDENCY, dependencies: ["hypothesis"], acceptanceCriteria: ["Fix is scoped", "Regression test added"], gates: [{ id: "patch-tests", type: GATE_TYPES.TEST_PASS, label: "Regression test", status: "open" }] },
      { id: "incident-review", title: "Review incident narrative", ownerRole: "reviewer", state: STATES.WAITING_DEPENDENCY, dependencies: ["patch"], acceptanceCriteria: ["Root cause is clear", "Follow-up is assigned"] }
    ],
    artifacts: [],
    handoffs: [],
    eventLog: []
  },
  {
    id: "research-report",
    title: "Prepare a research report",
    metaphor: "The Conductor keeps sources, synthesis, review, and final packaging from pretending they are the same job.",
    status: "active",
    policy: { ...defaultPolicy, approvalRequiredBeforeExecution: false },
    workItems: [
      { id: "question", title: "Shape research question", ownerRole: "planner", state: STATES.READY, acceptanceCriteria: ["Question is answerable", "Audience is named"] },
      { id: "sources", title: "Gather source set", ownerRole: "researcher", state: STATES.WAITING_DEPENDENCY, dependencies: ["question"], acceptanceCriteria: ["Sources are credible", "Contradictions are noted"] },
      { id: "synthesis", title: "Synthesize findings", ownerRole: "researcher", state: STATES.WAITING_DEPENDENCY, dependencies: ["sources"], acceptanceCriteria: ["Claims cite evidence", "Unknowns remain visible"] },
      { id: "draft", title: "Draft report", ownerRole: "documenter", state: STATES.WAITING_DEPENDENCY, dependencies: ["synthesis"], acceptanceCriteria: ["Executive summary exists", "Recommendations are distinct"] },
      { id: "review-report", title: "Review for confidence and gaps", ownerRole: "reviewer", state: STATES.WAITING_DEPENDENCY, dependencies: ["draft"], acceptanceCriteria: ["Weak claims are flagged"], gates: [{ id: "report-review-pass", type: GATE_TYPES.REVIEW_PASS, label: "Review pass", status: "open" }] }
    ],
    artifacts: [],
    handoffs: [],
    eventLog: []
  }
];
