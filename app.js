const STORAGE_KEY = "watchdesk-demo-state-v1";

const seed = {
  online: true,
  activeView: "admin",
  selectedReportType: "DAR",
  currentReportId: "r-7001",
  policyMinutes: 60,
  selectedPeriod: "2026-05-16",
  people: [
    { id: "u-101", name: "Jordan Miles", employeeId: "SG-1007", role: "UL" },
    { id: "u-102", name: "Riley Chen", employeeId: "SG-1014", role: "UL" },
    { id: "u-201", name: "Morgan Patel", employeeId: "MGR-204", role: "CML" }
  ],
  sites: [
    { id: "site-1", name: "Warehouse North", organization: "Client Alpha", gps: "40.7128, -74.0060" },
    { id: "site-2", name: "Medical Plaza", organization: "Client Alpha", gps: "40.7282, -73.9942" },
    { id: "site-3", name: "Transit Lot C", organization: "Client Beta", gps: "40.7580, -73.9855" }
  ],
  reports: [
    {
      id: "r-7001",
      type: "DAR",
      guardId: "u-101",
      siteId: "site-1",
      openedAt: minutesAgo(235),
      lastActivityAt: minutesAgo(18),
      finalizedAt: null,
      status: "open",
      passdown: "",
      weather: "Cloudy, 68 F",
      gps: "40.7128, -74.0060",
      activities: [
        activity("tour-normal", "Tour normal", "North entrance, loading dock, and camera room checked. All normal.", "", 18, false),
        activity("manual", "Manual entry", "Contractor delivery logged at receiving door.", "", 62, false)
      ]
    },
    {
      id: "r-7002",
      type: "IR",
      guardId: "u-102",
      siteId: "site-2",
      openedAt: minutesAgo(125),
      lastActivityAt: minutesAgo(52),
      finalizedAt: null,
      status: "open",
      passdown: "",
      weather: "Clear, 71 F",
      gps: "40.7282, -73.9942",
      activities: [
        activity("suspect", "Suspect person", "Unknown person attempted to enter staff corridor without badge.", "", 52, true)
      ]
    },
    {
      id: "r-6990",
      type: "DAR",
      guardId: "u-101",
      siteId: "site-3",
      openedAt: "2026-05-18T08:00:00.000Z",
      lastActivityAt: "2026-05-18T16:02:00.000Z",
      finalizedAt: "2026-05-18T16:08:00.000Z",
      status: "finalized",
      passdown: "Gate lock checked. No outstanding issues.",
      weather: "Light rain, 64 F",
      gps: "40.7580, -73.9855",
      activities: [
        activity("tour-normal", "Tour normal", "Hourly patrol complete. No exceptions.", "", 2880, false),
        activity("tour-unusual", "Tour unusual", "Delivery truck parked outside marked area. Driver moved after request.", "", 2810, true)
      ]
    }
  ],
  queue: [
    { id: "q-1", kind: "HEARTBEAT", at: minutesAgo(9), reportId: "r-7001" }
  ],
  audit: [
    { id: "a-1", at: minutesAgo(18), actor: "Jordan Miles", event: "Activity logged", subject: "r-7001" },
    { id: "a-2", at: minutesAgo(52), actor: "Riley Chen", event: "Incident report opened", subject: "r-7002" },
    { id: "a-3", at: "2026-05-18T16:08:00.000Z", actor: "Jordan Miles", event: "DAR finalized", subject: "r-6990" }
  ]
};

let state = loadState();

const $ = (id) => document.getElementById(id);
const incidentTypes = new Set(["tour-unusual", "fire", "suspect", "theft"]);
const labels = {
  "tour-normal": "Tour normal",
  "tour-unusual": "Tour unusual",
  fire: "Fire",
  suspect: "Suspect person",
  theft: "Theft",
  manual: "Manual entry"
};

document.addEventListener("DOMContentLoaded", () => {
  bindEvents();
  hydrateControls();
  render();
});

