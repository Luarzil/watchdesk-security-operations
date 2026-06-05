const STORAGE_KEY = "watchdesk-simple-v2";

const startingState = {
  screen: "office",
  online: true,
  guards: [
    { id: "g1", name: "Jordan Miles", employee: "SG-1007" },
    { id: "g2", name: "Riley Chen", employee: "SG-1014" },
    { id: "g3", name: "Avery Stone", employee: "SG-1022" }
  ],
  shifts: [
    { id: "s1", guardId: "g1", site: "Warehouse North", post: "North gate", start: "8:00 AM", end: "4:00 PM", status: "On duty", lastCheckIn: "10:02 AM", missed: false, finished: false },
    { id: "s2", guardId: "g2", site: "Medical Plaza", post: "Main lobby", start: "7:00 AM", end: "3:00 PM", status: "Needs check-in", lastCheckIn: "8:39 AM", missed: true, finished: false },
    { id: "s3", guardId: "g3", site: "Transit Lot C", post: "Vehicle patrol", start: "6:00 AM", end: "2:00 PM", status: "On duty", lastCheckIn: "10:00 AM", missed: false, finished: false }
  ],
  entries: [
    { id: "e1", shiftId: "s1", reportType: "DAR", type: "normal", note: "North entrance, loading dock, and camera room checked. All normal.", time: "9:00 AM", incident: false },
    { id: "e2", shiftId: "s2", reportType: "IR", type: "suspect", note: "Unknown person tried to enter staff corridor without a visitor badge.", time: "8:39 AM", incident: true }
  ],
  payroll: [
    { shiftId: "s1", hours: 8, incidents: 0, status: "Ready" },
    { shiftId: "s2", hours: 8, incidents: 1, status: "Review" },
    { shiftId: "s3", hours: 8, incidents: 0, status: "Ready" }
  ],
  selectedReportId: "e2"
};

let state = loadState();

const $ = (id) => document.getElementById(id);
const incidentTypes = new Set(["unusual", "fire", "suspect", "theft"]);

document.addEventListener("DOMContentLoaded", () => {
  bindEvents();
  render();
});

