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

export const SKILLS = {
  REQUIREMENT_CLARIFICATION: "requirement-clarification",
  RESEARCH_CONTEXT: "research-context",
  PLANNING: "planning",
  IMPLEMENTATION: "implementation",
  TESTING: "testing",
  REVIEW: "review",
  VERIFICATION: "verification",
  DOCUMENTATION: "documentation",
  RELEASE_DECISION: "release-decision"
};

export const SKILL_META = {
  [SKILLS.REQUIREMENT_CLARIFICATION]: {
    label: "Requirement clarification",
    description: "Clarify goals, constraints, assumptions, and non-goals before execution."
  },
  [SKILLS.RESEARCH_CONTEXT]: {
    label: "Research context",
    description: "Inspect source material, existing behavior, risks, and relevant artifacts."
  },
  [SKILLS.PLANNING]: {
    label: "Planning",
    description: "Decompose a mission into scoped, dependency-aware work."
  },
  [SKILLS.IMPLEMENTATION]: {
    label: "Implementation",
    description: "Change code, content, configuration, or other deliverables."
  },
  [SKILLS.TESTING]: {
    label: "Testing",
    description: "Run focused tests and capture test output."
  },
  [SKILLS.REVIEW]: {
    label: "Review",
    description: "Evaluate output for scope, regressions, quality, and unresolved findings."
  },
  [SKILLS.VERIFICATION]: {
    label: "Verification",
    description: "Check acceptance criteria and attach evidence before completion."
  },
  [SKILLS.DOCUMENTATION]: {
    label: "Documentation",
    description: "Prepare handoffs, summaries, release notes, or operator-facing docs."
  },
  [SKILLS.RELEASE_DECISION]: {
    label: "Release decision",
    description: "Make or request human go/no-go decisions and recovery calls."
  }
};

