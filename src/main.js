import {
  GATE_TYPES,
  ROLE_META,
  STATES,
  addArtifact,
  canCompleteWorkItem,
  completeGate,
  createOrchestration,
  formatState,
  getAgentBrief,
  getAgentLanes,
  getBoardColumns,
  getDependencyEdges,
  getHealth,
  getNextAction,
  getWorkItem,
  handoffWorkItem,
  retryWorkItem,
  SKILL_META,
  transitionWorkItem
} from "./orchestrationEngine.js";
import { scenarios } from "./scenarios.js";

const app = document.querySelector("#app");
let activeScenarioId = scenarios[0].id;
let orchestration = createOrchestration(scenarios[0]);
let activeView = "board";
let activeBriefItemId = orchestration.workItems[0]?.id || null;

render();

app.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) {
    return;
  }

  const { action, itemId, view } = button.dataset;
  if (view) {
    activeView = view;
    render();
    return;
  }

  if (action === "compose") {
    composeMission();
  }

  if (action === "simulate") {
    simulateNextBeat();
  }

  if (action === "reset") {
    loadScenario(activeScenarioId);
  }

  if (action === "brief") {
    activeBriefItemId = activeBriefItemId === itemId ? null : itemId;
  }

  if (action === "approve") {
    approveItem(itemId);
  }

  if (action === "start") {
    transitionWorkItem(orchestration, itemId, STATES.IN_PROGRESS, { actor: getWorkItem(orchestration, itemId).ownerRole });
  }

  if (action === "review") {
    attachProgressArtifact(itemId, "diff-summary");
    passOpenGates(itemId, [GATE_TYPES.EVIDENCE_REQUIRED]);
    transitionWorkItem(orchestration, itemId, STATES.NEEDS_REVIEW);
  }

  if (action === "verify") {
    passOpenGates(itemId, [GATE_TYPES.REVIEW_PASS]);
    transitionWorkItem(orchestration, itemId, STATES.VERIFYING);
  }

  if (action === "done") {
    attachProgressArtifact(itemId, "verification");
    passOpenGates(itemId, [GATE_TYPES.TEST_PASS, GATE_TYPES.EVIDENCE_REQUIRED, GATE_TYPES.REVIEW_PASS]);
    transitionWorkItem(orchestration, itemId, STATES.DONE);
  }

  if (action === "block") {
    transitionWorkItem(orchestration, itemId, STATES.BLOCKED, { reason: "Manual blocker added from board" });
  }

  if (action === "retry") {
    retryWorkItem(orchestration, itemId, { reason: "Retry requested from board" });
  }

  if (action === "handoff") {
    handoffToNextRole(itemId);
  }

  render();
});

app.addEventListener("change", (event) => {
  if (event.target.id === "scenarioSelect") {
    activeScenarioId = event.target.value;
    loadScenario(activeScenarioId);
  }
});

function composeMission() {
  const goal = document.querySelector("#goalInput").value.trim();
  const base = scenarios.find((scenario) => scenario.id === activeScenarioId) || scenarios[0];
  orchestration = createOrchestration({
    ...base,
    title: goal || base.title,
    id: `mission-${Date.now()}`
  });
  render();
}

function loadScenario(id) {
  const scenario = scenarios.find((candidate) => candidate.id === id) || scenarios[0];
  orchestration = createOrchestration(scenario);
  activeScenarioId = scenario.id;
  activeBriefItemId = orchestration.workItems[0]?.id || null;
  render();
}

function simulateNextBeat() {
  const approvalItem = orchestration.workItems.find((item) => item.state === STATES.NEEDS_HUMAN_APPROVAL);
  if (approvalItem) {
    approveItem(approvalItem.id);
    return render();
  }

  const blockedItem = orchestration.workItems.find((item) => item.state === STATES.BLOCKED);
  if (blockedItem) {
    retryWorkItem(orchestration, blockedItem.id, { reason: "Conductor recovery beat" });
    return render();
  }

  const readyItem = orchestration.workItems.find((item) => item.state === STATES.READY);
  if (readyItem) {
    transitionWorkItem(orchestration, readyItem.id, STATES.IN_PROGRESS, { actor: readyItem.ownerRole, reason: "Conductor started next ready beat" });
    return render();
  }

  const inProgressItem = orchestration.workItems.find((item) => item.state === STATES.IN_PROGRESS);
  if (inProgressItem) {
    attachProgressArtifact(inProgressItem.id, "diff-summary");
    passOpenGates(inProgressItem.id, [GATE_TYPES.EVIDENCE_REQUIRED]);
    transitionWorkItem(orchestration, inProgressItem.id, STATES.NEEDS_REVIEW, { reason: "Work output is ready for review" });
    return render();
  }

  const reviewItem = orchestration.workItems.find((item) => item.state === STATES.NEEDS_REVIEW);
  if (reviewItem) {
    attachProgressArtifact(reviewItem.id, "review-notes");
    passOpenGates(reviewItem.id, [GATE_TYPES.REVIEW_PASS]);
    transitionWorkItem(orchestration, reviewItem.id, STATES.VERIFYING, { reason: "Review passed" });
    return render();
  }

  const verifyingItem = orchestration.workItems.find((item) => item.state === STATES.VERIFYING);
  if (verifyingItem) {
    attachProgressArtifact(verifyingItem.id, "verification");
    passOpenGates(verifyingItem.id, [GATE_TYPES.TEST_PASS, GATE_TYPES.EVIDENCE_REQUIRED, GATE_TYPES.REVIEW_PASS]);
    transitionWorkItem(orchestration, verifyingItem.id, STATES.DONE, { reason: "Verification evidence attached" });
    return render();
  }

  render();
}

