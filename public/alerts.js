// public/alerts.js

const API_BASE = "https://api.spotalert.live";
const container = document.getElementById("alertsContainer");
const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "login.html";
}

async function loadAlerts() {
  container.innerHTML = "Loading...";

  try {
    const res = await fetch(`${API_BASE}/api/alert-history`, {
      headers: {
        Authorization: "Bearer " + token
      }
    });

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
        <strong>Camera:</strong> ${a.camera_name || "Camera"}<br>
        <strong>Time:</strong> ${new Date(a.created_at).toLocaleString()}
        <img src="${a.image_path}">
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

async function deleteAlert(id) {
  if (!confirm("Delete this alert permanently?")) return;

  await fetch(`${API_BASE}/api/alert-history/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: "Bearer " + token
    }
  });

  loadAlerts();
}

loadAlerts();
