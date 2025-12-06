cat << 'EOF' | sudo tee /var/www/html/dashboard.js > /dev/null
// ===========================================================
// SpotAlert Dashboard – FRONTEND (UPGRADED VERSION)
// ===========================================================

// 🔹 API Base – Use your LIVE backend
const API_BASE = "https://api.spotalert.live";

// 🔹 Elements
const faceUploadForm = document.getElementById("faceUploadForm");
const faceImage = document.getElementById("faceImage");
const faceLabel = document.getElementById("faceLabel");
const faceList = document.getElementById("faceList");
const alertList = document.getElementById("alertList");
const currentPlanDisplay = document.getElementById("currentPlan");
const upgradeBtn = document.getElementById("upgradeBtn");
const logoutBtn = document.getElementById("logoutBtn");
const uploadForm = document.getElementById("uploadForm");
const cameraFile = document.getElementById("cameraFile");
const resultDiv = document.getElementById("result");

// 🔹 Containers
const usageContainer = document.createElement("div");
const replayContainer = document.createElement("div");
const emailsContainer = document.createElement("div");
usageContainer.id = "usageContainer";
replayContainer.id = "replayContainer";
emailsContainer.id = "emailsContainer";

document.addEventListener("DOMContentLoaded", () => {
  const dash = document.querySelector(".dashboard-container");
  if (dash) dash.append(usageContainer, replayContainer, emailsContainer);
});

// 🔹 User + Plan
let storedUser = {};
try { storedUser = JSON.parse(localStorage.getItem("spotalert_user") || "{}"); } catch (e) {}
let USER_EMAIL = storedUser.email || "admin@spotalert.live";
let USER_PLAN = storedUser.plan || "Free Trial";
let currentPlan = storedUser.planLabel || "Free Trial – 2 Cameras, Email Alerts Only";

// 🔹 Data
let knownFaces = [];  // [{ name: "John", images: [...] }]
let alerts = [];
const MAX_PEOPLE = 50;
const MAX_IMAGES_PER_PERSON = 5;

// ===========================================================
// INIT DASHBOARD
// ===========================================================
document.addEventListener("DOMContentLoaded", () => {
  if (currentPlanDisplay) currentPlanDisplay.textContent = currentPlan;
  if (upgradeBtn) upgradeBtn.textContent = "Upgrade";

  renderFaces();
  renderAlerts();
  checkBackend();
  refreshUsage();

  if (USER_PLAN === "Elite") loadReplay();
  loadEmailAlertLogs();

  console.log("✅ SpotAlert Dashboard Ready");
});

// ===========================================================
// FACE UPLOAD (5 images/person, 50 people)
// ===========================================================
function addFaceImage(label, dataUrl) {
  const cleanLabel = label.trim();
  if (!cleanLabel) return;

  let person = knownFaces.find((p) => p.name.toLowerCase() === cleanLabel.toLowerCase());
  if (!person) {
    if (knownFaces.length >= MAX_PEOPLE) return alert(`Max ${MAX_PEOPLE} people reached.`);
    person = { name: cleanLabel, images: [] };
    knownFaces.push(person);
  }

  if (person.images.length >= MAX_IMAGES_PER_PERSON)
    return alert(`${person.name} already has ${MAX_IMAGES_PER_PERSON} photos.`);

  person.images.push(dataUrl);
  renderFaces();
}

if (faceUploadForm) {
  faceUploadForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const label = faceLabel.value.trim();
    const file = faceImage.files[0];
    if (!file || !label) return alert("Please select an image and enter name.");

    const reader = new FileReader();
    reader.onload = () => {
      addFaceImage(label, reader.result);
      faceLabel.value = "";
      faceImage.value = "";
    };
    reader.readAsDataURL(file);
  });
}

// ===========================================================
// CAMERA UPLOAD → BACKEND
// ===========================================================
if (uploadForm) {
  uploadForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const file = cameraFile.files[0];
    if (!file) return alert("Please select an image first.");

    resultDiv.innerHTML = "⏳ Uploading & analyzing...";

    try {
      const fd = new FormData();
      fd.append("image", file);
      fd.append("email", USER_EMAIL);
      fd.append("plan", USER_PLAN);

      const res = await fetch(`${API_BASE}/api/trigger-alert`, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed.");

      const ts = new Date().toLocaleString();
      const alertMsg = data.faces?.length
        ? `✅ ${data.faces.length} known face(s) detected`
        : "🚨 Unknown person detected";

      alerts.unshift({ time: ts, message: alertMsg });
      renderAlerts();

      resultDiv.innerHTML = `<b>Result:</b> ${alertMsg}`;
      await refreshUsage();
      if (USER_PLAN === "Elite") loadReplay();

    } catch (err) {
      console.error(err);
      resultDiv.innerHTML = "⚠️ Connection error";
    }
  });
}

// ===========================================================
// ALERT LIST
// ===========================================================
function renderAlerts() {
  if (!alertList) return;
  alertList.innerHTML = "";
  alerts.slice(0, 10).forEach((a) => {
    const li = document.createElement("li");
    li.textContent = `${a.time} — ${a.message}`;
    alertList.appendChild(li);
  });
}

