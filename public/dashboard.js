// ===========================================================
// SpotAlert Dashboard – FINAL PRODUCTION VERSION (LOCKED)
// FULLY WIRED: Known Faces, Cameras, Alerts, Usage, Plans
// ===========================================================

const API_BASE = "https://api.spotalert.live";

// ---------------------------
// USER CONTEXT
// ---------------------------
let storedUser = {};
try {
  storedUser = JSON.parse(localStorage.getItem("spotalert_user") || "{}");
} catch {}

const USER_EMAIL = (storedUser.email || "").toLowerCase();
const USER_PLAN = storedUser.plan || "Free Trial";

// ---------------------------
// AUTH TOKEN
// ---------------------------
const AUTH_TOKEN =
  localStorage.getItem("token") ||
  localStorage.getItem("admin_token") ||
  "";

// ---------------------------
// AUTH FETCH
// ---------------------------
async function authFetch(url, options = {}) {
  const headers = options.headers ? { ...options.headers } : {};
  if (AUTH_TOKEN) headers.Authorization = "Bearer " + AUTH_TOKEN;
  return fetch(url, { ...options, headers, cache: "no-store" });
}

// ---------------------------
// ELEMENTS
// ---------------------------
const currentPlanDisplay = document.getElementById("currentPlan");
const faceList = document.getElementById("faceList");
const faceUploadForm = document.getElementById("faceUploadForm");
const faceLabel = document.getElementById("faceLabel");
const faceImage = document.getElementById("faceImage");
const cameraList = document.getElementById("cameraList");
const uploadForm = document.getElementById("uploadForm");
const cameraFile = document.getElementById("cameraFile");
const resultDiv = document.getElementById("result");
const alertList = document.getElementById("alertList");
const usageContainer = document.getElementById("usageContainer");

// ===========================================================
// INIT
// ===========================================================
document.addEventListener("DOMContentLoaded", async () => {
  if (!USER_EMAIL || !AUTH_TOKEN) {
    window.location.href = "login.html";
    return;
  }

  if (currentPlanDisplay) currentPlanDisplay.textContent = USER_PLAN;

  await loadKnownFaces();
  await loadCameras();
  await loadRecentAlerts();
  await refreshUsage();
  checkBackend();
});

// ===========================================================
// KNOWN FACES
// ===========================================================
async function loadKnownFaces() {
  if (!faceList) return;
  faceList.innerHTML = "Loading known faces...";

  try {
    const res = await authFetch(
      `${API_BASE}/api/known-faces/list?email=${encodeURIComponent(USER_EMAIL)}`
    );
    if (!res.ok) throw new Error();

    const faces = await res.json();
    faceList.innerHTML = "";

    if (!faces.length) {
      faceList.innerHTML = "<p>No known faces added.</p>";
      return;
    }

    faces.forEach((f) => {
      const div = document.createElement("div");
      div.className = "face-item";
      div.innerHTML = `
        <strong>${f.first_name} ${f.last_name}</strong><br>
        <small>${f.images} image(s)</small><br>
        <button class="btn-danger" onclick="deleteKnownFace(${f.id})">Delete</button>
      `;
      faceList.appendChild(div);
    });
  } catch {
    faceList.innerHTML = "⚠️ Failed to load known faces";
  }
}

window.deleteKnownFace = async (id) => {
  if (!confirm("Delete this person?")) return;
  await authFetch(`${API_BASE}/api/known-faces/${id}`, { method: "DELETE" });
  await loadKnownFaces();
};

// ===========================================================
// CAMERAS (FIXED — SINGLE SOURCE OF TRUTH)
// ===========================================================
async function loadCameras() {
  if (!cameraList) return;
  cameraList.innerHTML = "<li>Loading cameras...</li>";

  try {
    const res = await authFetch(
      `${API_BASE}/api/camera/list?email=${encodeURIComponent(USER_EMAIL)}`
    );
    if (!res.ok) throw new Error();

    const cams = await res.json();
    cameraList.innerHTML = "";

    if (!cams.length) {
      cameraList.innerHTML = "<li>No cameras registered.</li>";
      return;
    }

    cams.forEach((c) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <strong>${c.name}</strong> (${c.ip}) — 
        <span style="color:${c.status === "online" ? "green" : "red"}">
          ${c.status || "offline"}
        </span>
      `;
      cameraList.appendChild(li);
    });
  } catch {
    cameraList.innerHTML = "<li>⚠️ Camera load failed</li>";
  }
}

// ===========================================================
// TEST DETECTION
// ===========================================================
if (uploadForm) {
  uploadForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!cameraFile.files[0]) return;

    resultDiv.textContent = "Processing...";

    const fd = new FormData();
    fd.append("image", cameraFile.files[0]);
    fd.append("email", USER_EMAIL);

    try {
      const res = await authFetch(`${API_BASE}/api/trigger-alert`, {
        method: "POST",
        body: fd,
      });

      const data = await res.json();
      resultDiv.textContent =
        data.faces && data.faces.length
          ? "✅ Known face detected"
          : "🚨 Unknown person detected";

      await loadRecentAlerts();
      await refreshUsage();
    } catch {
      resultDiv.textContent = "Detection failed";
    }
  });
}

// ===========================================================
// ALERTS
// ===========================================================
async function loadRecentAlerts() {
  if (!alertList) return;
  alertList.innerHTML = "<li>Loading alerts...</li>";

  try {
    const res = await authFetch(`${API_BASE}/api/alerts/list?type=all`);
    if (!res.ok) throw new Error();

    const rows = await res.json();
    alertList.innerHTML = "";

    if (!rows.length) {
      alertList.innerHTML = "<li>No alerts yet.</li>";
      return;
    }

    rows.slice(0, 10).forEach((r) => {
      const li = document.createElement("li");
      li.innerHTML = `
        ${new Date(r.timestamp).toLocaleString()} — <strong>${r.type}</strong>
        <br><button onclick="deleteAlert(${r.id})">Delete</button>
      `;
      alertList.appendChild(li);
    });
  } catch {
    alertList.innerHTML = "<li>Alert load failed</li>";
  }
}

window.deleteAlert = async (id) => {
  await authFetch(`${API_BASE}/api/alerts/${id}`, { method: "DELETE" });
  await loadRecentAlerts();
  await refreshUsage();
};

// ===========================================================
// USAGE
// ===========================================================
async function refreshUsage() {
  if (!usageContainer) return;

  try {
    const res = await authFetch(
      `${API_BASE}/api/usage-summary?email=${encodeURIComponent(USER_EMAIL)}`
    );
    if (!res.ok) throw new Error();

    const u = await res.json();
    usageContainer.innerHTML = `
      <h3>Usage (${u.month})</h3>
      <p>Total cost: $${u.total_cost_usd}</p>
    `;
  } catch {
    usageContainer.innerHTML = "Usage unavailable";
  }
}

// ===========================================================
// BACKEND CHECK
// ===========================================================
async function checkBackend() {
  try {
    await fetch(`${API_BASE}/api/status`, { cache: "no-store" });
    console.log("✅ Backend OK");
  } catch {
    console.log("❌ Backend offline");
  }
}
