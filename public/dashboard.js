// ===========================================================
// SpotAlert Dashboard – FINAL VERSION (NO PLACEHOLDERS)
// ===========================================================

// 🔹 API Base (LIVE)
const API_BASE = "https://api.spotalert.live";

// ===========================================================
// USER CONTEXT
// ===========================================================
let storedUser = {};
try {
  storedUser = JSON.parse(localStorage.getItem("spotalert_user") || "{}");
} catch {}

const USER_EMAIL = storedUser.email || "";
const USER_PLAN = storedUser.plan || "Free Trial";

// ===========================================================
// ELEMENTS
// ===========================================================
const faceList = document.getElementById("faceList");
const alertList = document.getElementById("alertList");
const cameraList = document.getElementById("cameraList");
const currentPlanDisplay = document.getElementById("currentPlan");
const upgradeBtn = document.getElementById("upgradeBtn");
const logoutBtn = document.getElementById("logoutBtn");
const uploadForm = document.getElementById("uploadForm");
const cameraFile = document.getElementById("cameraFile");
const resultDiv = document.getElementById("result");

// Dynamic containers
const usageContainer = document.createElement("div");
const replayContainer = document.createElement("div");
const emailsContainer = document.createElement("div");
usageContainer.id = "usageContainer";
replayContainer.id = "replayContainer";
emailsContainer.id = "emailsContainer";

document.addEventListener("DOMContentLoaded", () => {
  document.body.append(usageContainer, replayContainer, emailsContainer);
});

// ===========================================================
// INIT
// ===========================================================
document.addEventListener("DOMContentLoaded", () => {
  if (currentPlanDisplay) currentPlanDisplay.textContent = USER_PLAN;

  loadKnownFaces();
  loadCameras();
  refreshUsage();
  loadEmailAlertLogs();
  if (USER_PLAN === "Elite") loadReplay();

  checkBackend();
});

// ===========================================================
// KNOWN FACES (BACKEND DRIVEN – NO PLACEHOLDERS)
// ===========================================================
async function loadKnownFaces() {
  if (!faceList) return;
  faceList.innerHTML = "Loading...";

  try {
    const res = await fetch(
      `${API_BASE}/api/known-faces/list?email=${USER_EMAIL}`
    );
    const faces = await res.json();

    faceList.innerHTML = "";
    faces.forEach((f) => {
      const div = document.createElement("div");
      div.className = "face-item";

      const img = f.thumbnail
        ? `<img src="data:image/jpeg;base64,${f.thumbnail}" class="face-thumb">`
        : `<div class="face-thumb placeholder"></div>`;

      div.innerHTML = `
        ${img}
        <strong>${f.first_name} ${f.last_name}</strong>
        <span>${f.images} image(s)</span>
        <button onclick="deleteKnownFace(${f.id})">Delete</button>
      `;

      faceList.appendChild(div);
    });
  } catch (err) {
    faceList.innerHTML = "⚠️ Failed to load known faces";
  }
}

async function deleteKnownFace(id) {
  if (!confirm("Remove this person?")) return;

  await fetch(`${API_BASE}/api/known-faces/${id}`, {
    method: "DELETE",
  });

  loadKnownFaces();
}

// ===========================================================
// CAMERAS (REAL DATA)
// ===========================================================
async function loadCameras() {
  if (!cameraList) return;
  cameraList.innerHTML = "Loading...";

  try {
    const res = await fetch(
      `${API_BASE}/api/camera/list?email=${USER_EMAIL}`
    );
    const cams = await res.json();

    cameraList.innerHTML = "";
    cams.forEach((c) => {
      const li = document.createElement("li");
      li.textContent = `${c.name} (${c.ip})`;
      cameraList.appendChild(li);
    });
  } catch {
    cameraList.innerHTML = "⚠️ Failed to load cameras";
  }
}

