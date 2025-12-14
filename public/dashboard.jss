// ===========================================================
// SpotAlert Dashboard – FINAL WIRED VERSION (PRODUCTION)
// File: dashboard.js
// ===========================================================

// 🔹 API BASE
const API_BASE = "https://api.spotalert.live";

// ===========================================================
// USER CONTEXT
// ===========================================================
let storedUser = {};
try {
  storedUser = JSON.parse(localStorage.getItem("spotalert_user")) || {};
} catch {}

const USER_EMAIL = storedUser.email;
const USER_PLAN = storedUser.plan || "Free Trial";

if (!USER_EMAIL) {
  window.location.href = "login.html";
}

// ===========================================================
// ELEMENT REFERENCES (MATCH HTML EXACTLY)
// ===========================================================
const faceList = document.getElementById("faceList");
const cameraList = document.getElementById("cameraList");
const alertList = document.getElementById("alertList");

const usageContainer = document.getElementById("usageContainer");
const replayContainer = document.getElementById("replayContainer");
const emailsContainer = document.getElementById("emailsContainer");

const currentPlanBanner = document.getElementById("currentPlan");

const uploadForm = document.getElementById("uploadForm");
const cameraFile = document.getElementById("cameraFile");
const resultDiv = document.getElementById("result");

const faceUploadForm = document.getElementById("faceUploadForm");
const faceLabelInput = document.getElementById("faceLabel");
const faceImageInput = document.getElementById("faceImage");

const upgradeBtn = document.getElementById("upgradeBtn");
const logoutBtn = document.getElementById("logoutBtn2");

// ===========================================================
// INIT
// ===========================================================
document.addEventListener("DOMContentLoaded", () => {
  currentPlanBanner.textContent = `Current Plan: ${USER_PLAN}`;

  loadKnownFaces();
  loadCameras();
  loadRecentAlerts();
  loadUsageSummary();

  if (USER_PLAN === "Elite") {
    loadReplay();
    loadEmailLogs();
  }

  backendHealthCheck();
});

// ===========================================================
// KNOWN FACES
// ===========================================================
async function loadKnownFaces() {
  faceList.innerHTML = "Loading known faces...";

  try {
    const res = await fetch(
      `${API_BASE}/api/known-faces/list?email=${encodeURIComponent(USER_EMAIL)}`,
      { cache: "no-store" }
    );
    const faces = await res.json();

    faceList.innerHTML = "";

    if (!faces.length) {
      faceList.innerHTML = "<p>No known faces added yet.</p>";
      return;
    }

    faces.forEach(face => {
      const div = document.createElement("div");
      div.className = "face-item";

      let thumbs = "";
      face.images.forEach(img => {
        thumbs += `<img src="${img}" class="face-thumb" />`;
      });

      div.innerHTML = `
        <h4>${face.name}</h4>
        <div class="face-thumbs">${thumbs}</div>
        <button class="btn-danger" onclick="deleteFace(${face.id})">
          Delete
        </button>
      `;

      faceList.appendChild(div);
    });

  } catch (e) {
    faceList.innerHTML = "⚠️ Failed to load known faces.";
  }
}

async function deleteFace(id) {
  if (!confirm("Delete this person permanently?")) return;

  await fetch(`${API_BASE}/api/known-faces/${id}`, {
    method: "DELETE"
  });

  loadKnownFaces();
}

// Add Face
if (faceUploadForm) {
  faceUploadForm.addEventListener("submit", async e => {
    e.preventDefault();

    const fd = new FormData();
    fd.append("email", USER_EMAIL);
    fd.append("label", faceLabelInput.value);
    fd.append("image", faceImageInput.files[0]);

    await fetch(`${API_BASE}/api/known-faces/add`, {
      method: "POST",
      body: fd
    });

    faceUploadForm.reset();
    loadKnownFaces();
  });
}

// ===========================================================
// CAMERAS
// ===========================================================
async function loadCameras() {
  cameraList.innerHTML = "Loading cameras...";

  try {
    const res = await fetch(
      `${API_BASE}/api/camera/list?email=${encodeURIComponent(USER_EMAIL)}`,
      { cache: "no-store" }
    );
    const cams = await res.json();

    cameraList.innerHTML = "";

    if (!cams.length) {
      cameraList.innerHTML = "<li>No cameras connected.</li>";
      return;
    }

    cams.forEach(cam => {
      const li = document.createElement("li");
      li.textContent = `${cam.name} (${cam.ip})`;
      cameraList.appendChild(li);
    });

  } catch {
    cameraList.innerHTML = "<li>⚠️ Failed to load cameras</li>";
  }
}