// ===========================================================
// FACE LIST
// ===========================================================
function renderFaces() {
  if (!faceList) return;
  faceList.innerHTML = "";

  knownFaces.forEach((p, index) => {
    const div = document.createElement("div");
    div.className = "face-item";

    const thumbs = p.images
      .map((img, i) => `<img src="${img}" class="face-thumb" alt="${p.name} ${i + 1}">`)
      .join("");

    div.innerHTML = `
      <h4>${p.name} (${p.images.length}/5)</h4>
      <div class="face-thumbs">${thumbs}</div>
      <button class="btn-danger" onclick="deletePerson(${index})">Remove Person</button>
    `;

    faceList.appendChild(div);
  });
}

function deletePerson(i) {
  knownFaces.splice(i, 1);
  renderFaces();
}

// ===========================================================
// UPGRADE + LOGOUT
// ===========================================================
if (upgradeBtn) {
  upgradeBtn.addEventListener("click", () => {
    window.location.href = "plans.html";  // send to your plans page instead of Elite Stripe
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("spotalert_user");
    window.location.href = "login.html";
  });
}

// ===========================================================
// BACKEND STATUS
// ===========================================================
async function checkBackend() {
  try {
    const res = await fetch(`${API_BASE}/api/status`);
    console.log(res.ok ? "🌐 Backend OK" : "⚠️ Backend down");
  } catch {
    console.log("⚠️ Cannot connect to backend");
  }
}

// ===========================================================
// USAGE SUMMARY (BACKEND)
// ===========================================================
async function refreshUsage() {
  usageContainer.innerHTML = "<h3>📊 Usage Summary</h3><p>Loading...</p>";

  try {
    const res = await fetch(`${API_BASE}/api/usage-summary?email=${USER_EMAIL}`);
    const json = await res.json();

    let html = `
      <h3>📊 Monthly Usage — ${json.month}</h3>
      <p><strong>Total Cost:</strong> $${json.total_cost_usd}</p>
      <table style="width:100%;margin-top:10px;border-collapse:collapse;">
        <tr style="background:#eef7ff;">
          <th>Channel</th><th>Count</th><th>Cost</th>
        </tr>
    `;

    (json.details || []).forEach((r) => {
      html += `
        <tr>
          <td>${r.channel}</td>
          <td>${r.count}</td>
          <td>$${Number(r.total).toFixed(3)}</td>
        </tr>`;
    });

    html += "</table>";
    usageContainer.innerHTML = html;

  } catch (err) {
    usageContainer.innerHTML = `<p style="color:red;">⚠️ ${err.message}</p>`;
  }
}

// ===========================================================
// ELITE REPLAY
// ===========================================================
async function loadReplay() {
  if (USER_PLAN !== "Elite") return;

  replayContainer.innerHTML = "<h3>🎥 Recent Alerts</h3><p>Loading...</p>";

  try {
    const res = await fetch(`${API_BASE}/api/elite/replay?minutes=10`);
    const rows = await res.json();

    if (!rows.length) return (replayContainer.innerHTML = "No recent alerts.");

    let html = `<h3>🎥 Recent Alerts</h3><div style="display:flex;gap:15px;flex-wrap:wrap;">`;

    for (const r of rows) {
      const imgRes = await fetch(`${API_BASE}/api/elite/frame-url?key=${r.image}`);
      const { url } = await imgRes.json();

      html += `
        <div style="background:#fff;padding:10px;border-radius:10px;width:220px;">
          <img src="${url}" style="width:100%;border-radius:8px;">
          <p><strong>${r.type}</strong><br>${new Date(r.timestamp).toLocaleString()}</p>
        </div>`;
    }

    html += "</div>";
    replayContainer.innerHTML = html;

  } catch (err) {
    replayContainer.innerHTML = `<p style="color:red;">⚠️ ${err.message}</p>`;
  }
}

// ===========================================================
// EMAIL ALERT LOGS
// ===========================================================
async function loadEmailAlertLogs() {
  emailsContainer.innerHTML = "<h3>📩 Email Alerts</h3><p>Loading...</p>";

  try {
    const res = await fetch(`${API_BASE}/api/elite/replay?minutes=60`);
    const rows = await res.json();

    if (!rows.length) return (emailsContainer.innerHTML = "No email alerts.");

    let html = `
      <h3>📩 Email Alert Notifications</h3>
      <table style="width:100%;margin-top:10px;border-collapse:collapse;">
        <tr>
          <th>Time</th><th>Camera</th><th>Type</th><th>Snapshot</th><th>Status</th>
        </tr>
    `;

    rows.forEach((row) => {
      html += `
        <tr>
          <td>${new Date(row.timestamp).toLocaleString()}</td>
          <td>${row.camera || "Camera 1"}</td>
          <td>${row.type === "unknown" ? "Unknown Face" : "Known Face"}</td>
          <td><img src="cctv_background.png" style="width:60px;border-radius:6px;"></td>
          <td>${row.type === "unknown" ? "Email Sent" : "Info"}</td>
        </tr>`;
    });

    html += "</table>";
    emailsContainer.innerHTML = html;

  } catch (err) {
    emailsContainer.innerHTML = "⚠️ Error loading email logs";
  }
}
EOF