// ===========================================================
// CAMERA IMAGE → ALERT SYSTEM
// ===========================================================
if (uploadForm) {
  uploadForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!cameraFile.files[0]) return alert("Select image");

    resultDiv.textContent = "⏳ Processing...";

    const fd = new FormData();
    fd.append("image", cameraFile.files[0]);
    fd.append("email", USER_EMAIL);

    try {
      const res = await fetch(`${API_BASE}/api/trigger-alert`, {
        method: "POST",
        body: fd,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const name = data.known_name
        ? `Known: ${data.known_name}`
        : "Unknown person detected";

      addAlert(name);
      resultDiv.textContent = name;

      refreshUsage();
      if (USER_PLAN === "Elite") loadReplay();
    } catch {
      resultDiv.textContent = "⚠️ Upload failed";
    }
  });
}

// ===========================================================
// ALERT LIST (LOCAL VIEW)
// ===========================================================
let alerts = [];

function addAlert(msg) {
  alerts.unshift({ msg, time: new Date().toLocaleString() });
  renderAlerts();
}

function renderAlerts() {
  if (!alertList) return;
  alertList.innerHTML = "";

  alerts.slice(0, 10).forEach((a) => {
    const li = document.createElement("li");
    li.textContent = `${a.time} — ${a.msg}`;
    alertList.appendChild(li);
  });
}

// ===========================================================
// USAGE SUMMARY (BACKEND)
// ===========================================================
async function refreshUsage() {
  usageContainer.innerHTML = "Loading usage...";

  try {
    const res = await fetch(
      `${API_BASE}/api/usage-summary?email=${USER_EMAIL}`
    );
    const u = await res.json();

    usageContainer.innerHTML = `
      <h3>📊 Monthly Usage (${u.month})</h3>
      <p>Total Cost: $${u.total_cost_usd}</p>
    `;
  } catch {
    usageContainer.innerHTML = "⚠️ Usage unavailable";
  }
}

// ===========================================================
// ELITE REPLAY
// ===========================================================
async function loadReplay() {
  replayContainer.innerHTML = "Loading replay...";

  try {
    const res = await fetch(`${API_BASE}/api/elite/replay?minutes=10`);
    const rows = await res.json();

    replayContainer.innerHTML = "<h3>🎥 Recent Alerts</h3>";
    rows.forEach((r) => {
      const div = document.createElement("div");
      div.textContent = `${r.type} — ${new Date(
        r.timestamp
      ).toLocaleString()}`;
      replayContainer.appendChild(div);
    });
  } catch {
    replayContainer.innerHTML = "⚠️ Replay unavailable";
  }
}

// ===========================================================
// EMAIL ALERT LOGS
// ===========================================================
async function loadEmailAlertLogs() {
  emailsContainer.innerHTML = "Loading emails...";

  try {
    const res = await fetch(`${API_BASE}/api/elite/replay?minutes=60`);
    const rows = await res.json();

    emailsContainer.innerHTML = "<h3>📩 Email Alerts</h3>";
    rows.forEach((r) => {
      const p = document.createElement("p");
      p.textContent = `${new Date(r.timestamp).toLocaleString()} — ${
        r.type
      }`;
      emailsContainer.appendChild(p);
    });
  } catch {
    emailsContainer.innerHTML = "⚠️ Email logs unavailable";
  }
}

// ===========================================================
// AUTH
// ===========================================================
if (logoutBtn) {
  logoutBtn.onclick = () => {
    localStorage.removeItem("spotalert_user");
    window.location.href = "login.html";
  };
}

if (upgradeBtn) {
  upgradeBtn.onclick = () => {
    window.location.href = "plans.html";
  };
}

// ===========================================================
// BACKEND CHECK
// ===========================================================
async function checkBackend() {
  try {
    await fetch(`${API_BASE}/api/status`);
    console.log("✅ Backend OK");
  } catch {
    console.log("⚠️ Backend unreachable");
  }
}
