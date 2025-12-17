// ========================================================
// SpotAlert – Camera History (FINAL FIXED VERSION)
// File: public/camera_history.js
// ========================================================

const API = "https://api.spotalert.live/api";
const token = localStorage.getItem("token");
const userEmail = localStorage.getItem("user_email");

if (!token || !userEmail) {
  window.location.href = "login.html";
}

// ========================================================
// LOAD CAMERA ALERT HISTORY
// ========================================================
async function loadHistory() {
  const table = document.getElementById("historyTable");

  try {
    const res = await fetch(
      `${API}/alerts/list?type=camera&email=${encodeURIComponent(userEmail)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

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
        new Date(r.timestamp).toLocaleString();

      // Type
      tr.insertCell(1).innerText =
        r.type || "camera";

      // Image preview
      tr.insertCell(2).innerHTML = r.image
        ? `<img src="${r.image}" width="90" style="border-radius:6px;">`
        : `<span style="color:#999">No image</span>`;

      // Replay link
      tr.insertCell(3).innerHTML = r.image
        ? `<a href="replay_viewer.html?key=${encodeURIComponent(r.image)}">View</a>`
        : "-";
    });

  } catch (err) {
    console.error("❌ Failed to load camera history:", err);
    alert("Failed to load camera history");
  }
}

loadHistory();
