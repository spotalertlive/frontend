// ========================================================
// SpotAlert – Camera History (FINAL CORRECTED VERSION)
// File: public/camera_history.js
// ========================================================

const API = "https://api.spotalert.live";
const token = localStorage.getItem("token");

let user = {};
try {
  user = JSON.parse(localStorage.getItem("spotalert_user") || "{}");
} catch {}

if (!token || !user.email) {
  localStorage.clear();
  window.location.href = "login.html";
}

// ========================================================
// LOAD CAMERA ALERT HISTORY (ALL CAMERA ALERTS)
// ========================================================
async function loadHistory() {
  const table = document.getElementById("historyTable");

  try {
    const res = await fetch(
      `${API}/api/alerts/list?type=all`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    if (!res.ok) throw new Error("Failed to load alerts");

    const rows = await res.json();

    if (!Array.isArray(rows) || rows.length === 0) {
      const tr = table.insertRow();
      tr.insertCell(0).innerText = "No history available";
      tr.insertCell(1).innerText = "-";
      tr.insertCell(2).innerText = "-";
      tr.insertCell(3).innerText = "-";
      return;
    }

    rows.forEach(r => {
      const tr = table.insertRow();

      // Time
      tr.insertCell(0).innerText =
        r.timestamp ? new Date(r.timestamp).toLocaleString() : "-";

      // Type
      tr.insertCell(1).innerText =
        r.type ? r.type.toUpperCase() : "-";

      // Image preview
      tr.insertCell(2).innerHTML = r.image_url
        ? `<img src="${r.image_url}" width="90" style="border-radius:6px;">`
        : `<span style="color:#999">No image</span>`;

      // Replay (secure image stream)
      tr.insertCell(3).innerHTML = r.image_url
        ? `<a href="${r.image_url}" target="_blank">View</a>`
        : "-";
    });

  } catch (err) {
    console.error("❌ Failed to load camera history:", err);
    alert("Failed to load camera history");
  }
}

loadHistory();
