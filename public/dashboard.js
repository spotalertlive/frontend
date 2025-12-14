// ===========================================================
// SpotAlert Dashboard – FINAL WORKING VERSION (WIRED FRONT)
// File: public/dashboard.js
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
// AUTH TOKEN (user or admin)
// ---------------------------
const AUTH_TOKEN =
  localStorage.getItem("token") ||
  localStorage.getItem("admin_token") ||
  "";

// ---------------------------
// AUTH FETCH HELPER
// ---------------------------
async function authFetch(url, options = {}) {
  const headers = options.headers ? { ...options.headers } : {};
  if (AUTH_TOKEN) headers["Authorization"] = "Bearer " + AUTH_TOKEN;
  return fetch(url, { ...options, headers });
}

// ---------------------------
// ELEMENTS (match your dashboard.html)
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
const replayContainer = document.getElementById("replayContainer");
const emailsContainer = document.getElementById("emailsContainer");

const plansContainer = document.getElementById("plansContainer");
const upgradeBtn = document.getElementById("upgradeBtn");

const logoutBtn2 = document.getElementById("logoutBtn2");

// ===========================================================
// INIT
// ===========================================================
document.addEventListener("DOMContentLoaded", async () => {
  if (!USER_EMAIL) {
    // no user = go login
    window.location.href = "login.html";
    return;
  }

  if (currentPlanDisplay) currentPlanDisplay.textContent = USER_PLAN;

  // Load everything
  await loadPlansIntoDashboard();
  await loadKnownFaces();
  await loadCameras();
  await loadRecentAlerts();
  await refreshUsage();
  await loadEmailAlertLogs();

  if (USER_PLAN === "Elite") {
    await loadReplay();
  }

  // If user came back from plans.html and we stored pending plan change
  await verifyPendingPlanChange();

  // Quick backend health check
  checkBackend();
});

// ===========================================================
// PLANS (SHOW REAL PLANS IN DASHBOARD)
// - Your HTML uses #plansContainer, so we fill it from backend
// ===========================================================
async function loadPlansIntoDashboard() {
  if (!plansContainer) return;

  try {
    const res = await fetch(`${API_BASE}/api/plans`);
    if (!res.ok) throw new Error("plans failed");
    const plans = await res.json();

    // Build cards (replace the static ones so it’s real)
    plansContainer.innerHTML = "";

    plans.forEach((p) => {
      const div = document.createElement("div");
      div.className = "plan-card";

      const isCurrent = p.name === USER_PLAN;

      div.innerHTML = `
        <strong>${p.name}</strong><br>
        ${p.price === 0 ? "Free" : "$" + p.price + "/month"}<br>
        ${p.cameras} Cameras · ${p.scan_limit} Scans
        <div style="margin-top:10px;">
          ${
            isCurrent
              ? "<span style='font-weight:700;color:#0073ff;'>Current Plan</span>"
              : `<button class="start-btn" style="padding:8px 12px;" onclick="selectPlan('${p.name}')">Choose</button>`
          }
        </div>
      `;

      plansContainer.appendChild(div);
    });
  } catch {
    // keep your static content if backend fails
    // (no placeholders, just don’t break UI)
  }
}

window.selectPlan = function selectPlan(planName) {
  localStorage.setItem("pending_plan_change", JSON.stringify({ plan: planName }));
  window.location.href = "plans.html";
};