function minutesAgo(minutes) {
  return new Date(Date.now() - minutes * 60000).toISOString();
}

function activity(type, label, detailOriginal, detailEnglish, minutesBack, incident) {
  return {
    id: crypto.randomUUID(),
    type,
    label,
    detailOriginal,
    detailEnglish,
    incident,
    at: minutesAgo(minutesBack)
  };
}

function loadState() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return stored || structuredClone(seed);
  } catch {
    return structuredClone(seed);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function bindEvents() {
  document.querySelectorAll(".nav-item").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeView = button.dataset.view;
      saveState();
      render();
    });
  });

  document.querySelectorAll("[data-report-type]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedReportType = button.dataset.reportType;
      state.currentReportId = null;
      ensureOpenReport();
      saveState();
      render();
    });
  });

  $("networkToggle").addEventListener("click", () => {
    state.online = !state.online;
    if (state.online) flushQueue();
    showFieldMessage(state.online ? "Back online. Pending actions were synced." : "Offline mode. Actions will queue locally.");
    saveState();
    render();
  });

  $("resetDemo").addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    state = structuredClone(seed);
    hydrateControls();
    render();
  });

  $("siteFilter").addEventListener("change", render);
  $("typeFilter").addEventListener("change", render);
  $("incidentOnly").addEventListener("change", render);
  $("fieldSite").addEventListener("change", () => {
    const site = getSite($("fieldSite").value);
    $("gpsInput").value = site.gps;
  });
  $("guardSelect").addEventListener("change", () => {
    state.currentReportId = null;
    ensureOpenReport();
    render();
  });
  $("roleSelect").addEventListener("change", render);
  $("periodSelect").addEventListener("change", () => {
    state.selectedPeriod = $("periodSelect").value;
    saveState();
    renderPayroll();
  });

  $("activityForm").addEventListener("submit", (event) => {
    event.preventDefault();
    addActivityFromForm();
  });

  $("cleanText").addEventListener("click", cleanNarrative);
  $("translateText").addEventListener("click", translateNarrative);
  $("flushQueue").addEventListener("click", () => {
    flushQueue();
    render();
  });
  $("manualHeartbeat").addEventListener("click", sendHeartbeat);
  $("startNextReport").addEventListener("click", startNextReport);
  $("finalizeForm").addEventListener("submit", (event) => {
    event.preventDefault();
    finalizeReport();
  });
  $("exportJson").addEventListener("click", exportJson);
  $("exportCsv").addEventListener("click", exportPayrollCsv);
}

function hydrateControls() {
  $("siteFilter").innerHTML = option("all", "All sites") + state.sites.map((site) => option(site.id, site.name)).join("");
  $("fieldSite").innerHTML = state.sites.map((site) => option(site.id, site.name)).join("");
  $("guardSelect").innerHTML = state.people.map((person) => option(person.id, person.name)).join("");
  $("periodSelect").innerHTML = [
    option("2026-05-01", "May 1 to May 15, 2026"),
    option("2026-05-16", "May 16 to May 31, 2026")
  ].join("");
  $("periodSelect").value = state.selectedPeriod;
}

function option(value, label) {
  return `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`;
}

function render() {
  syncViewState();
  renderNetwork();
  renderAdmin();
  renderField();
  renderPayroll();
  renderRecords();
}

function syncViewState() {
  document.querySelectorAll(".nav-item").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === state.activeView);
  });
  document.querySelectorAll(".view").forEach((view) => {
    view.classList.toggle("active-view", view.id === `${state.activeView}View`);
  });
  document.querySelectorAll("[data-report-type]").forEach((button) => {
    button.classList.toggle("active", button.dataset.reportType === state.selectedReportType);
  });
}

function renderNetwork() {
  const button = $("networkToggle");
  button.className = `status-button ${state.online ? "online" : "offline"}`;
  button.textContent = `${state.online ? "Online" : "Offline"} - ${state.queue.length} queued`;
  $("phoneNetwork").textContent = state.online ? "Online" : "Offline";
}

