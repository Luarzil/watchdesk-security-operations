const STORAGE_KEY = "watchdesk-v2-preview-state";

const seed = {
  activeView: "ops",
  activeRole: "CFSL",
  people: [
    { id: "u1", name: "Jordan Miles", employeeId: "SG-1007", role: "UL" },
    { id: "u2", name: "Riley Chen", employeeId: "SG-1014", role: "UL" },
    { id: "u3", name: "Casey Brooks", employeeId: "SUP-210", role: "CFSL" },
    { id: "u4", name: "Lori", employeeId: "FIN-001", role: "finance_reviewer" }
  ],
  sites: [
    { id: "s1", name: "Warehouse North", org: "Client Alpha", region: "North", policyMinutes: 60 },
    { id: "s2", name: "Medical Plaza", org: "Client Alpha", region: "North", policyMinutes: 45 },
    { id: "s3", name: "Transit Lot C", org: "Client Beta", region: "Central", policyMinutes: 60 }
  ],
  shifts: [
    {
      id: "sh-1201",
      userId: "u1",
      siteId: "s1",
      post: "North gate",
      scheduledStart: "2026-06-04T08:00:00",
      scheduledEnd: "2026-06-04T16:00:00",
      actualStart: "2026-06-04T08:03:00",
      actualEnd: null,
      status: "active",
      heartbeatStatus: "on_time"
    },
    {
      id: "sh-1202",
      userId: "u2",
      siteId: "s2",
      post: "Main lobby",
      scheduledStart: "2026-06-04T07:00:00",
      scheduledEnd: "2026-06-04T15:00:00",
      actualStart: "2026-06-04T07:01:00",
      actualEnd: null,
      status: "active",
      heartbeatStatus: "overdue"
    },
    {
      id: "sh-1190",
      userId: "u1",
      siteId: "s3",
      post: "Transit lot",
      scheduledStart: "2026-06-03T08:00:00",
      scheduledEnd: "2026-06-03T16:00:00",
      actualStart: "2026-06-03T08:02:00",
      actualEnd: "2026-06-03T16:06:00",
      status: "closed",
      heartbeatStatus: "closed"
    }
  ],
  reports: [
    {
      id: "r-9201",
      shiftId: "sh-1201",
      type: "DAR",
      status: "draft",
      openedAt: "2026-06-04T08:05:00",
      finalizedAt: null,
      sealedHash: null,
      passdown: "",
      entries: [
        entry("tour_normal", "Tour normal", "Camera room, north entrance, and loading dock checked. All normal.", false, "2026-06-04T09:00:00")
      ]
    },
    {
      id: "r-9202",
      shiftId: "sh-1202",
      type: "IR",
      status: "draft",
      openedAt: "2026-06-04T08:35:00",
      finalizedAt: null,
      sealedHash: null,
      passdown: "",
      entries: [
        entry("suspect", "Suspect person", "Unknown person attempted to enter staff corridor without visitor badge.", true, "2026-06-04T08:39:00")
      ]
    },
    {
      id: "r-9188",
      shiftId: "sh-1190",
      type: "DAR",
      status: "finalized",
      openedAt: "2026-06-03T08:05:00",
      finalizedAt: "2026-06-03T16:10:00",
      sealedHash: "sha256:7f2c...91b0",
      passdown: "Gate lock checked. No outstanding issues.",
      entries: [
        entry("tour_normal", "Tour normal", "Hourly patrol completed. No exceptions.", false, "2026-06-03T10:00:00"),
        entry("tour_unusual", "Tour unusual", "Delivery truck parked outside marked area. Driver moved after request.", true, "2026-06-03T13:15:00")
      ]
    }
  ],
  checkins: [
    checkin("sh-1201", "r-9201", "u1", "2026-06-04T09:00:00", "2026-06-04T09:01:00", "received"),
    checkin("sh-1201", "r-9201", "u1", "2026-06-04T10:00:00", "2026-06-04T10:02:00", "received"),
    checkin("sh-1202", "r-9202", "u2", "2026-06-04T09:00:00", null, "overdue"),
    checkin("sh-1190", "r-9188", "u1", "2026-06-03T14:00:00", "2026-06-03T14:01:00", "received")
  ],
  incidents: [
    { id: "i-501", reportId: "r-9202", entryId: "e-suspect", severity: "medium", category: "access_control", status: "new", reviewedBy: null },
    { id: "i-490", reportId: "r-9188", entryId: "e-unusual", severity: "low", category: "parking", status: "reviewed", reviewedBy: "u3" }
  ],
  payrollLines: [
    { id: "pl-1", periodId: "pp-2026-06-a", userId: "u1", shiftId: "sh-1190", regular: 8.0, overtime: 0.1, incidents: 1, status: "ready", notes: "Reconstructed from V1 demo." },
    { id: "pl-2", periodId: "pp-2026-06-a", userId: "u1", shiftId: "sh-1201", regular: 7.95, overtime: 0, incidents: 0, status: "open", notes: "Active shift estimate." },
    { id: "pl-3", periodId: "pp-2026-06-a", userId: "u2", shiftId: "sh-1202", regular: 7.98, overtime: 0, incidents: 1, status: "needs_review", notes: "Overdue check-in before approval." }
  ],
  exports: [
    { id: "ex-101", reportId: "r-9188", kind: "pdf", status: "stored", checksum: "sha256:7f2c...91b0", createdAt: "2026-06-03T16:12:00", path: "private/exports/r-9188.pdf" }
  ],
  outbox: [
    { id: "ob-1", kind: "CHECKIN_CREATE", entityId: "sh-1201", status: "queued", createdAt: "2026-06-04T10:03:00" }
  ],
  audit: [
    audit("report.finalized", "r-9188", "u1", "2026-06-03T16:10:00"),
    audit("export.generated", "ex-101", "u3", "2026-06-03T16:12:00"),
    audit("incident.created", "i-501", "u2", "2026-06-04T08:39:00")
  ]
};

