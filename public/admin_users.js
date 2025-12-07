const API = "https://api.spotalert.live";
const token = localStorage.getItem("admin_token") || localStorage.getItem("token");

if (!token) window.location.href = "admin_login.html";

function authHeaders() {
  return { "Authorization": "Bearer " + token, "Content-Type": "application/json" };
}

async function loadUsers() {
  try {
    const res = await fetch(`${API}/api/admin/users`, {
      headers: authHeaders()
    });

    const users = await res.json();
    const table = document.getElementById("usersTable");

    users.forEach(u => {
      const tr = table.insertRow();
      tr.insertCell(0).innerText = u.name;
      tr.insertCell(1).innerText = u.email;
      tr.insertCell(2).innerText = u.plan;
      tr.insertCell(3).innerText = u.cameras || 0;
      tr.insertCell(4).innerText = new Date(u.created_at).toLocaleString();

      const actions = tr.insertCell(5);

      actions.innerHTML = `
        <button class="action-btn upgrade" onclick="upgradePlan('${u.email}')">Upgrade</button>
        <button class="action-btn suspend" onclick="suspendUser('${u.email}')">Suspend</button>
      `;
    });

  } catch (err) {
    console.error("User load error:", err);
  }
}

async function upgradePlan(email) {
  await fetch(`${API}/api/admin/upgrade`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ email })
  });
  alert("User upgraded.");
  location.reload();
}

async function suspendUser(email) {
  await fetch(`${API}/api/admin/suspend`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ email })
  });
  alert("User suspended.");
  location.reload();
}

loadUsers();
