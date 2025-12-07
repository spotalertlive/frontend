// =====================================================
// SpotAlert Admin Analytics (FINAL PRODUCTION VERSION)
// File: admin_analytics.js
// Backend: https://api.spotalert.live
// =====================================================

const API = "https://api.spotalert.live";
const token = localStorage.getItem("token");

// Redirect if not logged in
if (!token) {
  alert("Unauthorized. Please login as admin.");
  window.location.href = "admin_login.html";
}

// HTML elements
const totalUsersEl = document.getElementById("totalUsers");
const totalAlertsEl = document.getElementById("totalAlerts");
const unknownCountEl = document.getElementById("unknownAlerts");
const knownCountEl = document.getElementById("knownAlerts");
const emailCountEl = document.getElementById("emailAlerts");
const smsCountEl = document.getElementById("smsAlerts");
const costEl = document.getElementById("systemCost");
const regionTable = document.getElementById("regionStats");

// ===============================================
// FETCH SUMMARY METRICS
// ===============================================
async function loadAnalytics() {
  try {
    const res = await fetch(`${API}/api/admin/analytics`, {
      headers: { Authorization: "Bearer " + token },
    });

    if (!res.ok) throw new Error("Failed to load analytics");

    const data = await res.json();

    totalUsersEl.textContent = data.total_users;
    totalAlertsEl.textContent = data.total_alerts;

    unknownCountEl.textContent = data.unknown_alerts;
    knownCountEl.textContent = data.known_alerts;

    emailCountEl.textContent = data.email_alerts;
    smsCountEl.textContent = data.sms_alerts;

    costEl.textContent = `$${data.total_cost.toFixed(4)}`;

    loadRegionStats(data.regions);

  } catch (e) {
    console.error("Analytics load failed:", e);
  }
}

// ===============================================
// REGION ANALYTICS TABLE (Visitors by Country/City)
// ===============================================
function loadRegionStats(regions) {
  if (!regions || regions.length === 0) {
    regionTable.innerHTML += `
      <tr><td colspan="3">No region data available.</td></tr>
    `;
    return;
  }

  regions.forEach(r => {
    regionTable.innerHTML += `
      <tr>
        <td>${r.country}</td>
        <td>${r.city}</td>
        <td>${r.visitors}</td>
      </tr>
    `;
  });
}

// Initialize
loadAnalytics();