// ===========================================================
// VERIFY PLAN CHANGE (AFTER RETURN FROM PLANS)
// ===========================================================
async function verifyPendingPlanChange() {
  const pending = localStorage.getItem("pending_plan_change");
  if (!pending) return;

  if (!AUTH_TOKEN) {
    // user is not authenticated properly
    return;
  }

  try {
    const { plan } = JSON.parse(pending);

    const res = await authFetch(`${API_BASE}/api/upgrade-plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });

    const data = await res.json();

    if (data && (data.success || data.ok)) {
      storedUser.plan = plan;
      localStorage.setItem("spotalert_user", JSON.stringify(storedUser));
      localStorage.removeItem("pending_plan_change");
      if (currentPlanDisplay) currentPlanDisplay.textContent = plan;

      // Refresh sections affected by plan
      if (plan === "Elite") await loadReplay();
      await refreshUsage();
      await loadPlansIntoDashboard();
    }
  } catch {
    // don’t loop
  }
}

// ===========================================================
// KNOWN FACES (LIST + ADD + DELETE)
// IMPORTANT: list endpoint already exists in your backend
// For ADD we call /api/known-faces/add (common pattern)
// If your backend uses a different POST path, tell me the exact route name.
// ===========================================================
async function loadKnownFaces() {
  if (!faceList) return;
  faceList.innerHTML = "Loading known faces...";

  try {
    const res = await fetch(
      `${API_BASE}/api/known-faces/list?email=${encodeURIComponent(USER_EMAIL)}`
    );
    if (!res.ok) throw new Error("faces failed");

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
        <strong>${f.first_name || ""} ${f.last_name || ""}</strong><br>
        <span>${f.images || 0} image(s)</span><br>
        <button class="btn-danger" onclick="deleteKnownFace(${f.id})">Delete</button>
      `;

      faceList.appendChild(div);
    });
  } catch {
    faceList.innerHTML = "⚠️ Failed to load faces";
  }
}

// Add face submit
if (faceUploadForm) {
  faceUploadForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!faceLabel?.value || !faceImage?.files?.[0]) {
      alert("Enter name and choose an image");
      return;
    }

    const fd = new FormData();
    fd.append("email", USER_EMAIL);
    fd.append("label", faceLabel.value.trim());
    fd.append("image", faceImage.files[0]);

    try {
      const res = await authFetch(`${API_BASE}/api/known-faces/add`, {
        method: "POST",
        body: fd,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Add failed");

      faceLabel.value = "";
      faceImage.value = "";
      await loadKnownFaces();
    } catch (err) {
      alert("Failed to add face: " + (err.message || ""));
    }
  });
}

window.deleteKnownFace = async function deleteKnownFace(id) {
  if (!confirm("Remove this person permanently?")) return;
  await authFetch(`${API_BASE}/api/known-faces/${id}`, { method: "DELETE" });
  await loadKnownFaces();
};

// ===========================================================
// CAMERAS (LIST)
// ===========================================================
async function loadCameras() {
  if (!cameraList) return;
  cameraList.innerHTML = "<li>Loading cameras...</li>";

  try {
    const res = await fetch(
      `${API_BASE}/api/camera/list?email=${encodeURIComponent(USER_EMAIL)}`
    );
    if (!res.ok) throw new Error("cams failed");

    const cams = await res.json();
    cameraList.innerHTML = "";

    if (!cams.length) {
      cameraList.innerHTML = "<li>No cameras registered.</li>";
      return;
    }

    cams.forEach((c) => {
      const li = document.createElement("li");
      li.textContent = `${c.name} (${c.ip})`;
      cameraList.appendChild(li);
    });
  } catch {
    cameraList.innerHTML = "<li>⚠️ Failed to load cameras</li>";
  }
}

// ===========================================================
// TEST DETECTION (TRIGGER ALERT)
// ===========================================================
if (uploadForm) {
  uploadForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!cameraFile?.files?.[0]) return alert("Select image");

    if (resultDiv) resultDiv.textContent = "⏳ Processing...";

    const fd = new FormData();
    fd.append("image", cameraFile.files[0]);
    fd.append("email", USER_EMAIL);

    try {
      const res = await authFetch(`${API_BASE}/api/trigger-alert`, {
        method: "POST",
        body: fd,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Trigger failed");

      if (resultDiv) {
        resultDiv.textContent =
          data.faces && data.faces.length
            ? "✅ Known face detected"
            : "🚨 Unknown person detected";
      }

      await loadRecentAlerts();
      await refreshUsage();
      if ((storedUser.plan || "") === "Elite") await loadReplay();
    } catch {
      if (resultDiv) resultDiv.textContent = "⚠️ Upload failed";
    }
  });
}

