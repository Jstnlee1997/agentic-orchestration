export const STATES = {
  INTAKE: "intake",
  DECOMPOSITION: "decomposition",
  ASSIGNMENT: "assignment",
  READY: "ready",
  IN_PROGRESS: "in_progress",
  WAITING_DEPENDENCY: "waiting_dependency",
  NEEDS_REVIEW: "needs_review",
  NEEDS_HUMAN_APPROVAL: "needs_human_approval",
  VERIFYING: "verifying",
  DONE: "done",
  BLOCKED: "blocked",
  FAILED_RECOVERY: "failed_recovery"
};

export const BOARD_COLUMNS = [
  { id: "ready", title: "Ready", states: [STATES.INTAKE, STATES.DECOMPOSITION, STATES.ASSIGNMENT, STATES.READY] },
  { id: "in-flight", title: "In Progress", states: [STATES.IN_PROGRESS] },
  { id: "waiting", title: "Waiting", states: [STATES.WAITING_DEPENDENCY] },
  { id: "review", title: "Review", states: [STATES.NEEDS_REVIEW] },
  { id: "approval", title: "Approval", states: [STATES.NEEDS_HUMAN_APPROVAL] },
  { id: "verify", title: "Verifying", states: [STATES.VERIFYING] },
  { id: "done", title: "Done", states: [STATES.DONE] },
  { id: "recovery", title: "Recovery", states: [STATES.BLOCKED, STATES.FAILED_RECOVERY] }
];

export const ROLE_META = {
  planner: { label: "Planner", accent: "#2563eb" },
  researcher: { label: "Researcher", accent: "#0891b2" },
  implementer: { label: "Implementer", accent: "#16a34a" },
  reviewer: { label: "Reviewer", accent: "#7c3aed" },
  verifier: { label: "Verifier", accent: "#ea580c" },
  documenter: { label: "Documenter", accent: "#475569" },
  operator: { label: "Operator", accent: "#dc2626" }
};

export const GATE_TYPES = {
  HUMAN_APPROVAL: "human_approval",
  TEST_PASS: "test_pass",
  REVIEW_PASS: "review_pass",
  EVIDENCE_REQUIRED: "evidence_required",
  DEPENDENCY_COMPLETE: "dependency_complete"
};

const terminalStates = new Set([STATES.DONE, STATES.FAILED_RECOVERY]);

export function createOrchestration(scenario) {
  const orchestration = clone(scenario);
  orchestration.createdAt ||= new Date().toISOString();
  orchestration.policy ||= {};
  orchestration.policy.maxRetries ??= 2;
  orchestration.policy.approvalRequiredBeforeExecution ??= false;
  orchestration.policy.verificationRequiredBeforeDone ??= true;
  orchestration.artifacts ||= [];
  orchestration.handoffs ||= [];
  orchestration.eventLog ||= [];
  orchestration.workItems = orchestration.workItems.map((item, index) => ({
    retryCount: 0,
    priority: index + 1,
    dependencies: [],
    gates: [],
    artifacts: [],
    acceptanceCriteria: [],
    ...item
  }));

  if (orchestration.eventLog.length === 0) {
    appendEvent(orchestration, "mission.created", `Orchestration created: ${orchestration.title}`, {
      status: orchestration.status
    });
  }

  return refreshDependencyStates(orchestration);
}

export function transitionWorkItem(orchestration, workItemId, nextState, options = {}) {
  const item = getWorkItem(orchestration, workItemId);
  if (!item) {
    throw new Error(`Unknown work item: ${workItemId}`);
  }

  if (terminalStates.has(item.state) && item.state !== nextState) {
    return orchestration;
  }

  if (nextState === STATES.IN_PROGRESS && !dependenciesComplete(orchestration, item)) {
    item.state = STATES.WAITING_DEPENDENCY;
    appendEvent(orchestration, "work.waiting", `${item.title} is waiting on dependencies`, {
      workItemId: item.id,
      dependencies: item.dependencies
    });
    return orchestration;
  }

  if (nextState === STATES.DONE) {
    const completion = canCompleteWorkItem(orchestration, item.id);
    if (!completion.ok) {
      item.state = completion.needsApproval ? STATES.NEEDS_HUMAN_APPROVAL : STATES.VERIFYING;
      appendEvent(orchestration, "gate.blocked", `${item.title} cannot finish: ${completion.reasons.join(", ")}`, {
        workItemId: item.id,
        reasons: completion.reasons
      });
      return orchestration;
    }
  }

  const previousState = item.state;
  item.state = nextState;
  item.updatedAt = new Date().toISOString();
  if (nextState === STATES.DONE) {
    item.completedAt = item.updatedAt;
  }

  appendEvent(orchestration, "work.transitioned", `${item.title} moved from ${formatState(previousState)} to ${formatState(nextState)}`, {
    actor: options.actor || item.ownerRole,
    workItemId: item.id,
    from: previousState,
    to: nextState,
    reason: options.reason || ""
  });

  return refreshDependencyStates(orchestration);
}