function approveItem(itemId) {
  const item = getWorkItem(orchestration, itemId);
  for (const gate of item.gates.filter((candidate) => candidate.type === GATE_TYPES.HUMAN_APPROVAL)) {
    completeGate(orchestration, gate.id, { actor: "human" });
  }
  transitionWorkItem(orchestration, itemId, STATES.READY, { actor: "human", reason: "Approval granted" });
}

function attachProgressArtifact(itemId, type) {
  const item = getWorkItem(orchestration, itemId);
  return addArtifact(orchestration, {
    workItemId: itemId,
    type,
    title: `${readableType(type)} for ${item.title}`,
    body: `${ROLE_META[item.ownerRole]?.label || item.ownerRole} attached ${readableType(type).toLowerCase()} evidence.`
  });
}

function passOpenGates(itemId, types) {
  const item = getWorkItem(orchestration, itemId);
  for (const gate of item.gates.filter((candidate) => types.includes(candidate.type) && candidate.status !== "passed")) {
    completeGate(orchestration, gate.id, { actor: item.ownerRole });
  }
}

function handoffToNextRole(itemId) {
  const roles = Object.keys(ROLE_META);
  const item = getWorkItem(orchestration, itemId);
  const nextRole = roles[(roles.indexOf(item.ownerRole) + 1) % roles.length];
  handoffWorkItem(
    orchestration,
    itemId,
    nextRole,
    `Context from ${ROLE_META[item.ownerRole].label}: ${item.title} needs the next specialist.`,
    "Return evidence, decision notes, or a blocker."
  );
}

function render() {
  const health = getHealth(orchestration);
  app.innerHTML = `
    <section class="mission-console">
      <div class="brand-row">
        <img src="./src/assets/conductor-mark.svg" alt="" width="48" height="48">
        <div>
          <p class="eyebrow">Agent Symphony Board</p>
          <h1>${escapeHtml(orchestration.title)}</h1>
        </div>
      </div>
      <p class="metaphor">${escapeHtml(orchestration.metaphor || "Coordinate agents like sections of an orchestra: every handoff, gate, retry, and artifact has a place in the score.")}</p>
      <div class="composer">
        <label for="goalInput">High-level goal</label>
        <textarea id="goalInput" rows="3" spellcheck="true">${escapeHtml(orchestration.title)}</textarea>
        <div class="composer-actions">
          <select id="scenarioSelect" aria-label="Example scenario">
            ${scenarios.map((scenario) => `<option value="${scenario.id}" ${scenario.id === activeScenarioId ? "selected" : ""}>${escapeHtml(scenario.title)}</option>`).join("")}
          </select>
          <button type="button" data-action="compose">Decompose Goal</button>
          <button type="button" data-action="simulate">Simulate Next Beat</button>
          <button type="button" data-action="reset" class="ghost">Reset</button>
        </div>
      </div>
    </section>

    <section class="conductor-panel" aria-label="Conductor view">
      ${renderHealth(health)}
      <div class="policy-strip">
        <span>Max retries: <strong>${orchestration.policy.maxRetries}</strong></span>
        <span>Approval before execution: <strong>${orchestration.policy.approvalRequiredBeforeExecution ? "on" : "off"}</strong></span>
        <span>Verification before done: <strong>${orchestration.policy.verificationRequiredBeforeDone ? "on" : "off"}</strong></span>
      </div>
    </section>

    <nav class="view-tabs" aria-label="Board views">
      ${renderTab("board", "Board")}
      ${renderTab("lanes", "Agent Lanes")}
      ${renderTab("graph", "Dependencies")}
      ${renderTab("events", "Event Log")}
    </nav>

    ${activeView === "board" ? renderBoard() : ""}
    ${activeView === "lanes" ? renderLanes() : ""}
    ${activeView === "graph" ? renderGraph() : ""}
    ${activeView === "events" ? renderEvents() : ""}
  `;
}