// ===========================================================
// TEST DETECTION
// ===========================================================
if (uploadForm) {
  uploadForm.addEventListener("submit", async e => {
    e.preventDefault();

    resultDiv.textContent = "Processing image...";

    const fd = new FormData();
    fd.append("email", USER_EMAIL);
    fd.append("image", cameraFile.files[0]);

    try {
      const res = await fetch(`${API_BASE}/api/detect`, {
        method: "POST",
        body: fd
      });

      const data = await res.json();

      resultDiv.textContent =
        data.type === "unknown"
          ? "🚨 Unknown person detected"
          : "✅ Known face detected";

      loadRecentAlerts();
      loadUsageSummary();

      if (USER_PLAN === "Elite") loadReplay();

    } catch {
      resultDiv.textContent = "⚠️ Detection failed";
    }
  });
}

// ===========================================================
// ALERT HISTORY
// ===========================================================
async function loadRecentAlerts() {
  alertList.innerHTML = "Loading alerts...";

  try {
    const res = await fetch(
      `${API_BASE}/api/alerts/list?email=${encodeURIComponent(USER_EMAIL)}`,
      { cache: "no-store" }
    );
    const alerts = await res.json();

    alertList.innerHTML = "";

    if (!alerts.length) {
      alertList.innerHTML = "<li>No alerts yet.</li>";
      return;
    }

    alerts.slice(0, 10).forEach(a => {
      const li = document.createElement("li");
      li.textContent = `${new Date(a.timestamp).toLocaleString()} — ${a.type}`;
      alertList.appendChild(li);
    });

  } catch {
    alertList.innerHTML = "<li>⚠️ Failed to load alerts</li>";
  }
}

// ===========================================================
// USAGE SUMMARY
// ===========================================================
async function loadUsageSummary() {
  usageContainer.innerHTML = "Loading usage...";

  try {
    const res = await fetch(
      `${API_BASE}/api/usage-summary?email=${encodeURIComponent(USER_EMAIL)}`,
      { cache: "no-store" }
    );
    const u = await res.json();

    usageContainer.innerHTML = `
      <h3>📊 Usage – ${u.month}</h3>
      <p>Scans Used: ${u.scans_used}</p>
      <p>Remaining: ${u.remaining}</p>
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
  replayContainer.innerHTML = "<h3>🎥 Recent Replay</h3>";

  try {
    const res = await fetch(
      `${API_BASE}/api/elite/replay?email=${encodeURIComponent(USER_EMAIL)}`
    );
    const rows = await res.json();

    rows.forEach(r => {
      const div = document.createElement("div");
      div.className = "replay-box";
      div.textContent = `${r.type} – ${new Date(r.timestamp).toLocaleString()}`;
      replayContainer.appendChild(div);
    });

  } catch {
    replayContainer.innerHTML = "⚠️ Replay unavailable";
  }
}

// ===========================================================
// EMAIL LOGS (ELITE)
// ===========================================================
async function loadEmailLogs() {
  emailsContainer.innerHTML = "<h3>📩 Email Alerts</h3>";

  try {
    const res = await fetch(
      `${API_BASE}/api/alerts/email-logs?email=${encodeURIComponent(USER_EMAIL)}`
    );
    const rows = await res.json();

    rows.forEach(r => {
      const p = document.createElement("p");
      p.textContent = `${new Date(r.timestamp).toLocaleString()} – Sent`;
      emailsContainer.appendChild(p);
    });

  } catch {
    emailsContainer.innerHTML = "⚠️ Email logs unavailable";
  }
}

// ===========================================================
// NAV ACTIONS
// ===========================================================
if (upgradeBtn) {
  upgradeBtn.onclick = () => (window.location.href = "plans.html");
}

if (logoutBtn) {
  logoutBtn.onclick = () => {
    localStorage.removeItem("spotalert_user");
    window.location.href = "login.html";
  };
}

// ===========================================================
// BACKEND HEALTH
// ===========================================================
async function backendHealthCheck() {
  try {
    await fetch(`${API_BASE}/api/status`, { cache: "no-store" });
    console.log("✅ Backend OK");
  } catch {
    console.warn("⚠️ Backend unreachable");
  }
}