// ===========================================================
// ALERT HISTORY (USES YOUR backend routes/alerts.js)
// ===========================================================
async function loadRecentAlerts() {
  if (!alertList) return;
  alertList.innerHTML = "<li>Loading alerts...</li>";

  try {
    const res = await authFetch(`${API_BASE}/api/alerts/list?type=all`);
    if (!res.ok) throw new Error("alerts failed");

    const rows = await res.json();
    alertList.innerHTML = "";

    if (!rows.length) {
      alertList.innerHTML = "<li>No alerts yet.</li>";
      return;
    }

    rows.slice(0, 10).forEach((r) => {
      const li = document.createElement("li");

      const img = r.image_url
        ? `<br><img src="${r.image_url}" style="width:120px;border-radius:8px;margin-top:6px;">`
        : "";

      li.innerHTML = `
        ${new Date(r.timestamp).toLocaleString()} — <strong>${r.type}</strong>
        ${img}<br>
        <button class="btn-danger" onclick="deleteAlert(${r.id})">Delete</button>
      `;

      alertList.appendChild(li);
    });
  } catch {
    alertList.innerHTML = "<li>⚠️ Failed to load alerts</li>";
  }
}

window.deleteAlert = async function deleteAlert(id) {
  if (!confirm("Delete this alert?")) return;
  await authFetch(`${API_BASE}/api/alerts/${id}`, { method: "DELETE" });
  await loadRecentAlerts();
  await refreshUsage();
};

// ===========================================================
// USAGE / BILLING SUMMARY
// ===========================================================
async function refreshUsage() {
  if (!usageContainer) return;
  usageContainer.innerHTML = "Loading usage...";

  try {
    const res = await authFetch(
      `${API_BASE}/api/usage-summary?email=${encodeURIComponent(USER_EMAIL)}`
    );
    if (!res.ok) throw new Error("usage failed");

    const u = await res.json();

    usageContainer.innerHTML = `
      <h3>📊 Usage (${u.month || ""})</h3>
      <p><strong>Total Cost:</strong> $${u.total_cost_usd ?? "0.00"}</p>
    `;
  } catch {
    usageContainer.innerHTML = "⚠️ Usage unavailable";
  }
}

// ===========================================================
// ELITE REPLAY
// ===========================================================
async function loadReplay() {
  if (!replayContainer) return;
  replayContainer.innerHTML = "Loading replay...";

  try {
    const res = await authFetch(`${API_BASE}/api/elite/replay?minutes=10`);
    if (!res.ok) throw new Error("replay failed");

    const rows = await res.json();
    replayContainer.innerHTML = "<h3>🎥 Replay</h3>";

    if (!rows.length) {
      replayContainer.innerHTML += "<p>No replay data.</p>";
      return;
    }

    rows.forEach((r) => {
      const div = document.createElement("div");
      div.className = "replay-box";
      div.textContent = `${r.type} — ${new Date(r.timestamp).toLocaleString()}`;
      replayContainer.appendChild(div);
    });
  } catch {
    replayContainer.innerHTML = "⚠️ Replay unavailable";
  }
}

// ===========================================================
// EMAIL LOGS (simple display)
// ===========================================================
async function loadEmailAlertLogs() {
  if (!emailsContainer) return;
  emailsContainer.innerHTML = "Loading email alerts...";

  try {
    const res = await authFetch(`${API_BASE}/api/elite/replay?minutes=120`);
    if (!res.ok) throw new Error("emails failed");

    const rows = await res.json();
    emailsContainer.innerHTML = "<h3>📩 Email Alerts</h3>";

    const unknowns = rows.filter((r) => r.type === "unknown");
    if (!unknowns.length) {
      emailsContainer.innerHTML += "<p>No email alerts yet.</p>";
      return;
    }

    unknowns.forEach((r) => {
      const p = document.createElement("p");
      p.textContent = `${new Date(r.timestamp).toLocaleString()} — Email sent`;
      emailsContainer.appendChild(p);
    });
  } catch {
    emailsContainer.innerHTML = "⚠️ Email logs unavailable";
  }
}

// ===========================================================
// BUTTONS
// ===========================================================
if (upgradeBtn) {
  upgradeBtn.onclick = () => (window.location.href = "plans.html");
}

if (logoutBtn2) {
  logoutBtn2.onclick = () => {
    localStorage.removeItem("spotalert_user");
    localStorage.removeItem("token");
    localStorage.removeItem("admin_token");
    window.location.href = "login.html";
  };
}

// ===========================================================
// BACKEND CHECK
// ===========================================================
async function checkBackend() {
  try {
    await fetch(`${API_BASE}/api/status`, { cache: "no-store" });
    console.log("✅ Backend OK");
  } catch {
    console.log("⚠️ Backend unreachable");
  }
}
