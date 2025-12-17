// public/alerts.js
// ===========================================================
// SpotAlert – Alerts Page (FINAL PRODUCTION VERSION)
// ===========================================================

const API_BASE = "https://api.spotalert.live";
const container = document.getElementById("alertsContainer");
const token = localStorage.getItem("token");

// ===========================================================
// AUTH CHECK
// ===========================================================
if (!token) {
  window.location.href = "login.html";
}

// ===========================================================
// LOAD ALERTS (UNKNOWN ONLY)
// ===========================================================
async function loadAlerts() {
  container.innerHTML = "Loading alerts...";

  try {
    const res = await fetch(`${API_BASE}/api/alerts/list?type=unknown`, {
      headers: {
        Authorization: "Bearer " + token
      }
    });

    if (!res.ok) throw new Error();

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

  } catch {
    container.innerHTML = "⚠️ Failed to load alerts";
  }
}

// ===========================================================
// DELETE ALERT
// ===========================================================
async function deleteAlert(id) {
  if (!confirm("Delete this alert permanently?")) return;

  try {
    await fetch(`${API_BASE}/api/alerts/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: "Bearer " + token
      }
    });

    loadAlerts();
  } catch {
    alert("Failed to delete alert");
  }
}

// ===========================================================
// INIT
// ===========================================================
loadAlerts();
