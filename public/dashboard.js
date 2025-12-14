// ===========================================================
// SpotAlert Dashboard – FINAL FULL VERSION (REAL DATA ONLY)
// ===========================================================

// 🔹 API Base
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
// AUTH TOKEN
// ===========================================================
const AUTH_TOKEN =
  localStorage.getItem("token") ||
  localStorage.getItem("admin_token") ||
  "";

// ===========================================================
// AUTH FETCH HELPER
// ===========================================================
async function authFetch(url, options = {}) {
  const headers = options.headers || {};
  if (AUTH_TOKEN) headers["Authorization"] = "Bearer " + AUTH_TOKEN;
  return fetch(url, { ...options, headers });
}

// ===========================================================
// ELEMENTS
// ===========================================================
const faceList = document.getElementById("faceList");
const alertList = document.getElementById("alertList");
const cameraList = document.getElementById("cameraList");
const planList = document.getElementById("planList");

const currentPlanDisplay = document.getElementById("currentPlan");
const upgradeBtn = document.getElementById("upgradeBtn");
const downgradeBtn = document.getElementById("downgradeBtn");
const logoutBtn = document.getElementById("logoutBtn");

const uploadForm = document.getElementById("uploadForm");
const cameraFile = document.getElementById("cameraFile");
const resultDiv = document.getElementById("result");

// Dynamic containers
const usageContainer = document.getElementById("usageContainer");
const replayContainer = document.getElementById("replayContainer");
const emailsContainer = document.getElementById("emailsContainer");

// ===========================================================
// INIT
// ===========================================================
document.addEventListener("DOMContentLoaded", () => {
  if (currentPlanDisplay) currentPlanDisplay.textContent = USER_PLAN;

  loadPlans();
  loadKnownFaces();
  loadCameras();
  loadRecentAlerts();
  refreshUsage();
  loadEmailAlertLogs();

  if (USER_PLAN === "Elite") loadReplay();

  verifyPendingPlanChange();
  checkBackend();
});

// ===========================================================
// PLANS (BACKEND)
// ===========================================================
async function loadPlans() {
  if (!planList) return;
  planList.innerHTML = "Loading plans...";

  try {
    const res = await fetch(`${API_BASE}/api/plans`);
    const plans = await res.json();

    planList.innerHTML = "";

    plans.forEach(p => {
      const div = document.createElement("div");
      div.className = "plan-item";
      const isCurrent = p.name === USER_PLAN;

      div.innerHTML = `
        <h4>${p.name}</h4>
        <p>${p.price === 0 ? "Free" : "$" + p.price + "/month"}</p>
        <p>${p.cameras} Cameras · ${p.scan_limit} Scans</p>
        ${
          isCurrent
            ? "<strong>Current Plan</strong>"
            : `<button onclick="selectPlan('${p.name}')">Choose</button>`
        }
      `;
      planList.appendChild(div);
    });
  } catch {
    planList.innerHTML = "⚠️ Failed to load plans";
  }
}

function selectPlan(planName) {
  localStorage.setItem(
    "pending_plan_change",
    JSON.stringify({ plan: planName })
  );
  window.location.href = "plans.html";
}

