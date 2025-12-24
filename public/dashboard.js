// ===========================================================
// SpotAlert Dashboard – FINAL PRODUCTION VERSION (LOCKED)
// UNKNOWN ALERTS ONLY (CORE DIFFERENTIATOR)
// ===========================================================

const API_BASE = "https://api.spotalert.live";

// -----------------------------------------------------------
// USER CONTEXT
// -----------------------------------------------------------
let storedUser = {};
try {
  storedUser = JSON.parse(localStorage.getItem("spotalert_user") || "{}");
} catch {}

const USER_EMAIL = (storedUser.email || "").toLowerCase();
const USER_PLAN = storedUser.plan || "Free Trial";

// -----------------------------------------------------------
// AUTH TOKEN
// -----------------------------------------------------------
const AUTH_TOKEN =
  localStorage.getItem("token") ||
  localStorage.getItem("admin_token") ||
  "";

// -----------------------------------------------------------
// AUTH FETCH (SINGLE SOURCE)
// -----------------------------------------------------------
async function authFetch(url, options = {}) {
  const headers = options.headers ? { ...options.headers } : {};
  if (AUTH_TOKEN) headers.Authorization = "Bearer " + AUTH_TOKEN;
  return fetch(url, { ...options, headers, cache: "no-store" });
}

// -----------------------------------------------------------
// DOM ELEMENTS
// -----------------------------------------------------------
const currentPlanDisplay = document.getElementById("currentPlan");
const faceList = document.getElementById("faceList");
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

  await loadKnownFaces();     // whitelist only
  await loadCameras();        // camera status
  await loadUnknownAlerts();  // 🚨 ONLY UNKNOWN
  await refreshUsage();       // costs from unknown alerts only
  checkBackend();
});

// ===========================================================
// KNOWN FACES (WHITELIST ONLY — NO ALERTS EVER)
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
// CAMERAS (REGISTERED SOURCES)
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
// MANUAL TEST DETECTION (UNKNOWN ONLY COUNTS)
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
        body: fd
      });

      const data = await res.json();

      resultDiv.textContent =
        data.unknown === true
          ? "🚨 Unknown person detected"
          : "✅ Known face ignored";

      await loadUnknownAlerts();
      await refreshUsage();
    } catch {
      resultDiv.textContent = "Detection failed";
    }
  });
}

// ===========================================================
// 🚨 ALERTS — UNKNOWN ONLY (SPOTALERT CORE)
// ===========================================================
async function loadUnknownAlerts() {
  if (!alertList) return;
  alertList.innerHTML = "<li>Loading unknown alerts...</li>";

  try {
    const res = await authFetch(
      `${API_BASE}/api/alerts/list?type=unknown&email=${encodeURIComponent(USER_EMAIL)}`
    );
    if (!res.ok) throw new Error();

    const rows = await res.json();
    alertList.innerHTML = "";

    if (!rows.length) {
      alertList.innerHTML = "<li>No unknown alerts.</li>";
      return;
    }

    rows.slice(0, 10).forEach((r) => {
      const li = document.createElement("li");
      li.innerHTML = `
        🚨 <strong>Unknown Person</strong><br>
        ${new Date(r.timestamp).toLocaleString()}
        ${
          r.image_url
            ? `<br><img src="${r.image_url}" style="max-width:120px;border-radius:8px;margin-top:6px;">`
            : ""
        }
        <br>
        <button onclick="deleteAlert(${r.id})">Delete</button>
      `;
      alertList.appendChild(li);
    });
  } catch {
    alertList.innerHTML = "<li>⚠️ Failed to load alerts</li>";
  }
}

window.deleteAlert = async (id) => {
  await authFetch(`${API_BASE}/api/alerts/${id}`, { method: "DELETE" });
  await loadUnknownAlerts();
  await refreshUsage();
};

// ===========================================================
// USAGE & COSTS (UNKNOWN ALERTS ONLY)
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
      <h3>Usage – ${u.month}</h3>
      <p>Unknown alerts cost: <strong>$${u.total_cost_usd}</strong></p>
    `;
  } catch {
    usageContainer.innerHTML = "Usage unavailable";
  }
}

// ===========================================================
// BACKEND HEALTH CHECK
// ===========================================================
async function checkBackend() {
  try {
    await fetch(`${API_BASE}/api/status`, { cache: "no-store" });
    console.log("✅ Backend OK");
  } catch {
    console.log("❌ Backend offline");
  }
}
