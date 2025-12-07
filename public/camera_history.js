const API = "https://api.spotalert.live/api";
const token = localStorage.getItem("token");

if (!token) window.location.href = "login.html";

async function loadHistory() {
  const table = document.getElementById("historyTable");

  const res = await fetch(`${API}/elite/replay?minutes=60`);
  const rows = await res.json();

  rows.forEach(r => {
    const tr = table.insertRow();
    tr.insertCell(0).innerText = new Date(r.timestamp).toLocaleString();
    tr.insertCell(1).innerText = r.type;

    tr.insertCell(2).innerHTML =
      `<img src="cctv_background.png" width="90" style="border-radius:6px;">`;

    tr.insertCell(3).innerHTML =
      `<a href="replay_viewer.html?key=${r.image}">View</a>`;
  });
}

loadHistory();