// ===========================================================
// VERIFY PLAN CHANGE (UPGRADE / DOWNGRADE)
// ===========================================================
async function verifyPendingPlanChange() {
  const pending = localStorage.getItem("pending_plan_change");
  if (!pending || !AUTH_TOKEN) return;

  try {
    const { plan } = JSON.parse(pending);

    const res = await authFetch(`${API_BASE}/api/upgrade-plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan })
    });

    const data = await res.json();
    if (data.success) {
      storedUser.plan = plan;
      localStorage.setItem("spotalert_user", JSON.stringify(storedUser));
      localStorage.removeItem("pending_plan_change");
      if (currentPlanDisplay) currentPlanDisplay.textContent = plan;
    }
  } catch {}
}

// ===========================================================
// KNOWN FACES
// ===========================================================
async function loadKnownFaces() {
  if (!faceList) return;
  faceList.innerHTML = "Loading known faces...";

  try {
    const res = await fetch(
      `${API_BASE}/api/known-faces/list?email=${encodeURIComponent(USER_EMAIL)}`
    );
    const faces = await res.json();
    faceList.innerHTML = "";

    if (!faces.length) {
      faceList.innerHTML = "<p>No known faces added.</p>";
      return;
    }

    faces.forEach(f => {
      const div = document.createElement("div");
      div.className = "face-item";
      div.innerHTML = `
        <strong>${f.first_name} ${f.last_name}</strong><br>
        ${f.images} image(s)<br>
        <button onclick="deleteKnownFace(${f.id})">Delete</button>
      `;
      faceList.appendChild(div);
    });
  } catch {
    faceList.innerHTML = "⚠️ Failed to load faces";
  }
}

async function deleteKnownFace(id) {
  if (!confirm("Delete this person?")) return;
  await fetch(`${API_BASE}/api/known-faces/${id}`, { method: "DELETE" });
  loadKnownFaces();
}

// ===========================================================
// CAMERAS
// ===========================================================
async function loadCameras() {
  if (!cameraList) return;
  cameraList.innerHTML = "Loading cameras...";

  try {
    const res = await fetch(
      `${API_BASE}/api/camera/list?email=${encodeURIComponent(USER_EMAIL)}`
    );
    const cams = await res.json();
    cameraList.innerHTML = "";

    if (!cams.length) {
      cameraList.innerHTML = "<li>No cameras registered.</li>";
      return;
    }

    cams.forEach(c => {
      const li = document.createElement("li");
      li.textContent = `${c.name} (${c.ip})`;
      cameraList.appendChild(li);
    });
  } catch {
    cameraList.innerHTML = "<li>⚠️ Failed to load cameras</li>";
  }
}

// ===========================================================
// ALERT TRIGGER
// ===========================================================
if (uploadForm) {
  uploadForm.addEventListener("submit", async e => {
    e.preventDefault();
    if (!cameraFile.files[0]) return;

    resultDiv.textContent = "⏳ Processing...";

    const fd = new FormData();
    fd.append("image", cameraFile.files[0]);
    fd.append("email", USER_EMAIL);

    try {
      const res = await fetch(`${API_BASE}/api/trigger-alert`, {
        method: "POST",
        body: fd
      });

      const data = await res.json();
      resultDiv.textContent =
        data.faces && data.faces.length
          ? "✅ Known face detected"
          : "🚨 Unknown person detected";

      loadRecentAlerts();
      refreshUsage();
      if (USER_PLAN === "Elite") loadReplay();
    } catch {
      resultDiv.textContent = "⚠️ Upload failed";
    }
  });
}

// ===========================================================
// ALERT HISTORY (WITH IMAGE + DELETE)
// ===========================================================
async function loadRecentAlerts() {
  if (!alertList) return;
  alertList.innerHTML = "Loading alerts...";

  try {
    const res = await authFetch(`${API_BASE}/api/alerts/list?type=all`);
    const rows = await res.json();
    alertList.innerHTML = "";

    if (!rows.length) {
      alertList.innerHTML = "<li>No alerts yet.</li>";
      return;
    }

    rows.slice(0, 10).forEach(r => {
      const li = document.createElement("li");
      const img = r.image_url
        ? `<br><img src="${r.image_url}" style="width:120px;border-radius:8px;margin-top:6px;">`
        : "";

      li.innerHTML = `
        ${new Date(r.timestamp).toLocaleString()} — ${r.type}
        ${img}<br>
        <button onclick="deleteAlert(${r.id})">Delete</button>
      `;
      alertList.appendChild(li);
    });
  } catch {
    alertList.innerHTML = "<li>⚠️ Failed to load alerts</li>";
  }
}

async function deleteAlert(id) {
  if (!confirm("Delete this alert?")) return;
  await authFetch(`${API_BASE}/api/alerts/${id}`, { method: "DELETE" });
  loadRecentAlerts();
  refreshUsage();
}

// ===========================================================
// USAGE / BILLING
// ===========================================================
async function refreshUsage() {
  usageContainer.innerHTML = "Loading usage...";

  try {
    const res = await fetch(
      `${API_BASE}/api/usage-summary?email=${encodeURIComponent(USER_EMAIL)}`
    );
    const u = await res.json();

    usageContainer.innerHTML = `
      <h3>📊 Usage (${u.month})</h3>
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

    replayContainer.innerHTML = "<h3>🎥 Replay</h3>";
    rows.forEach(r => {
      const div = document.createElement("div");
      div.textContent = `${r.type} — ${new Date(r.timestamp).toLocaleString()}`;
      replayContainer.appendChild(div);
    });
  } catch {
    replayContainer.innerHTML = "⚠️ Replay unavailable";
  }
}

// ===========================================================
// EMAIL LOGS
// ===========================================================
async function loadEmailAlertLogs() {
  emailsContainer.innerHTML = "Loading emails...";

  try {
    const res = await fetch(`${API_BASE}/api/elite/replay?minutes=120`);
    const rows = await res.json();

    emailsContainer.innerHTML = "<h3>📩 Email Alerts</h3>";
    rows.forEach(r => {
      if (r.type === "unknown") {
        const p = document.createElement("p");
        p.textContent = `${new Date(r.timestamp).toLocaleString()} — Email sent`;
        emailsContainer.appendChild(p);
      }
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
    localStorage.removeItem("token");
    window.location.href = "login.html";
  };
}

if (upgradeBtn) upgradeBtn.onclick = () => (window.location.href = "plans.html");
if (downgradeBtn) downgradeBtn.onclick = () => (window.location.href = "plans.html");

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