export function addArtifact(orchestration, artifact) {
  const enriched = {
    id: artifact.id || `artifact-${orchestration.artifacts.length + 1}`,
    createdAt: new Date().toISOString(),
    type: "summary",
    ...artifact
  };
  orchestration.artifacts.push(enriched);

  const item = getWorkItem(orchestration, enriched.workItemId);
  if (item && !item.artifacts.includes(enriched.id)) {
    item.artifacts.push(enriched.id);
  }

  appendEvent(orchestration, "artifact.added", `${enriched.type} artifact added for ${item?.title || "mission"}`, {
    artifactId: enriched.id,
    workItemId: enriched.workItemId,
    type: enriched.type
  });

  return enriched;
}

export function completeGate(orchestration, gateId, options = {}) {
  const gateRecord = findGate(orchestration, gateId);
  if (!gateRecord) {
    throw new Error(`Unknown gate: ${gateId}`);
  }

  gateRecord.gate.status = "passed";
  gateRecord.gate.evidenceId = options.evidenceId || gateRecord.gate.evidenceId || null;
  gateRecord.gate.completedAt = new Date().toISOString();

  appendEvent(orchestration, "gate.passed", `${gateRecord.gate.label} passed for ${gateRecord.item.title}`, {
    actor: options.actor || "verifier",
    gateId,
    workItemId: gateRecord.item.id,
    evidenceId: gateRecord.gate.evidenceId
  });

  return refreshDependencyStates(orchestration);
}

export function requestHumanApproval(orchestration, workItemId, label = "Human approval required") {
  const item = getWorkItem(orchestration, workItemId);
  if (!item) {
    throw new Error(`Unknown work item: ${workItemId}`);
  }

  let gate = item.gates.find((candidate) => candidate.type === GATE_TYPES.HUMAN_APPROVAL);
  if (!gate) {
    gate = { id: `${item.id}-approval`, type: GATE_TYPES.HUMAN_APPROVAL, label, status: "pending" };
    item.gates.push(gate);
  }
  gate.status = "pending";
  item.state = STATES.NEEDS_HUMAN_APPROVAL;

  appendEvent(orchestration, "approval.requested", `${item.title} needs human approval`, {
    workItemId: item.id,
    gateId: gate.id
  });

  return gate;
}

export function retryWorkItem(orchestration, workItemId, options = {}) {
  const item = getWorkItem(orchestration, workItemId);
  if (!item) {
    throw new Error(`Unknown work item: ${workItemId}`);
  }

  const maxRetries = orchestration.policy.maxRetries ?? 2;
  if (item.retryCount >= maxRetries) {
    item.state = STATES.FAILED_RECOVERY;
    appendEvent(orchestration, "work.failed", `${item.title} exceeded retry policy`, {
      workItemId: item.id,
      retryCount: item.retryCount,
      maxRetries
    });
    return orchestration;
  }

  item.retryCount += 1;
  item.state = dependenciesComplete(orchestration, item) ? STATES.READY : STATES.WAITING_DEPENDENCY;
  appendEvent(orchestration, "work.retried", `${item.title} retry ${item.retryCount} of ${maxRetries}`, {
    actor: options.actor || item.ownerRole,
    workItemId: item.id,
    retryCount: item.retryCount,
    reason: options.reason || ""
  });

  return refreshDependencyStates(orchestration);
}

export function handoffWorkItem(orchestration, workItemId, toRole, context, expectedOutput) {
  const item = getWorkItem(orchestration, workItemId);
  if (!item) {
    throw new Error(`Unknown work item: ${workItemId}`);
  }

  const fromRole = item.ownerRole;
  item.ownerRole = toRole;
  const handoff = {
    id: `handoff-${orchestration.handoffs.length + 1}`,
    createdAt: new Date().toISOString(),
    workItemId,
    fromRole,
    toRole,
    context,
    expectedOutput
  };
  orchestration.handoffs.push(handoff);

  appendEvent(orchestration, "handoff.created", `${item.title} handed from ${fromRole} to ${toRole}`, {
    handoffId: handoff.id,
    workItemId,
    fromRole,
    toRole
  });

  return handoff;
}