let state = load();

const $ = (id) => document.getElementById(id);
const titles = {
  ops: "Ops Command",
  field: "V2A Field Shell",
  checkins: "V2B Check-ins",
  payroll: "V2C Payroll",
  exports: "V2E Exports",
  schema: "Schema + Roles"
};
const roleScopes = {
  UL: "Own shift and own finalized exports",
  CFSL: "Site-level supervisor scope",
  CML: "Organization management scope",
  CAL: "Organization admin scope",
  ARUL: "Regional operations scope",
  SA: "All tenants and platform controls",
  Lori: "Finance reviewer slice"
};
const incidentKinds = new Set(["tour_unusual", "fire", "suspect", "theft"]);

document.addEventListener("DOMContentLoaded", () => {
  bind();
  hydrate();
  render();
});

function entry(kind, label, narrative, incident, at) {
  return {
    id: crypto.randomUUID(),
    kind,
    label,
    narrativeOriginal: narrative,
    narrativeClean: "",
    narrativeEn: "",
    incident,
    at
  };
}

function checkin(shiftId, reportId, userId, expectedAt, receivedAt, status) {
  return {
    id: crypto.randomUUID(),
    shiftId,
    reportId,
    userId,
    expectedAt,
    receivedAt,
    method: receivedAt ? "manual" : "pending",
    status,
    gps: "40.7128, -74.0060",
    offlineCreatedAt: null,
    syncedAt: receivedAt,
    sequenceNo: Math.floor(Math.random() * 1000)
  };
}

function audit(action, entityId, actorId, at) {
  return { id: crypto.randomUUID(), action, entityId, actorId, at, requestId: crypto.randomUUID().slice(0, 8) };
}

