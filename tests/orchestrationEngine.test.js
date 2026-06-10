import assert from "node:assert/strict";
import test from "node:test";
import {
  GATE_TYPES,
  SKILLS,
  STATES,
  addArtifact,
  canCompleteWorkItem,
  completeGate,
  createOrchestration,
  getAgentBrief,
  getHealth,
  getNextAction,
  getWorkItem,
  handoffWorkItem,
  retryWorkItem,
  transitionWorkItem
} from "../src/orchestrationEngine.js";
import { scenarios } from "../src/scenarios.js";

test("dependency states release when upstream work completes", () => {
  const orchestration = createOrchestration({
    id: "dependency-test",
    title: "Dependency test",
    policy: { maxRetries: 2, verificationRequiredBeforeDone: false },
    workItems: [
      { id: "a", title: "A", ownerRole: "planner", state: STATES.READY },
      { id: "b", title: "B", ownerRole: "implementer", state: STATES.WAITING_DEPENDENCY, dependencies: ["a"] }
    ]
  });

  transitionWorkItem(orchestration, "a", STATES.DONE);

  assert.equal(getWorkItem(orchestration, "b").state, STATES.READY);
  assert.equal(orchestration.eventLog.at(-1).type, "dependency.released");
});

test("open gates prevent a work item from being marked done", () => {
  const orchestration = createOrchestration({
    id: "gate-test",
    title: "Gate test",
    policy: { maxRetries: 2, verificationRequiredBeforeDone: true },
    workItems: [
      {
        id: "verify",
        title: "Verify",
        ownerRole: "verifier",
        state: STATES.VERIFYING,
        gates: [{ id: "tests", type: GATE_TYPES.TEST_PASS, label: "Tests", status: "open" }]
      }
    ]
  });

  transitionWorkItem(orchestration, "verify", STATES.DONE);

  assert.equal(getWorkItem(orchestration, "verify").state, STATES.VERIFYING);
  assert.deepEqual(canCompleteWorkItem(orchestration, "verify").ok, false);

  const artifact = addArtifact(orchestration, {
    workItemId: "verify",
    type: "test-output",
    title: "Focused test output"
  });
  completeGate(orchestration, "tests", { evidenceId: artifact.id });
  transitionWorkItem(orchestration, "verify", STATES.DONE);

  assert.equal(getWorkItem(orchestration, "verify").state, STATES.DONE);
});

test("retry policy moves exhausted work into recovery failure", () => {
  const orchestration = createOrchestration({
    id: "retry-test",
    title: "Retry test",
    policy: { maxRetries: 1, verificationRequiredBeforeDone: false },
    workItems: [
      { id: "patch", title: "Patch", ownerRole: "implementer", state: STATES.BLOCKED }
    ]
  });

  retryWorkItem(orchestration, "patch");
  assert.equal(getWorkItem(orchestration, "patch").state, STATES.READY);

  transitionWorkItem(orchestration, "patch", STATES.BLOCKED);
  retryWorkItem(orchestration, "patch");
  assert.equal(getWorkItem(orchestration, "patch").state, STATES.FAILED_RECOVERY);
});

test("handoffs preserve explicit transfer context and update ownership", () => {
  const orchestration = createOrchestration(scenarios[0]);

  const handoff = handoffWorkItem(
    orchestration,
    "implement",
    "verifier",
    "Implementation is ready for independent checks.",
    "Attach screenshots and test output."
  );

  assert.equal(getWorkItem(orchestration, "implement").ownerRole, "verifier");
  assert.equal(orchestration.handoffs[0].id, handoff.id);
  assert.equal(orchestration.eventLog.at(-1).type, "handoff.created");
});

test("health summarizes mission risks and evidence coverage", () => {
  const orchestration = createOrchestration(scenarios[0]);
  const health = getHealth(orchestration);

  assert.equal(health.total, 8);
  assert.equal(health.approvals, 1);
  assert.equal(health.active, 1);
  assert.equal(health.evidenceCoverage, 13);
});