const ROLE_DEFAULT_SKILL = {
  planner: SKILLS.PLANNING,
  researcher: SKILLS.RESEARCH_CONTEXT,
  implementer: SKILLS.IMPLEMENTATION,
  reviewer: SKILLS.REVIEW,
  verifier: SKILLS.VERIFICATION,
  documenter: SKILLS.DOCUMENTATION,
  operator: SKILLS.RELEASE_DECISION
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
    requiredSkills: [],
    recommendedSkills: [],
    ...item
  })).map((item) => ({
    ...item,
    recommendedSkills: item.recommendedSkills.length > 0
      ? item.recommendedSkills
      : [recommendSkillForItem(item)]
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

  if (nextState === STATES.IN_PROGRESS && !executionApprovalSatisfied(orchestration, item)) {
    item.state = STATES.NEEDS_HUMAN_APPROVAL;
    appendEvent(orchestration, "policy.blocked", `${item.title} cannot start until approval gates pass`, {
      workItemId: item.id,
      policy: "approvalRequiredBeforeExecution",
      gates: item.gates.filter((gate) => gate.type === GATE_TYPES.HUMAN_APPROVAL && gate.status !== "passed").map((gate) => gate.id)
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

export function getNextAction(orchestration, workItemId) {
  const item = getWorkItem(orchestration, workItemId);
  if (!item) {
    return {
      recommendedAction: "Work item not found",
      recommendedRole: "operator",
      recommendedSkill: SKILLS.RELEASE_DECISION,
      blockers: ["Unknown work item"],
      requiredEvidence: [],
      allowedTransitions: [],
      instruction: `Stop and resolve the unknown work item id: ${workItemId}.`
    };
  }

  const dependencies = getDependencyStatus(orchestration, item);
  const openGates = getOpenGates(item);
  const blockers = [];
  const requiredEvidence = getRequiredEvidence(orchestration, item);
  let recommendedRole = item.ownerRole;
  let recommendedSkill = recommendSkillForItem(item);
  let recommendedAction = "Continue work";
  let allowedTransitions = [];

  if (dependencies.incomplete.length > 0) {
    blockers.push(...dependencies.incomplete.map((dependency) => `Waiting on dependency: ${dependency.title}`));
  }

  if (item.state === STATES.DONE) {
    recommendedAction = "No action needed";
    allowedTransitions = [];
    recommendedSkill = SKILLS.VERIFICATION;
  } else if (item.state === STATES.FAILED_RECOVERY) {
    recommendedAction = "Escalate recovery";
    recommendedRole = "operator";
    recommendedSkill = SKILLS.RELEASE_DECISION;
    blockers.push("Retry policy is exhausted");
  } else if (item.state === STATES.BLOCKED) {
    recommendedAction = "Diagnose blocker and retry or recover";
    recommendedSkill = SKILLS.PLANNING;
    allowedTransitions = retryAllowed(orchestration, item) ? [STATES.READY, STATES.WAITING_DEPENDENCY, STATES.FAILED_RECOVERY] : [STATES.FAILED_RECOVERY];
  } else if (item.state === STATES.NEEDS_HUMAN_APPROVAL) {
    recommendedAction = "Collect human approval";
    recommendedRole = "operator";
    recommendedSkill = SKILLS.RELEASE_DECISION;
    blockers.push(...openGates.filter((gate) => gate.type === GATE_TYPES.HUMAN_APPROVAL).map((gate) => `Approval gate pending: ${gate.label}`));
    allowedTransitions = openGates.some((gate) => gate.type === GATE_TYPES.HUMAN_APPROVAL) ? [] : [STATES.READY];
  } else if (dependencies.incomplete.length > 0) {
    recommendedAction = "Wait for dependency completion";
    recommendedSkill = SKILLS.RESEARCH_CONTEXT;
    allowedTransitions = [STATES.BLOCKED];
  } else if ([STATES.INTAKE, STATES.DECOMPOSITION].includes(item.state)) {
    recommendedAction = "Clarify and decompose the work";
    recommendedSkill = item.state === STATES.INTAKE ? SKILLS.REQUIREMENT_CLARIFICATION : SKILLS.PLANNING;
    allowedTransitions = [STATES.ASSIGNMENT, STATES.READY, STATES.BLOCKED];
  } else if (item.state === STATES.ASSIGNMENT) {
    recommendedAction = "Assign owner, skills, gates, and dependencies";
    recommendedSkill = SKILLS.PLANNING;
    allowedTransitions = [STATES.READY, STATES.BLOCKED];
  } else if (item.state === STATES.READY) {
    recommendedAction = "Start execution";
    allowedTransitions = [STATES.IN_PROGRESS, STATES.BLOCKED];
    if (!executionApprovalSatisfied(orchestration, item)) {
      recommendedAction = "Collect execution approval before starting";
      recommendedRole = "operator";
      recommendedSkill = SKILLS.RELEASE_DECISION;
      blockers.push(...openGates.filter((gate) => gate.type === GATE_TYPES.HUMAN_APPROVAL).map((gate) => `Approval gate pending: ${gate.label}`));
      allowedTransitions = [STATES.NEEDS_HUMAN_APPROVAL, STATES.BLOCKED];
    }
  } else if (item.state === STATES.IN_PROGRESS) {
    recommendedAction = "Produce the expected output artifact";
    allowedTransitions = [STATES.NEEDS_REVIEW, STATES.VERIFYING, STATES.BLOCKED];
    if (item.gates.some((gate) => gate.type === GATE_TYPES.EVIDENCE_REQUIRED && gate.status !== "passed")) {
      recommendedAction = "Attach required evidence before review";
    }
  } else if (item.state === STATES.NEEDS_REVIEW) {
    recommendedAction = "Run review and record findings";
    recommendedRole = "reviewer";
    recommendedSkill = SKILLS.REVIEW;
    allowedTransitions = [STATES.VERIFYING, STATES.BLOCKED];
    blockers.push(...openGates.filter((gate) => gate.type === GATE_TYPES.REVIEW_PASS).map((gate) => `Review gate pending: ${gate.label}`));
  } else if (item.state === STATES.VERIFYING) {
    recommendedAction = "Attach verification evidence and close gates";
    recommendedRole = "verifier";
    recommendedSkill = SKILLS.VERIFICATION;
    allowedTransitions = canCompleteWorkItem(orchestration, item.id).ok ? [STATES.DONE, STATES.BLOCKED] : [STATES.BLOCKED];
    blockers.push(...canCompleteWorkItem(orchestration, item.id).reasons);
  }

  const instruction = buildInstruction({
    item,
    recommendedAction,
    recommendedRole,
    recommendedSkill,
    blockers,
    requiredEvidence,
    allowedTransitions
  });

  return {
    recommendedAction,
    recommendedRole,
    recommendedSkill,
    blockers: unique(blockers),
    requiredEvidence: unique(requiredEvidence),
    allowedTransitions: unique(allowedTransitions),
    instruction
  };
}

export function getAgentBrief(orchestration, workItemId) {
  const item = getWorkItem(orchestration, workItemId);
  if (!item) {
    return `Agent Brief\n\nMission: ${orchestration.title}\nWork item: ${workItemId}\n\nThis work item does not exist. Stop and ask the operator to reconcile the orchestration state.`;
  }

  const nextAction = getNextAction(orchestration, workItemId);
  const dependencies = getDependencyStatus(orchestration, item);
  const artifacts = getArtifactsToInspect(orchestration, item);
  const gateLines = item.gates.length > 0
    ? item.gates.map((gate) => `- ${gate.label} (${gate.type}): ${gate.status || "open"}`).join("\n")
    : "- None";
  const artifactLines = artifacts.length > 0
    ? artifacts.map((artifact) => `- ${artifact.title} [${artifact.type}]${artifact.body ? `: ${artifact.body}` : ""}`).join("\n")
    : "- None yet";
  const dependencyLines = item.dependencies.length > 0
    ? dependencies.all.map((dependency) => `- ${dependency.title}: ${dependency.state}`).join("\n")
    : "- None";
  const criteriaLines = item.acceptanceCriteria.length > 0
    ? item.acceptanceCriteria.map((criterion) => `- ${criterion}`).join("\n")
    : "- No explicit acceptance criteria recorded";

  return [
    "Agent Brief",
    "",
    `Mission: ${orchestration.title}`,
    `Work item: ${item.title}`,
    `Current state: ${formatState(item.state)}`,
    `Recommended role: ${ROLE_META[nextAction.recommendedRole]?.label || nextAction.recommendedRole}`,
    `Recommended skill: ${SKILL_META[nextAction.recommendedSkill]?.label || nextAction.recommendedSkill}`,
    "",
    "Dependencies:",
    dependencyLines,
    "",
    "Gates:",
    gateLines,
    "",
    "Artifacts to inspect:",
    artifactLines,
    "",
    "Acceptance criteria:",
    criteriaLines,
    "",
    "Next action:",
    `- ${nextAction.recommendedAction}`,
    `- ${nextAction.instruction}`,
    "",
    "Blockers:",
    nextAction.blockers.length > 0 ? nextAction.blockers.map((blocker) => `- ${blocker}`).join("\n") : "- None",
    "",
    "Required evidence before advancing:",
    nextAction.requiredEvidence.length > 0 ? nextAction.requiredEvidence.map((evidence) => `- ${evidence}`).join("\n") : "- No additional evidence required for the next transition",
    "",
    "Allowed transitions:",
    nextAction.allowedTransitions.length > 0 ? nextAction.allowedTransitions.map((transition) => `- ${formatState(transition)}`).join("\n") : "- None until blockers are cleared",
    "",
    "Completion rules:",
    "- Do not mark this work item done until dependencies are complete.",
    "- Do not mark this work item done while required gates are open.",
    "- Attach or reference the required evidence before advancing.",
    "- If the needed evidence cannot be produced, move to blocked and explain the recovery path."
  ].join("\n");
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

export function executionApprovalSatisfied(orchestration, item) {
  if (!orchestration.policy.approvalRequiredBeforeExecution) {
    return true;
  }
  const approvalGates = item.gates.filter((gate) => gate.type === GATE_TYPES.HUMAN_APPROVAL);
  return approvalGates.length === 0 || approvalGates.every((gate) => gate.status === "passed");
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

function recommendSkillForItem(item) {
  if (item.requiredSkills?.length > 0) {
    return item.requiredSkills[0];
  }
  if (item.recommendedSkills?.length > 0) {
    return item.recommendedSkills[0];
  }
  if (item.state === STATES.INTAKE) {
    return SKILLS.REQUIREMENT_CLARIFICATION;
  }
  if (item.state === STATES.NEEDS_REVIEW) {
    return SKILLS.REVIEW;
  }
  if (item.state === STATES.VERIFYING) {
    return SKILLS.VERIFICATION;
  }
  if (item.state === STATES.NEEDS_HUMAN_APPROVAL) {
    return SKILLS.RELEASE_DECISION;
  }
  return ROLE_DEFAULT_SKILL[item.ownerRole] || SKILLS.PLANNING;
}

function getDependencyStatus(orchestration, item) {
  const all = item.dependencies.map((dependencyId) => {
    const dependency = getWorkItem(orchestration, dependencyId);
    return {
      id: dependencyId,
      title: dependency?.title || dependencyId,
      state: dependency?.state || "missing",
      complete: dependency?.state === STATES.DONE
    };
  });
  return {
    all,
    incomplete: all.filter((dependency) => !dependency.complete)
  };
}

function getOpenGates(item) {
  return item.gates.filter((gate) => gate.status !== "passed");
}

function getRequiredEvidence(orchestration, item) {
  const evidence = [];
  for (const gate of getOpenGates(item)) {
    if (gate.type === GATE_TYPES.HUMAN_APPROVAL) {
      evidence.push(`${gate.label}: approval decision`);
    } else if (gate.type === GATE_TYPES.TEST_PASS) {
      evidence.push(`${gate.label}: passing test output`);
    } else if (gate.type === GATE_TYPES.REVIEW_PASS) {
      evidence.push(`${gate.label}: review notes and pass decision`);
    } else if (gate.type === GATE_TYPES.EVIDENCE_REQUIRED) {
      evidence.push(`${gate.label}: supporting artifact`);
    } else if (gate.type === GATE_TYPES.DEPENDENCY_COMPLETE) {
      evidence.push(`${gate.label}: dependency completion`);
    }
  }

  if (
    item.state === STATES.VERIFYING &&
    orchestration.policy.verificationRequiredBeforeDone &&
    item.gates.some((gate) => gate.type === GATE_TYPES.TEST_PASS) === false
  ) {
    const hasVerificationArtifact = orchestration.artifacts.some((artifact) =>
      artifact.workItemId === item.id && ["test-output", "screenshot", "verification"].includes(artifact.type)
    );
    if (!hasVerificationArtifact) {
      evidence.push("Verification artifact: test output, screenshot, or verification note");
    }
  }

  return evidence;
}

function getArtifactsToInspect(orchestration, item) {
  const dependencyArtifactIds = item.dependencies.flatMap((dependencyId) => getWorkItem(orchestration, dependencyId)?.artifacts || []);
  const artifactIds = unique([...item.artifacts, ...dependencyArtifactIds]);
  return artifactIds.map((artifactId) => orchestration.artifacts.find((artifact) => artifact.id === artifactId)).filter(Boolean);
}

function retryAllowed(orchestration, item) {
  return item.retryCount < (orchestration.policy.maxRetries ?? 2);
}

function buildInstruction({ item, recommendedAction, recommendedRole, recommendedSkill, blockers, requiredEvidence, allowedTransitions }) {
  const roleLabel = ROLE_META[recommendedRole]?.label || recommendedRole;
  const skillLabel = SKILL_META[recommendedSkill]?.label || recommendedSkill;
  const transitionText = allowedTransitions.length > 0
    ? `Allowed transitions: ${allowedTransitions.map(formatState).join(", ")}.`
    : "No state transition is allowed until blockers are cleared.";
  const blockerText = blockers.length > 0
    ? `First resolve: ${unique(blockers).join("; ")}.`
    : "No blockers are currently preventing the recommended action.";
  const evidenceText = requiredEvidence.length > 0
    ? `Before advancing, provide: ${unique(requiredEvidence).join("; ")}.`
    : "No extra evidence is required before the next transition.";

  return `${roleLabel} should use ${skillLabel} to ${recommendedAction.toLowerCase()} for "${item.title}". ${blockerText} ${evidenceText} ${transitionText}`;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}
