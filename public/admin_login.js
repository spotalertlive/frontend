// admin_login.js
// Handles admin authentication

const API_BASE = "https://api.spotalert.live";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("adminLoginForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username")?.value?.trim();
    const password = document.getElementById("password")?.value;

    if (!username || !password) {
      alert("Missing admin credentials");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (!res.ok || !data.token) {
        alert(data.error || "Admin login failed");
        return;
      }

      // store admin token
      localStorage.setItem("admin_token", data.token);

      // redirect
      window.location.href = "admin_dashboard.html";
    } catch (err) {
      console.error("Admin login error:", err);
      alert("Server error. Try again.");
    }
  });
});
