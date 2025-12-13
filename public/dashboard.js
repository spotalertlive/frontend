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

  loadPlans();
  loadKnownFaces();
  loadCameras();
  loadRecentAlerts();
  refreshUsage();
  loadEmailAlertLogs();

  if (USER_PLAN === "Elite") loadReplay();

  checkBackend();
});

// ===========================================================
// PLANS (REAL – BACKEND)
// ===========================================================
async function loadPlans() {
  if (!planList) return;

  planList.innerHTML = "Loading plans...";

  try {
    const res = await fetch(`${API_BASE}/api/plans`);
    if (!res.ok) throw new Error();

    const plans = await res.json();
    planList.innerHTML = "";

    plans.forEach(p => {
      const div = document.createElement("div");
      div.className = "plan-item";

      const isCurrent = p.name === USER_PLAN;

      div.innerHTML = `
        <h4>${p.name}</h4>
        <p>Price: ${p.price === 0 ? "Free" : "$" + p.price + "/month"}</p>
        <p>Cameras: ${p.cameras}</p>
        <p>Scans: ${p.scan_limit}</p>
        ${
          isCurrent
            ? `<strong>Current Plan</strong>`
            : `<button onclick="selectPlan('${p.name}')">Choose Plan</button>`
        }
      `;

      planList.appendChild(div);
    });

  } catch {
    planList.innerHTML = "⚠️ Failed to load plans";
  }
}

function selectPlan(planName) {
  // SaaS-correct flow → redirect to plans / Stripe
  localStorage.setItem(
    "pending_plan_change",
    JSON.stringify({ email: USER_EMAIL, plan: planName })
  );
  window.location.href = "plans.html";
}

// ===========================================================
// KNOWN FACES (DB ONLY)
// ===========================================================
async function loadKnownFaces() {
  if (!faceList) return;
  faceList.innerHTML = "Loading known faces...";

  try {
    const res = await fetch(
      `${API_BASE}/api/known-faces/list?email=${encodeURIComponent(USER_EMAIL)}`
    );
    if (!res.ok) throw new Error();

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
        <span>${f.images} image(s)</span><br>
        <button onclick="deleteKnownFace(${f.id})">Delete</button>
      `;

      faceList.appendChild(div);
    });

  } catch {
    faceList.innerHTML = "⚠️ Failed to load known faces";
  }
}

async function deleteKnownFace(id) {
  if (!confirm("Remove this person permanently?")) return;
  await fetch(`${API_BASE}/api/known-faces/${id}`, { method: "DELETE" });
  loadKnownFaces();
}

// ===========================================================
// CAMERAS (DB)
// ===========================================================
async function loadCameras() {
  if (!cameraList) return;
  cameraList.innerHTML = "Loading cameras...";

  try {
    const res = await fetch(
      `${API_BASE}/api/camera/list?email=${encodeURIComponent(USER_EMAIL)}`
    );
    if (!res.ok) throw new Error();

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
    if (!cameraFile.files[0]) return alert("Select image");

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
      if (!res.ok) throw new Error(data.error);

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
// ALERT HISTORY (DB)
// ===========================================================
async function loadRecentAlerts() {
  if (!alertList) return;
  alertList.innerHTML = "Loading alerts...";

  try {
    const res = await fetch(`${API_BASE}/api/elite/replay?minutes=60`);
    if (!res.ok) throw new Error();

    const rows = await res.json();
    alertList.innerHTML = "";

    if (!rows.length) {
      alertList.innerHTML = "<li>No recent alerts.</li>";
      return;
    }

    rows.slice(0, 10).forEach(r => {
      const li = document.createElement("li");
      li.textContent = `${new Date(r.timestamp).toLocaleString()} — ${r.type}`;
      alertList.appendChild(li);
    });

  } catch {
    alertList.innerHTML = "<li>⚠️ Failed to load alerts</li>";
  }
}

// ===========================================================
// USAGE SUMMARY
// ===========================================================
async function refreshUsage() {
  usageContainer.innerHTML = "Loading usage...";

  try {
    const res = await fetch(
      `${API_BASE}/api/usage-summary?email=${encodeURIComponent(USER_EMAIL)}`
    );
    if (!res.ok) throw new Error();

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
// EMAIL ALERT LOGS
// ===========================================================
async function loadEmailAlertLogs() {
  emailsContainer.innerHTML = "Loading email alerts...";

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