export function canCompleteWorkItem(orchestration, workItemId) {
  const item = getWorkItem(orchestration, workItemId);
  if (!item) {
    return { ok: false, reasons: ["Unknown work item"], needsApproval: false };
  }

  const reasons = [];
  let needsApproval = false;

  if (!dependenciesComplete(orchestration, item)) {
    reasons.push("dependencies are not complete");
  }

  for (const gate of item.gates) {
    if (gate.type === GATE_TYPES.DEPENDENCY_COMPLETE && dependenciesComplete(orchestration, item)) {
      continue;
    }
    if (gate.status !== "passed") {
      reasons.push(`${gate.label} gate is ${gate.status || "open"}`);
      needsApproval ||= gate.type === GATE_TYPES.HUMAN_APPROVAL;
    }
  }

  if (orchestration.policy.verificationRequiredBeforeDone && item.gates.some((gate) => gate.type === GATE_TYPES.TEST_PASS) === false) {
    const hasVerificationArtifact = orchestration.artifacts.some((artifact) =>
      artifact.workItemId === item.id && ["test-output", "screenshot", "verification"].includes(artifact.type)
    );
    if (!hasVerificationArtifact) {
      reasons.push("verification evidence is missing");
    }
  }

  return { ok: reasons.length === 0, reasons, needsApproval };
}

export function getBoardColumns(orchestration) {
  return BOARD_COLUMNS.map((column) => ({
    ...column,
    items: orchestration.workItems
      .filter((item) => column.states.includes(item.state))
      .sort((a, b) => a.priority - b.priority)
  }));
}

export function getAgentLanes(orchestration) {
  const roles = Object.keys(ROLE_META);
  return roles.map((role) => ({
    role,
    label: ROLE_META[role].label,
    accent: ROLE_META[role].accent,
    items: orchestration.workItems.filter((item) => item.ownerRole === role)
  })).filter((lane) => lane.items.length > 0);
}

export function getDependencyEdges(orchestration) {
  return orchestration.workItems.flatMap((item) =>
    item.dependencies.map((dependencyId) => ({
      from: dependencyId,
      to: item.id,
      fromTitle: getWorkItem(orchestration, dependencyId)?.title || dependencyId,
      toTitle: item.title,
      complete: getWorkItem(orchestration, dependencyId)?.state === STATES.DONE
    }))
  );
}

export function getHealth(orchestration) {
  const total = orchestration.workItems.length;
  const done = orchestration.workItems.filter((item) => item.state === STATES.DONE).length;
  const blocked = orchestration.workItems.filter((item) => [STATES.BLOCKED, STATES.FAILED_RECOVERY].includes(item.state)).length;
  const approvals = orchestration.workItems.filter((item) => item.state === STATES.NEEDS_HUMAN_APPROVAL).length;
  const verifying = orchestration.workItems.filter((item) => item.state === STATES.VERIFYING).length;
  const active = orchestration.workItems.filter((item) => [STATES.READY, STATES.IN_PROGRESS, STATES.NEEDS_REVIEW].includes(item.state)).length;
  const retriesUsed = orchestration.workItems.reduce((sum, item) => sum + item.retryCount, 0);
  const retryBudget = total * (orchestration.policy.maxRetries ?? 2);
  const itemsWithArtifacts = orchestration.workItems.filter((item) => item.artifacts.length > 0).length;

  return {
    total,
    done,
    blocked,
    approvals,
    verifying,
    active,
    retriesUsed,
    retryBudget,
    progress: total === 0 ? 0 : Math.round((done / total) * 100),
    evidenceCoverage: total === 0 ? 0 : Math.round((itemsWithArtifacts / total) * 100)
  };
}

export function formatState(state) {
  return state.replaceAll("_", " ");
}

export function getWorkItem(orchestration, workItemId) {
  return orchestration.workItems.find((item) => item.id === workItemId);
}

export function dependenciesComplete(orchestration, item) {
  return item.dependencies.every((dependencyId) => getWorkItem(orchestration, dependencyId)?.state === STATES.DONE);
}

export function refreshDependencyStates(orchestration) {
  for (const item of orchestration.workItems) {
    if (terminalStates.has(item.state) || [STATES.BLOCKED, STATES.NEEDS_HUMAN_APPROVAL].includes(item.state)) {
      continue;
    }

    if (!dependenciesComplete(orchestration, item)) {
      item.state = STATES.WAITING_DEPENDENCY;
      continue;
    }

    if (item.state === STATES.WAITING_DEPENDENCY) {
      item.state = STATES.READY;
      appendEvent(orchestration, "dependency.released", `${item.title} is ready because dependencies are complete`, {
        workItemId: item.id
      });
    }
  }

  return orchestration;
}

function appendEvent(orchestration, type, message, payload = {}) {
  orchestration.eventLog.push({
    id: `evt-${String(orchestration.eventLog.length + 1).padStart(3, "0")}`,
    at: new Date().toISOString(),
    type,
    message,
    payload
  });
}

function findGate(orchestration, gateId) {
  for (const item of orchestration.workItems) {
    const gate = item.gates.find((candidate) => candidate.id === gateId);
    if (gate) {
      return { item, gate };
    }
  }
  return null;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}