function bindEvents() {
  document.querySelectorAll(".tab").forEach((button) => {
    button.addEventListener("click", () => {
      state.screen = button.dataset.screen;
      saveState();
      render();
    });
  });

  $("resetDemo").addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    state = structuredClone(startingState);
    render();
  });
  $("exportData").addEventListener("click", () => download("watchdesk-simple-v2.json", JSON.stringify(state, null, 2), "application/json"));
  $("checkInNow").addEventListener("click", checkIn);
  $("entryForm").addEventListener("submit", saveEntry);
  $("cleanNote").addEventListener("click", cleanNote);
  $("finishShift").addEventListener("click", finishShift);
  $("approvePayroll").addEventListener("click", approvePayroll);
  $("exportPayroll").addEventListener("click", exportPayroll);
  $("printReport").addEventListener("click", () => window.print());
}

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || structuredClone(startingState);
  } catch {
    return structuredClone(startingState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function render() {
  document.querySelectorAll(".tab").forEach((button) => button.classList.toggle("active", button.dataset.screen === state.screen));
  document.querySelectorAll(".screen").forEach((screen) => screen.classList.toggle("active-screen", screen.id === `${state.screen}Screen`));
  renderOffice();
  renderGuard();
  renderPayroll();
  renderReports();
}

function renderOffice() {
  const onDuty = state.shifts.filter((shift) => !shift.finished).length;
  const missed = state.shifts.filter((shift) => shift.missed && !shift.finished).length;
  const incidents = state.entries.filter((entry) => entry.incident).length;
  const payrollReady = state.payroll.filter((row) => row.status === "Ready").length;

  $("metrics").innerHTML = [
    metric("Guards on duty", onDuty, "Active shifts today"),
    metric("Missed check-ins", missed, "Needs supervisor attention"),
    metric("Incidents", incidents, "DAR/IR items to review"),
    metric("Payroll ready", payrollReady, "Rows ready to approve")
  ].join("");

  $("shiftCards").innerHTML = state.shifts.map((shift) => {
    const guard = getGuard(shift.guardId);
    const tag = shift.finished ? "good" : shift.missed ? "bad" : "good";
    return `
      <article class="card card-row">
        <div>
          <strong>${esc(guard.name)}</strong>
          <div class="muted">${esc(shift.site)} - ${esc(shift.post)}</div>
        </div>
        <div>
          <span class="tag ${tag}">${esc(shift.finished ? "Finished" : shift.status)}</span>
          <span class="muted">Last check-in: ${esc(shift.lastCheckIn)}</span>
        </div>
        <button class="secondary" type="button" data-check-shift="${shift.id}">Mark OK</button>
      </article>
    `;
  }).join("");

  document.querySelectorAll("[data-check-shift]").forEach((button) => {
    button.addEventListener("click", () => markShiftOk(button.dataset.checkShift));
  });

  const queueItems = [
    ...state.shifts.filter((shift) => shift.missed && !shift.finished).map((shift) => ({
      type: "Missed check-in",
      detail: `${getGuard(shift.guardId).name} at ${shift.site}`,
      tone: "bad"
    })),
    ...state.entries.filter((entry) => entry.incident).map((entry) => ({
      type: "Incident report",
      detail: `${getShift(entry.shiftId).site}: ${entry.note}`,
      tone: "warn"
    }))
  ];

  $("supervisorQueue").innerHTML = queueItems.length ? queueItems.map((item) => `
    <article class="card">
      <span class="tag ${item.tone}">${esc(item.type)}</span>
      <strong>${esc(item.detail)}</strong>
    </article>
  `).join("") : `<div class="empty">Nothing needs attention right now.</div>`;
}

function metric(label, value, detail) {
  return `<div class="metric"><span>${label}</span><strong>${value}</strong><div class="muted">${detail}</div></div>`;
}

function renderGuard() {
  const shift = state.shifts.find((item) => !item.finished) || state.shifts[0];
  const guard = getGuard(shift.guardId);
  $("phoneStatus").textContent = state.online ? "Online" : "Offline";
  $("phoneStatus").className = `pill ${state.online ? "good" : "warn"}`;
  $("phoneShiftTitle").textContent = `${guard.name} - ${shift.site}`;
  $("phoneShiftMeta").textContent = `${shift.post}, ${shift.start} to ${shift.end}. Last check-in: ${shift.lastCheckIn}.`;

  const entries = state.entries.filter((entry) => entry.shiftId === shift.id).slice().reverse();
  $("guardTimeline").innerHTML = entries.length ? entries.map((entry) => `
    <article class="card">
      <span class="tag ${entry.incident ? "bad" : "good"}">${entry.incident ? "Incident" : entry.reportType}</span>
      <strong>${esc(labelFor(entry.type))}</strong>
      <div class="muted">${esc(entry.time)}</div>
      <p>${esc(entry.note)}</p>
    </article>
  `).join("") : `<div class="empty">No notes saved for this shift yet.</div>`;
}

function renderPayroll() {
  $("payrollRows").innerHTML = state.payroll.map((row) => {
    const shift = getShift(row.shiftId);
    const guard = getGuard(shift.guardId);
    const statusClass = row.status === "Approved" ? "good" : row.status === "Review" ? "bad" : "warn";
    return `
      <tr>
        <td>${esc(guard.name)}<br><span class="muted">${esc(guard.employee)}</span></td>
        <td>${esc(shift.site)}</td>
        <td>${esc(shift.start)}-${esc(shift.end)}</td>
        <td>${row.hours.toFixed(2)}</td>
        <td>${row.incidents}</td>
        <td><span class="tag ${statusClass}">${esc(row.status)}</span></td>
      </tr>
    `;
  }).join("");
}

function renderReports() {
  const reports = state.entries.slice().reverse();
  $("reportList").innerHTML = reports.map((entry) => {
    const shift = getShift(entry.shiftId);
    const guard = getGuard(shift.guardId);
    return `
      <article class="card">
        <span class="tag ${entry.incident ? "bad" : "good"}">${esc(entry.reportType)}</span>
        <strong>${esc(guard.name)} - ${esc(shift.site)}</strong>
        <div class="muted">${esc(entry.time)} - ${esc(labelFor(entry.type))}</div>
        <p>${esc(entry.note)}</p>
        <button class="secondary" type="button" data-preview="${entry.id}">Preview report</button>
      </article>
    `;
  }).join("");

  document.querySelectorAll("[data-preview]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedReportId = button.dataset.preview;
      saveState();
      renderReports();
    });
  });

  const selected = state.entries.find((entry) => entry.id === state.selectedReportId) || state.entries[0];
  const shift = getShift(selected.shiftId);
  const guard = getGuard(shift.guardId);
  $("reportPreview").innerHTML = `
    <header>
      <div>
        <p class="eyebrow">${esc(selected.reportType)} record</p>
        <h2>${esc(labelFor(selected.type))}</h2>
      </div>
      <div class="muted">${esc(selected.time)}<br>${selected.incident ? "Incident" : "Routine"}</div>
    </header>
    <p><strong>Guard:</strong> ${esc(guard.name)} (${esc(guard.employee)})</p>
    <p><strong>Site:</strong> ${esc(shift.site)} - ${esc(shift.post)}</p>
    <p><strong>Shift:</strong> ${esc(shift.start)} to ${esc(shift.end)}</p>
    <p><strong>Notes:</strong></p>
    <p>${esc(selected.note)}</p>
    <p class="muted">In production, finalized reports would be locked and exported as a PDF.</p>
  `;
}

