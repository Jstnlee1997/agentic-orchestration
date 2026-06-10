import assert from "node:assert/strict";
import test from "node:test";
import {
  GATE_TYPES,
  STATES,
  addArtifact,
  canCompleteWorkItem,
  completeGate,
  createOrchestration,
  getHealth,
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
