// =======================================================
// SpotAlert – Usage Summary Script (FINAL LOCKED VERSION)
// File: frontend/public/usage.js
// =======================================================

const API_BASE = "https://api.spotalert.live";

async function loadUsage() {
  const token = localStorage.getItem("token");
  if (!token) return;

  const container = document.getElementById("usageContainer");
  if (!container) return;

  container.innerHTML = "Loading usage…";

  try {
    const res = await fetch(`${API_BASE}/api/usage-summary`, {
      headers: {
        Authorization: "Bearer " + token
      },
      cache: "no-store"
    });

    const u = await res.json();
    if (!res.ok) throw new Error(u.error || "Failed");

    container.innerHTML = `
      <h3>📊 Usage – ${u.month || "-"}</h3>
      <p><strong>Plan:</strong> ${u.plan || "-"}</p>
      <p><strong>Scans Used:</strong> ${u.scans_used ?? 0} / ${u.scans_limit ?? "∞"}</p>
      <p><strong>Remaining:</strong> ${u.scans_remaining ?? "∞"}</p>
      <p><strong>Total Cost:</strong> $${u.total_cost_usd ?? "0.00"}</p>
    `;

  } catch (err) {
    console.warn("Usage load failed:", err);
    container.innerHTML = "⚠️ Unable to load usage";
  }
}

// Run automatically after page loads
document.addEventListener("DOMContentLoaded", loadUsage);