function checkIn() {
  const shift = state.shifts.find((item) => !item.finished);
  if (!shift) return;
  shift.missed = false;
  shift.status = "On duty";
  shift.lastCheckIn = currentTime();
  saveState();
  render();
}

function markShiftOk(shiftId) {
  const shift = getShift(shiftId);
  shift.missed = false;
  shift.status = "On duty";
  shift.lastCheckIn = currentTime();
  saveState();
  render();
}

function saveEntry(event) {
  event.preventDefault();
  const shift = state.shifts.find((item) => !item.finished);
  if (!shift) return;
  const type = $("entryType").value;
  const note = $("entryNote").value.trim();
  if (incidentTypes.has(type) && !note) {
    alert("Please type a note for anything unusual or incident-related.");
    return;
  }
  const entry = {
    id: crypto.randomUUID(),
    shiftId: shift.id,
    reportType: $("reportType").value,
    type,
    note: note || "Tour complete. All normal.",
    time: currentTime(),
    incident: incidentTypes.has(type) || $("reportType").value === "IR"
  };
  state.entries.push(entry);
  state.selectedReportId = entry.id;
  const payroll = state.payroll.find((row) => row.shiftId === shift.id);
  if (payroll && entry.incident) {
    payroll.incidents += 1;
    payroll.status = "Review";
  }
  $("entryNote").value = "";
  saveState();
  render();
}

function cleanNote() {
  const note = $("entryNote").value.trim();
  if (!note) return;
  $("entryNote").value = note.replace(/\s+/g, " ").replace(/\bi\b/g, "I");
}

function finishShift() {
  const shift = state.shifts.find((item) => !item.finished);
  if (!shift) return;
  shift.finished = true;
  shift.status = "Finished";
  shift.missed = false;
  const payroll = state.payroll.find((row) => row.shiftId === shift.id);
  if (payroll && payroll.status !== "Review") payroll.status = "Ready";
  saveState();
  render();
}

function approvePayroll() {
  state.payroll.forEach((row) => {
    if (row.status === "Ready") row.status = "Approved";
  });
  saveState();
  render();
}

function exportPayroll() {
  const rows = [["guard", "employee_id", "site", "shift", "hours", "incidents", "status"]];
  state.payroll.forEach((row) => {
    const shift = getShift(row.shiftId);
    const guard = getGuard(shift.guardId);
    rows.push([guard.name, guard.employee, shift.site, `${shift.start}-${shift.end}`, row.hours.toFixed(2), row.incidents, row.status]);
  });
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
  download("watchdesk-payroll-simple.csv", csv, "text/csv");
}

function getGuard(id) {
  return state.guards.find((guard) => guard.id === id) || state.guards[0];
}

function getShift(id) {
  return state.shifts.find((shift) => shift.id === id) || state.shifts[0];
}

function labelFor(type) {
  return {
    normal: "Tour complete, all normal",
    unusual: "Something unusual",
    fire: "Fire",
    suspect: "Suspicious person",
    theft: "Theft",
    manual: "Other note"
  }[type] || type;
}

function currentTime() {
  return new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
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
