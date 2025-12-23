// public/alerts.js
// ===========================================================
// SpotAlert – Alerts Page (FINAL PRODUCTION VERSION)
// ===========================================================

const API_BASE = "https://api.spotalert.live";
const container = document.getElementById("alertsContainer");
const token = localStorage.getItem("token");

let user = {};
try {
  user = JSON.parse(localStorage.getItem("spotalert_user") || "{}");
} catch {}

// ===========================================================
// AUTH CHECK (ALIGNED WITH DASHBOARD & CAMERA)
// ===========================================================
if (!token || !user.email) {
  localStorage.clear();
  window.location.href = "login.html";
}

// ===========================================================
// LOAD ALERTS (UNKNOWN ONLY) ✅ FIXED
// ===========================================================
async function loadAlerts() {
  container.innerHTML = "Loading alerts...";

  try {
    const res = await fetch(
      `${API_BASE}/api/alerts/list?type=unknown`,
      {
        headers: {
          Authorization: "Bearer " + token
        }
      }
    );

    if (!res.ok) throw new Error("Failed to load alerts");

    const alerts = await res.json();

    if (!alerts.length) {
      container.innerHTML = "No unknown alerts.";
      return;
    }

    container.innerHTML = "";

    alerts.forEach(a => {
      const div = document.createElement("div");
      div.className = "alert-card";

      div.innerHTML = `
        <strong>Type:</strong> ${a.type.toUpperCase()}<br>
        <strong>Time:</strong> ${new Date(a.timestamp).toLocaleString()}<br>
        ${
          a.image_url
            ? `<img src="${a.image_url}" style="width:100%;max-width:280px;border-radius:10px;margin-top:8px;">`
            : ""
        }
        <button class="delete-btn" onclick="deleteAlert(${a.id})">
          Delete Alert
        </button>
      `;

      container.appendChild(div);
    });

  } catch (err) {
    console.error("Alert load error:", err);
    container.innerHTML = "⚠️ Failed to load alerts";
  }
}

// ===========================================================
// DELETE ALERT
// ===========================================================
async function deleteAlert(id) {
  if (!confirm("Delete this alert permanently?")) return;

  try {
    const res = await fetch(`${API_BASE}/api/alerts/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: "Bearer " + token
      }
    });

    if (!res.ok) throw new Error("Delete failed");

    loadAlerts();
  } catch (err) {
    console.error("Delete alert error:", err);
    alert("Failed to delete alert");
  }
}

// ===========================================================
// INIT
// ===========================================================
loadAlerts();