function renderAdmin() {
  const openReports = state.reports.filter((report) => report.status === "open");
  const incidents = state.reports.flatMap((report) => report.activities).filter((item) => item.incident).length;
  const stale = openReports.filter((report) => isInactive(report)).length;
  const hours = payrollRows().reduce((sum, row) => sum + row.hours, 0);

  $("metrics").innerHTML = [
    metric("Open reports", openReports.length, "Live DAR and IR records"),
    metric("Incident flags", incidents, "Needs supervisor review"),
    metric("Queued sync", state.queue.length, state.online ? "Online" : "Offline local queue"),
    metric("Payroll hours", hours.toFixed(1), "Selected period estimate")
  ].join("");

  $("lastRefresh").textContent = `Updated ${new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  $("queueBadge").textContent = `${state.queue.length} pending`;

  renderPosts();
  renderQueue();
  renderActivityFeed();
}

function metric(label, value, detail) {
  return `<div class="metric"><span>${label}</span><strong>${value}</strong><p class="muted">${detail}</p></div>`;
}

function renderPosts() {
  const siteFilter = $("siteFilter").value;
  const typeFilter = $("typeFilter").value;
  const incidentOnly = $("incidentOnly").checked;
  const reports = state.reports.filter((report) => {
    const typeMatch = typeFilter === "all" || report.type === typeFilter;
    const siteMatch = siteFilter === "all" || report.siteId === siteFilter;
    const incidentMatch = !incidentOnly || report.activities.some((item) => item.incident);
    return typeMatch && siteMatch && incidentMatch;
  });

  $("postList").innerHTML = reports.length ? reports.map((report) => {
    const person = getPerson(report.guardId);
    const site = getSite(report.siteId);
    const latest = latestActivity(report);
    const inactive = isInactive(report);
    const statusClass = report.status === "finalized" ? "locked" : inactive ? "incident" : "normal";
    const statusText = report.status === "finalized" ? "Finalized" : inactive ? "Check-in late" : "Active";
    return `
      <article class="post">
        <div>
          <strong>${escapeHtml(person.name)} - ${escapeHtml(report.type)}</strong>
          <span class="muted">${escapeHtml(site.name)} - ${escapeHtml(site.organization)}</span>
        </div>
        <div>
          <span class="tag ${statusClass}">${statusText}</span>
          <span class="muted">Last: ${formatRelative(report.lastActivityAt)}</span>
        </div>
        <div>
          <span class="muted">${latest ? escapeHtml(latest.label) : "No activity yet"}</span>
        </div>
      </article>
    `;
  }).join("") : `<div class="empty">No reports match those filters.</div>`;
}

function renderQueue() {
  $("queueList").innerHTML = state.queue.length ? state.queue.map((item) => `
    <div class="queue-item">
      <strong>${escapeHtml(item.kind)}</strong>
      <div class="muted">${formatDateTime(item.at)} - ${escapeHtml(item.reportId || "system")}</div>
    </div>
  `).join("") : `<div class="empty">No pending sync actions.</div>`;
}

function renderActivityFeed() {
  const feed = state.reports
    .flatMap((report) => report.activities.map((item) => ({ ...item, report })))
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 8);

  $("activityFeed").innerHTML = feed.map((item) => {
    const person = getPerson(item.report.guardId);
    const site = getSite(item.report.siteId);
    return `
      <div class="feed-item">
        <span class="tag ${item.incident ? "incident" : "normal"}">${item.incident ? "Incident" : "Routine"}</span>
        <strong>${escapeHtml(item.label)}</strong>
        <div class="muted">${escapeHtml(person.name)} at ${escapeHtml(site.name)} - ${formatDateTime(item.at)}</div>
        <div>${escapeHtml(item.detailOriginal || "No narrative entered.")}</div>
      </div>
    `;
  }).join("");
}

function renderField() {
  const report = ensureOpenReport();
  const locked = report.status === "finalized";
  const site = getSite(report.siteId);
  const person = getPerson(report.guardId);

  $("activityForm").classList.toggle("locked", locked);
  $("finalizeForm").classList.toggle("locked", locked);
  $("mobileLockState").textContent = locked ? "Locked" : "Editable";
  setControlValue("fieldSite", report.siteId);
  setControlValue("guardSelect", report.guardId);
  setControlValue("gpsInput", report.gps || site.gps);
  setControlValue("weatherInput", report.weather);
  setControlValue("passdownInput", report.passdown || "");
  $("effectivePolicy").textContent = `${state.policyMinutes} min threshold`;
  $("shiftClock").textContent = `Opened ${formatRelative(report.openedAt)}`;

  const alert = $("inactivityAlert");
  if (isInactive(report) && !locked) {
    alert.textContent = `No check-in within ${state.policyMinutes} minutes. Supervisor should review this post.`;
    alert.classList.remove("hidden");
  } else {
    alert.classList.add("hidden");
  }

  $("mobileLogList").innerHTML = report.activities.length ? report.activities
    .slice()
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .map((item) => `
      <div class="mobile-item">
        <span class="tag ${item.incident ? "incident" : "normal"}">${item.incident ? "Incident" : "Normal"}</span>
        <strong>${escapeHtml(item.label)}</strong>
        <div class="muted">${formatDateTime(item.at)}</div>
        <div>${escapeHtml(item.detailOriginal || "No narrative.")}</div>
        ${item.detailEnglish ? `<div class="muted">English: ${escapeHtml(item.detailEnglish)}</div>` : ""}
      </div>
    `).join("") : `<div class="empty">No shift entries yet.</div>`;

  $("guardState").innerHTML = [
    ["Guard", person.name],
    ["Client", site.organization],
    ["Site", site.name],
    ["Report", `${report.type} ${report.id}`],
    ["Opened", formatDateTime(report.openedAt)],
    ["Last check-in", formatRelative(report.lastActivityAt)],
    ["Queue", `${state.queue.length} pending action${state.queue.length === 1 ? "" : "s"}`],
    ["Status", report.status]
  ].map(([label, value]) => `<dt>${label}</dt><dd>${escapeHtml(value)}</dd>`).join("");
}

function renderPayroll() {
  const rows = payrollRows();
  $("payrollRows").innerHTML = rows.map((row) => `
    <tr>
      <td>${escapeHtml(row.guard)}</td>
      <td>${escapeHtml(row.employeeId)}</td>
      <td>${escapeHtml(row.sites.join(", "))}</td>
      <td>${row.reportCount}</td>
      <td>${row.hours.toFixed(2)}</td>
      <td>${row.incidents}</td>
      <td><span class="tag ${row.incidents ? "incident" : "normal"}">${row.incidents ? "Review" : "Ready"}</span></td>
    </tr>
  `).join("");
}

function renderRecords() {
  $("recordsList").innerHTML = state.reports
    .slice()
    .sort((a, b) => new Date(b.openedAt) - new Date(a.openedAt))
    .map((report) => {
      const person = getPerson(report.guardId);
      const site = getSite(report.siteId);
      const locked = report.status === "finalized";
      return `
        <div class="record-item">
          <span class="tag ${locked ? "locked" : "normal"}">${locked ? "Immutable" : "Open"}</span>
          <strong>${escapeHtml(report.type)} ${escapeHtml(report.id)}</strong>
          <div class="muted">${escapeHtml(person.name)} - ${escapeHtml(site.name)}</div>
          <div class="muted">Opened ${formatDateTime(report.openedAt)}</div>
          <div>${locked ? `Pass-down: ${escapeHtml(report.passdown)}` : "Open reports can still receive activity entries."}</div>
        </div>
      `;
    }).join("");

  $("auditCount").textContent = `${state.audit.length} events`;
  $("auditTrail").innerHTML = state.audit
    .slice()
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .map((item) => `
      <div class="audit-item">
        <strong>${escapeHtml(item.event)}</strong>
        <div class="muted">${formatDateTime(item.at)} - ${escapeHtml(item.actor)} - ${escapeHtml(item.subject)}</div>
      </div>
    `).join("");
}

function addActivityFromForm() {
  const report = ensureOpenReport();
  if (report.status === "finalized") return;

  const type = $("activityType").value;
  const detailOriginal = $("narrativeInput").value.trim();
  const detailEnglish = $("englishInput").value.trim();
  if (incidentTypes.has(type) && !detailOriginal) {
    showFieldMessage("This activity type needs a narrative before it can be saved.", true);
    return;
  }

  report.type = state.selectedReportType;
  report.guardId = $("guardSelect").value;
  report.siteId = $("fieldSite").value;
  report.gps = $("gpsInput").value.trim();
  report.weather = $("weatherInput").value.trim();
  report.lastActivityAt = new Date().toISOString();
  const item = {
    id: crypto.randomUUID(),
    type,
    label: labels[type],
    detailOriginal: detailOriginal || "All normal.",
    detailEnglish,
    incident: incidentTypes.has(type),
    at: new Date().toISOString()
  };
  report.activities.push(item);
  queueAction("ACTIVITY_ADD", report.id);
  audit(`${item.label} logged`, report);
  $("narrativeInput").value = "";
  $("englishInput").value = "";
  showFieldMessage(state.online ? "Activity saved and synced." : "Activity saved locally. It will sync when online.");
  if (state.online) flushQueue();
  saveState();
  render();
}

function cleanNarrative() {
  const source = $("narrativeInput").value.trim();
  if (!source) return;
  const cleaned = source
    .replace(/\s+/g, " ")
    .replace(/\bi\b/g, "I")
    .replace(/\bdont\b/gi, "do not")
    .replace(/\bu\b/gi, "you");
  $("narrativeInput").value = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function translateNarrative() {
  const source = $("narrativeInput").value.trim();
  if (!source) return;
  $("englishInput").value = `[English preview] ${source}`;
}

function sendHeartbeat() {
  const report = ensureOpenReport();
  if (report.status === "finalized") return;
  report.lastActivityAt = new Date().toISOString();
  queueAction("HEARTBEAT", report.id);
  audit("Hourly check-in", report);
  showFieldMessage(state.online ? "Check-in sent." : "Check-in queued offline.");
  if (state.online) flushQueue();
  saveState();
  render();
}

function startNextReport() {
  state.currentReportId = null;
  const report = ensureOpenReport();
  showFieldMessage(`${report.type} ${report.id} is ready for the next shift.`);
  saveState();
  render();
}

function finalizeReport() {
  const report = ensureOpenReport();
  if (report.status === "finalized") return;
  const passdown = $("passdownInput").value.trim();
  if (!passdown) {
    showFieldMessage("Pass-down information is required before finalization.", true);
    return;
  }
  report.passdown = passdown;
  report.status = "finalized";
  report.finalizedAt = new Date().toISOString();
  queueAction("REPORT_FINALIZE", report.id);
  audit(`${report.type} finalized`, report);
  showFieldMessage("Report finalized. The record is now locked for audit integrity.");
  if (state.online) flushQueue();
  saveState();
  render();
}

function ensureOpenReport() {
  if (state.currentReportId) {
    const current = state.reports.find((item) => item.id === state.currentReportId);
    if (current) return current;
  }

  const guardId = $("guardSelect")?.value || state.people[0].id;
  const siteId = $("fieldSite")?.value || state.sites[0].id;
  let report = state.reports.find((item) => (
    item.status === "open" &&
    item.guardId === guardId &&
    item.type === state.selectedReportType
  ));

  if (!report) {
    const site = getSite(siteId);
    report = {
      id: `r-${Math.floor(8000 + Math.random() * 1000)}`,
      type: state.selectedReportType,
      guardId,
      siteId,
      openedAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
      finalizedAt: null,
      status: "open",
      passdown: "",
      weather: $("weatherInput")?.value || "Cloudy, 68 F",
      gps: site.gps,
      activities: []
    };
    state.reports.push(report);
    queueAction("REPORT_CREATE", report.id);
    audit(`${report.type} opened`, report);
  }
  state.currentReportId = report.id;
  return report;
}

function queueAction(kind, reportId) {
  state.queue.push({ id: crypto.randomUUID(), kind, at: new Date().toISOString(), reportId });
}

function flushQueue() {
  if (!state.online) {
    showFieldMessage("Still offline. Queue remains on this device.", true);
    return;
  }
  state.queue = [];
  saveState();
}

function audit(event, report) {
  state.audit.push({
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    actor: getPerson(report.guardId).name,
    event,
    subject: report.id
  });
}

function showFieldMessage(message, danger = false) {
  const box = $("fieldMessage");
  if (!box) return;
  box.textContent = message;
  box.className = `notice ${danger ? "danger" : ""}`;
  window.clearTimeout(showFieldMessage.timer);
  showFieldMessage.timer = window.setTimeout(() => box.classList.add("hidden"), 5200);
}

function payrollRows() {
  const start = new Date(state.selectedPeriod);
  const end = state.selectedPeriod === "2026-05-01"
    ? new Date("2026-05-16T00:00:00")
    : new Date("2026-06-01T00:00:00");

  return state.people.map((person) => {
    const reports = state.reports.filter((report) => {
      const opened = new Date(report.openedAt);
      return report.guardId === person.id && opened >= start && opened < end;
    });
    const sites = [...new Set(reports.map((report) => getSite(report.siteId).name))];
    const hours = reports.reduce((sum, report) => {
      const close = report.finalizedAt ? new Date(report.finalizedAt) : new Date();
      return sum + Math.max(0.25, (close - new Date(report.openedAt)) / 3600000);
    }, 0);
    const incidents = reports.flatMap((report) => report.activities).filter((item) => item.incident).length;
    return {
      guard: person.name,
      employeeId: person.employeeId,
      sites: sites.length ? sites : ["No posts"],
      reportCount: reports.length,
      hours,
      incidents
    };
  });
}

function isInactive(report) {
  if (report.status === "finalized") return false;
  return Date.now() - new Date(report.lastActivityAt).getTime() > state.policyMinutes * 60000;
}

function latestActivity(report) {
  return report.activities.slice().sort((a, b) => new Date(b.at) - new Date(a.at))[0];
}

function getPerson(id) {
  return state.people.find((person) => person.id === id) || state.people[0];
}

function getSite(id) {
  return state.sites.find((site) => site.id === id) || state.sites[0];
}

function formatDateTime(value) {
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function formatRelative(value) {
  const diff = Math.max(0, Date.now() - new Date(value).getTime());
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function exportJson() {
  downloadFile("watchdesk-snapshot.json", JSON.stringify(state, null, 2), "application/json");
}

function exportPayrollCsv() {
  const rows = [["guard", "employee_id", "sites", "reports", "hours", "incidents", "status"]];
  payrollRows().forEach((row) => {
    rows.push([
      row.guard,
      row.employeeId,
      row.sites.join("; "),
      row.reportCount,
      row.hours.toFixed(2),
      row.incidents,
      row.incidents ? "review" : "ready"
    ]);
  });
  const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
  downloadFile("watchdesk-payroll.csv", csv, "text/csv");
}

function downloadFile(name, content, type) {
  const blob = new Blob([content], { type });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = name;
  link.click();
  URL.revokeObjectURL(link.href);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setControlValue(id, value) {
  const control = $(id);
  if (!control || document.activeElement === control) return;
  control.value = value;
}
