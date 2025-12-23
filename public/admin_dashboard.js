// admin_dashboard.js
// Admin dashboard core logic

const API_BASE = "https://api.spotalert.live";
const token = localStorage.getItem("admin_token");

// 🚫 Block access if not logged in
if (!token) {
  window.location.href = "admin_login.html";
}

// ==========================
// AUTH HEADER
// ==========================
function adminHeaders() {
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  };
}

// ==========================
// LOAD USERS
// ==========================
async function loadUsers() {
  try {
    const res = await fetch(`${API_BASE}/api/admin/users`, {
      headers: adminHeaders()
    });

    if (!res.ok) throw new Error("Failed to load users");

    const data = await res.json();
    const table = document.getElementById("adminUsersTable");
    if (!table) return;

    table.innerHTML = "";

    data.users.forEach((u) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${u.name}</td>
        <td>${u.email}</td>
        <td>${u.plan}</td>
        <td>${u.email_verified ? "Yes" : "No"}</td>
        <td>${u.disabled ? "Disabled" : "Active"}</td>
      `;
      table.appendChild(tr);
    });
  } catch (err) {
    console.error("Load users error:", err);
  }
}

// ==========================
// LOAD ANALYTICS
// ==========================
async function loadAnalytics() {
  try {
    const res = await fetch(`${API_BASE}/api/admin/analytics`, {
      headers: adminHeaders()
    });

    if (!res.ok) throw new Error("Failed analytics");

    const data = await res.json();

    document.getElementById("totalUsers").textContent = data.total_users || 0;
    document.getElementById("totalAlerts").textContent = data.total_alerts || 0;
    document.getElementById("totalRevenue").textContent =
      `$${Number(data.revenue || 0).toFixed(2)}`;
  } catch (err) {
    console.error("Analytics error:", err);
  }
}

// ==========================
// LOGOUT
// ==========================
function adminLogout() {
  localStorage.removeItem("admin_token");
  window.location.href = "admin_login.html";
}

// ==========================
// INIT
// ==========================
document.addEventListener("DOMContentLoaded", () => {
  loadUsers();
  loadAnalytics();

  const logoutBtn = document.getElementById("adminLogout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", adminLogout);
  }
});