test("next-action selection recommends approval when a human gate is pending", () => {
  const orchestration = createOrchestration(scenarios[0]);
  const nextAction = getNextAction(orchestration, "scope");

  assert.equal(nextAction.recommendedAction, "Collect human approval");
  assert.equal(nextAction.recommendedRole, "operator");
  assert.equal(nextAction.recommendedSkill, SKILLS.RELEASE_DECISION);
  assert.deepEqual(nextAction.allowedTransitions, []);
  assert.match(nextAction.blockers.join("\n"), /Scope approval/);
});

test("skill recommendation falls back to the owner role when no item skill is provided", () => {
  const orchestration = createOrchestration({
    id: "skill-test",
    title: "Skill test",
    policy: { verificationRequiredBeforeDone: false },
    workItems: [
      { id: "build", title: "Build", ownerRole: "implementer", state: STATES.READY }
    ]
  });

  assert.equal(getNextAction(orchestration, "build").recommendedSkill, SKILLS.IMPLEMENTATION);
  assert.deepEqual(getWorkItem(orchestration, "build").recommendedSkills, [SKILLS.IMPLEMENTATION]);
});

test("agent brief includes mission context, gates, artifacts, next action, and completion rules", () => {
  const orchestration = createOrchestration(scenarios[0]);
  const brief = getAgentBrief(orchestration, "research");

  assert.match(brief, /Agent Brief/);
  assert.match(brief, /Mission: Ship a small feature/);
  assert.match(brief, /Work item: Inspect existing behavior/);
  assert.match(brief, /Recommended skill: Research context/);
  assert.match(brief, /Existing behavior map/);
  assert.match(brief, /Acceptance criteria:/);
  assert.match(brief, /Completion rules:/);
});

test("approval-before-execution policy blocks in-progress transition until approval passes", () => {
  const orchestration = createOrchestration({
    id: "approval-policy-test",
    title: "Approval policy test",
    policy: { approvalRequiredBeforeExecution: true, verificationRequiredBeforeDone: false },
    workItems: [
      {
        id: "dangerous",
        title: "Dangerous execution",
        ownerRole: "operator",
        state: STATES.READY,
        gates: [{ id: "exec-approval", type: GATE_TYPES.HUMAN_APPROVAL, label: "Execution approval", status: "pending" }]
      }
    ]
  });

  transitionWorkItem(orchestration, "dangerous", STATES.IN_PROGRESS);

  assert.equal(getWorkItem(orchestration, "dangerous").state, STATES.NEEDS_HUMAN_APPROVAL);
  assert.equal(orchestration.eventLog.at(-1).type, "policy.blocked");

  completeGate(orchestration, "exec-approval", { actor: "human" });
  transitionWorkItem(orchestration, "dangerous", STATES.READY);
  transitionWorkItem(orchestration, "dangerous", STATES.IN_PROGRESS);

  assert.equal(getWorkItem(orchestration, "dangerous").state, STATES.IN_PROGRESS);
});

test("next action is blocked when gates and evidence are missing", () => {
  const orchestration = createOrchestration({
    id: "blocked-next-action-test",
    title: "Blocked next action test",
    policy: { verificationRequiredBeforeDone: true },
    workItems: [
      {
        id: "verify",
        title: "Verify",
        ownerRole: "verifier",
        state: STATES.VERIFYING,
        gates: [
          { id: "test-gate", type: GATE_TYPES.TEST_PASS, label: "Focused tests", status: "open" },
          { id: "evidence-gate", type: GATE_TYPES.EVIDENCE_REQUIRED, label: "Evidence bundle", status: "open" }
        ]
      }
    ]
  });

  const nextAction = getNextAction(orchestration, "verify");

  assert.equal(nextAction.recommendedAction, "Attach verification evidence and close gates");
  assert.deepEqual(nextAction.allowedTransitions, [STATES.BLOCKED]);
  assert.match(nextAction.blockers.join("\n"), /Focused tests gate is open/);
  assert.match(nextAction.requiredEvidence.join("\n"), /passing test output/);
  assert.match(nextAction.requiredEvidence.join("\n"), /supporting artifact/);
});