function renderHealth(health) {
  return `
    <div class="score-ring" style="--progress:${health.progress}">
      <strong>${health.progress}%</strong>
      <span>mission complete</span>
    </div>
    <div class="health-grid">
      ${metric("Active", health.active)}
      ${metric("Approvals", health.approvals)}
      ${metric("Verifying", health.verifying)}
      ${metric("Blocked", health.blocked)}
      ${metric("Retry budget", `${health.retriesUsed}/${health.retryBudget}`)}
      ${metric("Evidence", `${health.evidenceCoverage}%`)}
    </div>
  `;
}

function metric(label, value) {
  return `<div class="metric"><span>${label}</span><strong>${value}</strong></div>`;
}

function renderTab(id, label) {
  return `<button type="button" data-view="${id}" class="${activeView === id ? "active" : ""}">${label}</button>`;
}

function renderBoard() {
  return `
    <section class="board" aria-label="Kanban orchestration board">
      ${getBoardColumns(orchestration).map((column) => `
        <div class="column">
          <header>
            <h2>${column.title}</h2>
            <span>${column.items.length}</span>
          </header>
          <div class="column-items">
            ${column.items.map(renderCard).join("") || `<p class="empty">No work here.</p>`}
          </div>
        </div>
      `).join("")}
    </section>
  `;
}

function renderLanes() {
  return `
    <section class="lanes" aria-label="Agent lanes">
      ${getAgentLanes(orchestration).map((lane) => `
        <article class="lane" style="--role:${lane.accent}">
          <header>
            <span class="role-dot"></span>
            <h2>${lane.label}</h2>
          </header>
          <div class="lane-items">
            ${lane.items.map((item) => `
              <div class="lane-item">
                <strong>${escapeHtml(item.title)}</strong>
                <span>${formatState(item.state)}</span>
              </div>
            `).join("")}
          </div>
        </article>
      `).join("")}
    </section>
  `;
}

function renderGraph() {
  const edges = getDependencyEdges(orchestration);
  return `
    <section class="graph-view">
      <div class="graph-grid">
        ${orchestration.workItems.map((item) => `
          <div class="graph-node ${item.state}" style="--role:${ROLE_META[item.ownerRole]?.accent || "#64748b"}">
            <span>${ROLE_META[item.ownerRole]?.label || item.ownerRole}</span>
            <strong>${escapeHtml(item.title)}</strong>
            <small>${formatState(item.state)}</small>
          </div>
        `).join("")}
      </div>
      <aside class="edge-list">
        <h2>Dependency edges</h2>
        ${edges.map((edge) => `
          <div class="edge ${edge.complete ? "complete" : ""}">
            <span>${escapeHtml(edge.fromTitle)}</span>
            <b>to</b>
            <span>${escapeHtml(edge.toTitle)}</span>
          </div>
        `).join("") || `<p class="empty">This scenario has no dependencies.</p>`}
      </aside>
    </section>
  `;
}

