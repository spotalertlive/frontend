// ========================================================
// SpotAlert Live – Camera Connector + AWS Detector
// FINAL PRODUCTION VERSION (ALIGNED WITH BACKEND)
// ========================================================

const API_BASE = "https://api.spotalert.live";

// 🎥 DOM Elements
const video = document.getElementById("liveFeed");
const connectBtn = document.getElementById("connectCameraBtn");
const stopBtn = document.getElementById("stopCameraBtn");
const cameraUrlInput = document.getElementById("cameraUrl");

// 🔐 AUTH
const token = localStorage.getItem("token");
let user = {};
try {
  user = JSON.parse(localStorage.getItem("spotalert_user") || "{}");
} catch {}

if (!token || !user.email) {
  alert("Please login first.");
  window.location.href = "login.html";
}

// Camera state
let captureInterval = null;
let stream = null;
let cameraId = null; // ✅ STORE CAMERA ID

// ========================================================
// 1️⃣ CONNECT CAMERA
// ========================================================
async function connectCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    await video.play();

    console.log("🎥 Camera connected");

    // ✅ REGISTER CAMERA
    const regRes = await fetch(`${API_BASE}/api/camera/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token
      },
      body: JSON.stringify({
        name: "Browser Camera",
        ip: "local-device",
        email: user.email
      })
    });

    const regData = await regRes.json();

    if (!regRes.ok || !regData.camera_id) {
      throw new Error("Camera registration failed");
    }

    cameraId = regData.camera_id; // ✅ SAVE CAMERA ID
    console.log("📌 Camera registered:", cameraId);

    startAutoCapture();

  } catch (err) {
    console.error("Camera error:", err);
    alert("Camera access failed. Check permissions.");
  }
}

if (connectBtn) connectBtn.addEventListener("click", connectCamera);

// ========================================================
// 2️⃣ AUTO CAPTURE & SEND FRAME
// ========================================================
function startAutoCapture() {
  if (captureInterval) clearInterval(captureInterval);

  captureInterval = setInterval(async () => {
    try {
      if (!video.videoWidth || !video.videoHeight || !cameraId) return;

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise(resolve =>
        canvas.toBlob(resolve, "image/jpeg", 0.85)
      );
      if (!blob) return;

      const fd = new FormData();
      fd.append("image", blob);
      fd.append("email", user.email);
      fd.append("camera_id", cameraId); // ✅ CRITICAL
      fd.append("camera_name", "Browser Camera"); // ✅ CRITICAL

      const res = await fetch(`${API_BASE}/api/trigger-alert`, {
        method: "POST",
        headers: {
          Authorization: "Bearer " + token
        },
        body: fd
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Detection error:", data.error);
        return;
      }

      console.log(
        `📡 Frame sent → ${data.faces?.length || 0} face(s)`
      );

    } catch (err) {
      console.error("Auto-capture error:", err);
    }
  }, 10000);
}

// ========================================================
// 3️⃣ STOP CAMERA
// ========================================================
function stopCamera() {
  if (captureInterval) {
    clearInterval(captureInterval);
    captureInterval = null;
  }

  if (stream) {
    stream.getTracks().forEach(t => t.stop());
    stream = null;
  }

  video.srcObject = null;
  console.log("🛑 Camera stopped");
}

if (stopBtn) stopBtn.addEventListener("click", stopCamera);