function bind() {
  document.querySelectorAll(".nav-button").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeView = button.dataset.view;
      save();
      render();
    });
  });

  $("roleSelect").addEventListener("change", () => {
    state.activeRole = $("roleSelect").value;
    save();
    render();
  });
  $("resetState").addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    state = structuredClone(seed);
    hydrate();
    render();
  });
  $("entryForm").addEventListener("submit", appendEntry);
  $("cleanCopy").addEventListener("click", cleanEntryText);
  $("syncOutbox").addEventListener("click", syncOutbox);
  $("markCheckin").addEventListener("click", recordCheckin);
  $("approvePayroll").addEventListener("click", approvePayroll);
  $("exportPayroll").addEventListener("click", exportPayroll);
  $("generateExport").addEventListener("click", generateExport);
}

function hydrate() {
  $("roleSelect").value = state.activeRole;
  $("fieldShift").innerHTML = state.shifts
    .filter((shift) => shift.status === "active")
    .map((shift) => `<option value="${shift.id}">${person(shift.userId).name} - ${site(shift.siteId).name}</option>`)
    .join("");
}

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || structuredClone(seed);
  } catch {
    return structuredClone(seed);
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function render() {
  document.querySelectorAll(".nav-button").forEach((button) => button.classList.toggle("active", button.dataset.view === state.activeView));
  document.querySelectorAll(".view").forEach((view) => view.classList.toggle("active-view", view.id === `${state.activeView}View`));
  $("pageTitle").textContent = titles[state.activeView];
  $("scopePill").textContent = roleScopes[state.activeRole];
  renderOps();
  renderField();
  renderCheckins();
  renderPayroll();
  renderExports();
  renderSchema();
}

function renderOps() {
  const activeShifts = state.shifts.filter((shift) => shift.status === "active");
  const overdue = state.checkins.filter((item) => item.status === "overdue");
  const openIncidents = state.incidents.filter((item) => item.status !== "reviewed");
  const readyPayroll = state.payrollLines.filter((line) => line.status === "ready").length;
  const finalized = state.reports.filter((report) => report.status === "finalized").length;

  $("metrics").innerHTML = [
    metric("Active shifts", activeShifts.length, "Shift-led payroll source"),
    metric("Check-ins overdue", overdue.length, "First-class ledger rows"),
    metric("Open incidents", openIncidents.length, "Review queue"),
    metric("Payroll ready", readyPayroll, "Line-item approvals"),
    metric("Sealed exports", finalized, "Immutable report records")
  ].join("");

  $("shiftList").innerHTML = activeShifts.map((shift) => {
    const status = shift.heartbeatStatus === "overdue" ? "danger" : "ok";
    return `
      <article class="list-row">
        <div>
          <strong>${esc(person(shift.userId).name)}</strong>
          <div class="muted">${esc(site(shift.siteId).name)} - ${esc(shift.post)}</div>
        </div>
        <div>
          <span class="tag ${status}">${shift.heartbeatStatus === "overdue" ? "Overdue" : "On time"}</span>
          <span class="muted">Policy ${site(shift.siteId).policyMinutes} min</span>
        </div>
        <span class="muted">${formatTime(shift.actualStart)} start</span>
      </article>
    `;
  }).join("");

  const alerts = [
    ...overdue.map((item) => ({ title: "Missed check-in", detail: `${person(item.userId).name} missed ${formatTime(item.expectedAt)}`, status: "danger" })),
    ...openIncidents.map((item) => ({ title: item.category.replaceAll("_", " "), detail: `${item.severity} severity - ${item.reportId}`, status: "warn" }))
  ];
  $("incidentPill").textContent = `${alerts.length} active`;
  $("incidentList").innerHTML = alerts.length ? alerts.map((item) => `
    <article class="card">
      <span class="tag ${item.status}">${item.status === "danger" ? "Escalate" : "Review"}</span>
      <strong>${esc(item.title)}</strong>
      <div class="muted">${esc(item.detail)}</div>
    </article>
  `).join("") : `<div class="empty">No active alerts.</div>`;

  $("milestones").innerHTML = [
    ["Foundation", "Tenant, auth, RLS, audit"],
    ["V2A", "UL mobile shell + outbox"],
    ["V2B", "Check-ins + escalation"],
    ["V2C", "Payroll detail + close"],
    ["V2D", "Metrics + drill-downs"],
    ["V2E", "Canonical PDF exports"]
  ].map(([title, detail]) => `<div class="timeline-item"><strong>${title}</strong><span class="muted">${detail}</span></div>`).join("");
}

function metric(label, value, detail) {
  return `<div class="metric"><span>${label}</span><strong>${value}</strong><div class="muted">${detail}</div></div>`;
}

function renderField() {
  const shiftId = $("fieldShift").value || state.shifts.find((shift) => shift.status === "active")?.id;
  const report = state.reports.find((item) => item.shiftId === shiftId) || state.reports[0];
  $("outboxBadge").textContent = `${state.outbox.length} queued`;
  $("outboxList").innerHTML = state.outbox.length ? state.outbox.map((item) => `
    <article class="card">
      <span class="tag warn">${esc(item.status)}</span>
      <strong>${esc(item.kind)}</strong>
      <div class="muted">${esc(item.entityId)} - ${formatDate(item.createdAt)}</div>
    </article>
  `).join("") : `<div class="empty">Outbox is synced.</div>`;

  $("fieldEntries").innerHTML = report.entries.slice().reverse().map((item) => `
    <article class="card">
      <span class="tag ${item.incident ? "danger" : "ok"}">${item.incident ? "Incident" : "Routine"}</span>
      <strong>${esc(item.label)}</strong>
      <div class="muted">${formatDate(item.at)}</div>
      <p>${esc(item.narrativeOriginal)}</p>
      ${item.narrativeClean ? `<div class="muted">Clean: ${esc(item.narrativeClean)}</div>` : ""}
    </article>
  `).join("");
}

function renderCheckins() {
  $("checkinRows").innerHTML = state.checkins
    .slice()
    .sort((a, b) => new Date(b.expectedAt) - new Date(a.expectedAt))
    .map((item) => {
      const tag = item.status === "overdue" ? "danger" : item.status === "queued" ? "warn" : "ok";
      return `
        <article class="list-row">
          <div>
            <strong>${esc(person(item.userId).name)}</strong>
            <div class="muted">${esc(item.shiftId)} - expected ${formatTime(item.expectedAt)}</div>
          </div>
          <span class="tag ${tag}">${esc(item.status)}</span>
          <span class="muted">${item.receivedAt ? `received ${formatTime(item.receivedAt)}` : "not received"}</span>
        </article>
      `;
    }).join("");

  const overdue = state.checkins.filter((item) => item.status === "overdue");
  $("alertList").innerHTML = overdue.length ? overdue.map((item) => `
    <article class="card">
      <span class="tag danger">Email MVP</span>
      <strong>Supervisor escalation</strong>
      <div class="muted">${esc(person(item.userId).name)} at ${esc(site(shift(item.shiftId).siteId).name)}</div>
      <p>In production this writes an audit event and sends supervisor email from a backend function.</p>
    </article>
  `).join("") : `<div class="empty">No overdue check-ins.</div>`;
}

function renderPayroll() {
  $("payrollRows").innerHTML = state.payrollLines.map((line) => {
    const sh = shift(line.shiftId);
    const tag = line.status === "needs_review" ? "danger" : line.status === "approved" ? "ok" : "warn";
    return `
      <tr>
        <td>${esc(person(line.userId).name)}<br><span class="muted">${esc(person(line.userId).employeeId)}</span></td>
        <td>${esc(line.shiftId)}<br><span class="muted">${esc(site(sh.siteId).name)}</span></td>
        <td>${line.regular.toFixed(2)}</td>
        <td>${line.overtime.toFixed(2)}</td>
        <td>${line.incidents}</td>
        <td><span class="tag ${tag}">${esc(line.status)}</span></td>
        <td>${esc(line.notes)}</td>
      </tr>
    `;
  }).join("");
}

function renderExports() {
  const report = state.reports.find((item) => item.status === "finalized") || state.reports[0];
  const sh = shift(report.shiftId);
  $("printPreview").innerHTML = `
    <header>
      <div>
        <p class="eyebrow">Canonical report</p>
        <h3>${esc(report.type)} ${esc(report.id)}</h3>
      </div>
      <div class="muted">${report.status === "finalized" ? "Sealed" : "Draft"}<br>${esc(report.sealedHash || "not sealed")}</div>
    </header>
    <dl>
      <dt>Guard</dt><dd>${esc(person(sh.userId).name)}</dd>
      <dt>Site</dt><dd>${esc(site(sh.siteId).name)}</dd>
      <dt>Shift</dt><dd>${formatDate(sh.actualStart)} to ${sh.actualEnd ? formatDate(sh.actualEnd) : "active"}</dd>
      <dt>Pass-down</dt><dd>${esc(report.passdown || "Not finalized yet.")}</dd>
    </dl>
    <h4>Entries</h4>
    ${report.entries.map((item) => `<p><strong>${esc(item.label)}</strong> ${esc(item.narrativeOriginal)}</p>`).join("")}
  `;

  $("exportList").innerHTML = state.exports.map((item) => `
    <article class="card">
      <span class="tag ok">${esc(item.status)}</span>
      <strong>${esc(item.kind.toUpperCase())} for ${esc(item.reportId)}</strong>
      <div class="muted">${esc(item.path)} - ${esc(item.checksum)}</div>
      <div class="muted">${formatDate(item.createdAt)}</div>
    </article>
  `).join("");
}

function renderSchema() {
  const entities = [
    ["organizations", "Tenant boundary, timezone, retention, status"],
    ["memberships", "Role slug plus site/org/region scope"],
    ["sites + posts", "Physical site and reporting post policy"],
    ["shifts", "Authoritative operational and payroll source"],
    ["reports", "DAR/IR header with sealed hash after finalization"],
    ["report_entries", "Append-only narrative and incident flags"],
    ["checkins", "Expected and received heartbeat ledger"],
    ["payroll_line_items", "Regular, OT, incidents, approval status"],
    ["exports", "PDF/CSV generation history and checksum"],
    ["audit_events", "Finalize, approve, export, role changes"]
  ];
  $("entityList").innerHTML = entities.map(([name, detail]) => `<div class="entity"><code>${name}</code><span>${detail}</span></div>`).join("");

  const roles = [
    ["UL", "Own shift, own reports, own check-ins"],
    ["CFSL", "Site supervisor, incident triage, site reports"],
    ["CML", "Organization manager, payroll detail"],
    ["CAL", "Company admin, users, sites, billing owner"],
    ["ARUL", "Regional override and operations view"],
    ["SA", "Platform-wide administration"],
    ["Lori", "Finance reviewer role assignment, not a hard-coded person permission"]
  ];
  $("roleMatrix").innerHTML = roles.map(([role, detail]) => `<div class="role-card"><span class="pill">${role}</span><p>${detail}</p></div>`).join("");
}

function appendEntry(event) {
  event.preventDefault();
  const shiftId = $("fieldShift").value;
  const report = state.reports.find((item) => item.shiftId === shiftId) || state.reports[0];
  if (report.status === "finalized") return;
  const kind = $("entryKind").value;
  const narrative = $("entryNarrative").value.trim();
  if (incidentKinds.has(kind) && !narrative) {
    $("fieldNotice").textContent = "Narrative is required for incident-like entries.";
    return;
  }
  const item = entry(kind, labelForKind(kind), narrative || "All normal.", incidentKinds.has(kind), new Date().toISOString());
  item.narrativeClean = $("entryClean").value.trim();
  report.entries.push(item);
  state.outbox.push({ id: crypto.randomUUID(), kind: "REPORT_ENTRY_CREATE", entityId: report.id, status: "queued", createdAt: new Date().toISOString() });
  if (item.incident) {
    state.incidents.push({ id: `i-${Math.floor(Math.random() * 900 + 100)}`, reportId: report.id, entryId: item.id, severity: "medium", category: kind, status: "new", reviewedBy: null });
  }
  state.audit.push(audit("report_entry.created", report.id, reportShiftUser(report), new Date().toISOString()));
  $("entryNarrative").value = "";
  $("entryClean").value = "";
  $("fieldNotice").textContent = "Entry appended to report and queued in the offline outbox.";
  save();
  render();
}

function cleanEntryText() {
  const text = $("entryNarrative").value.trim();
  if (!text) return;
  $("entryClean").value = text.replace(/\s+/g, " ").replace(/\bi\b/g, "I");
}

function syncOutbox() {
  state.outbox = [];
  state.audit.push(audit("outbox.synced", "device-outbox", "u3", new Date().toISOString()));
  save();
  render();
}

function recordCheckin() {
  const overdue = state.checkins.find((item) => item.status === "overdue");
  if (!overdue) return;
  overdue.status = "received";
  overdue.receivedAt = new Date().toISOString();
  overdue.method = "manual";
  overdue.syncedAt = overdue.receivedAt;
  shift(overdue.shiftId).heartbeatStatus = "on_time";
  state.audit.push(audit("checkin.received", overdue.shiftId, overdue.userId, overdue.receivedAt));
  save();
  render();
}

function approvePayroll() {
  state.payrollLines.forEach((line) => {
    if (line.status !== "needs_review") line.status = "approved";
  });
  state.audit.push(audit("payroll_period.approved", "pp-2026-06-a", "u4", new Date().toISOString()));
  save();
  render();
}

function exportPayroll() {
  const rows = [["employee", "employee_id", "shift_id", "site", "regular", "overtime", "incidents", "status", "notes"]];
  state.payrollLines.forEach((line) => {
    const sh = shift(line.shiftId);
    rows.push([person(line.userId).name, person(line.userId).employeeId, line.shiftId, site(sh.siteId).name, line.regular, line.overtime, line.incidents, line.status, line.notes]);
  });
  download("watchdesk-v2-payroll.csv", rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n"), "text/csv");
}

function generateExport() {
  const report = state.reports.find((item) => item.status === "finalized") || state.reports[0];
  const id = `ex-${Math.floor(Math.random() * 900 + 200)}`;
  state.exports.unshift({
    id,
    reportId: report.id,
    kind: "pdf",
    status: "stored",
    checksum: `sha256:${crypto.randomUUID().slice(0, 8)}...`,
    createdAt: new Date().toISOString(),
    path: `private/exports/${report.id}-${id}.pdf`
  });
  state.audit.push(audit("export.generated", id, "u3", new Date().toISOString()));
  save();
  render();
}

function labelForKind(kind) {
  return {
    tour_normal: "Tour normal",
    tour_unusual: "Tour unusual",
    fire: "Fire",
    suspect: "Suspect person",
    theft: "Theft",
    manual: "Manual entry"
  }[kind];
}

function person(id) {
  return state.people.find((item) => item.id === id) || state.people[0];
}

function site(id) {
  return state.sites.find((item) => item.id === id) || state.sites[0];
}

function shift(id) {
  return state.shifts.find((item) => item.id === id) || state.shifts[0];
}

function reportShiftUser(report) {
  return shift(report.shiftId).userId;
}

function formatDate(value) {
  return new Date(value).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function formatTime(value) {
  return new Date(value).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function download(name, content, type) {
  const blob = new Blob([content], { type });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = name;
  link.click();
  URL.revokeObjectURL(link.href);
}

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