function renderEvents() {
  return `
    <section class="event-feed" aria-label="Event log">
      ${orchestration.eventLog.slice().reverse().map((event) => `
        <article>
          <time>${new Date(event.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</time>
          <div>
            <strong>${escapeHtml(event.type)}</strong>
            <p>${escapeHtml(event.message)}</p>
          </div>
        </article>
      `).join("")}
    </section>
  `;
}

function renderCard(item) {
  const completion = canCompleteWorkItem(orchestration, item.id);
  const nextAction = getNextAction(orchestration, item.id);
  const role = ROLE_META[item.ownerRole] || { label: item.ownerRole, accent: "#64748b" };
  const skill = SKILL_META[nextAction.recommendedSkill] || { label: nextAction.recommendedSkill };
  const artifactList = item.artifacts.map((artifactId) => orchestration.artifacts.find((artifact) => artifact.id === artifactId)).filter(Boolean);
  const briefOpen = activeBriefItemId === item.id;

  return `
    <article class="work-card ${item.state}" style="--role:${role.accent}">
      <div class="card-topline">
        <span class="role-pill">${role.label}</span>
        <span class="state-pill">${formatState(item.state)}</span>
      </div>
      <h3>${escapeHtml(item.title)}</h3>
      <div class="card-signals">
        ${item.dependencies.length ? `<span>${item.dependencies.length} deps</span>` : `<span>No deps</span>`}
        ${item.gates.length ? `<span>${item.gates.filter((gate) => gate.status !== "passed").length} gates open</span>` : `<span>No gates</span>`}
        ${item.retryCount ? `<span>${item.retryCount} retries</span>` : `<span>Fresh</span>`}
      </div>
      <div class="agent-guidance">
        <span>Skill: ${escapeHtml(skill.label)}</span>
        <strong>${escapeHtml(nextAction.recommendedAction)}</strong>
      </div>
      <ul class="criteria">
        ${item.acceptanceCriteria.slice(0, 3).map((criterion) => `<li>${escapeHtml(criterion)}</li>`).join("")}
      </ul>
      ${item.gates.length ? `
        <div class="gate-list">
          ${item.gates.map((gate) => `<span class="${gate.status === "passed" ? "passed" : "open"}">${escapeHtml(gate.label)}</span>`).join("")}
        </div>
      ` : ""}
      ${artifactList.length ? `
        <div class="artifact-list">
          ${artifactList.map((artifact) => `<span>${escapeHtml(artifact.title)}</span>`).join("")}
        </div>
      ` : ""}
      ${completion.ok || item.state === STATES.DONE ? "" : `<p class="completion-warning">${escapeHtml(completion.reasons[0] || "")}</p>`}
      ${briefOpen ? renderBriefPanel(item, nextAction) : ""}
      <div class="card-actions">
        ${renderActions(item)}
      </div>
    </article>
  `;
}

function renderActions(item) {
  const brief = `<button type="button" data-action="brief" data-item-id="${item.id}" class="ghost">${activeBriefItemId === item.id ? "Hide Brief" : "Brief"}</button>`;
  if (item.state === STATES.NEEDS_HUMAN_APPROVAL) {
    return `
      ${brief}
      <button type="button" data-action="approve" data-item-id="${item.id}">Approve</button>
      <button type="button" data-action="handoff" data-item-id="${item.id}" class="ghost">Handoff</button>
    `;
  }
  if ([STATES.READY, STATES.INTAKE, STATES.DECOMPOSITION, STATES.ASSIGNMENT].includes(item.state)) {
    return `
      ${brief}
      <button type="button" data-action="start" data-item-id="${item.id}">Start</button>
      <button type="button" data-action="block" data-item-id="${item.id}" class="ghost">Block</button>
      <button type="button" data-action="handoff" data-item-id="${item.id}" class="ghost">Handoff</button>
    `;
  }
  if (item.state === STATES.IN_PROGRESS) {
    return `
      ${brief}
      <button type="button" data-action="review" data-item-id="${item.id}">Send to Review</button>
      <button type="button" data-action="block" data-item-id="${item.id}" class="ghost">Block</button>
    `;
  }
  if (item.state === STATES.NEEDS_REVIEW) {
    return `
      ${brief}
      <button type="button" data-action="verify" data-item-id="${item.id}">Pass Review</button>
      <button type="button" data-action="handoff" data-item-id="${item.id}" class="ghost">Handoff</button>
    `;
  }
  if (item.state === STATES.VERIFYING) {
    return `
      ${brief}
      <button type="button" data-action="done" data-item-id="${item.id}">Attach Evidence</button>
      <button type="button" data-action="block" data-item-id="${item.id}" class="ghost">Block</button>
    `;
  }
  if ([STATES.BLOCKED, STATES.FAILED_RECOVERY].includes(item.state)) {
    return `
      ${brief}
      <button type="button" data-action="retry" data-item-id="${item.id}">Retry</button>
    `;
  }
  return `
    ${brief}
    <button type="button" data-action="handoff" data-item-id="${item.id}" class="ghost">Handoff</button>
  `;
}

function renderBriefPanel(item, nextAction) {
  return `
    <section class="brief-panel" aria-label="Agent brief for ${escapeHtml(item.title)}">
      <div class="brief-summary">
        <span>Role: ${escapeHtml(ROLE_META[nextAction.recommendedRole]?.label || nextAction.recommendedRole)}</span>
        <span>Allowed: ${nextAction.allowedTransitions.length ? nextAction.allowedTransitions.map(formatState).join(", ") : "blocked"}</span>
        <span>Evidence: ${nextAction.requiredEvidence.length || 0}</span>
      </div>
      ${nextAction.blockers.length ? `
        <div class="brief-blockers">
          ${nextAction.blockers.map((blocker) => `<span>${escapeHtml(blocker)}</span>`).join("")}
        </div>
      ` : ""}
      <pre>${escapeHtml(getAgentBrief(orchestration, item.id))}</pre>
    </section>
  `;
}

function readableType(type) {
  return type.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
