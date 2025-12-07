// ========================================================
// SpotAlert Live – Camera Connector + AWS Detector
// FINAL PRODUCTION VERSION (Dec 2025)
// File: public/camera_connector.js
// Backend route: POST https://api.spotalert.live/api/trigger-alert
// ========================================================

// 🔗 Final backend base
const API_BASE = "https://api.spotalert.live/api";

// 🎥 DOM Elements
const video = document.getElementById("liveFeed");
const connectBtn = document.getElementById("connectCameraBtn");
const stopBtn = document.getElementById("stopCameraBtn");
const cameraUrlInput = document.getElementById("cameraUrl");

let captureInterval = null;
let stream = null;

// ========================================================
// 1️⃣ GET LOGGED-IN USER INFO
// ========================================================
function getCurrentUser() {
  try {
    const email = localStorage.getItem("user_email");
    const plan = localStorage.getItem("selectedPlan") || "Free Trial";

    if (!email) return null;

    return { email, plan };
  } catch (err) {
    console.error("User load error:", err);
    return null;
  }
}

// ========================================================
// 2️⃣ CONNECT TO CAMERA
// ========================================================
async function connectCamera() {
  const user = getCurrentUser();
  if (!user) {
    alert("Please login first before using live camera detection.");
    window.location.href = "login.html";
    return;
  }

  const cameraUrl = cameraUrlInput?.value?.trim();

  if (cameraUrl) {
    alert("📡 External CCTV URL integration coming soon. Using device camera now.");
  }

  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true });

    video.srcObject = stream;
    await video.play();

    console.log("🎥 Camera connected successfully");

    startAutoCapture();
  } catch (err) {
    console.error("Camera access error:", err);
    alert("⚠️ Unable to access camera. Make sure permission is granted.");
  }
}

if (connectBtn) connectBtn.addEventListener("click", connectCamera);

// ========================================================
// 3️⃣ AUTO CAPTURE & SEND FRAME TO BACKEND
// ========================================================
function startAutoCapture() {
  if (captureInterval) clearInterval(captureInterval);

  const user = getCurrentUser();
  if (!user) return;

  captureInterval = setInterval(async () => {
    try {
      if (!video.videoWidth || !video.videoHeight) return;

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/jpeg")
      );

      if (!blob) return;

      const formData = new FormData();
      formData.append("image", blob, `frame_${Date.now()}.jpg`);
      formData.append("email", user.email);
      formData.append("plan", user.plan);

      const res = await fetch(`${API_BASE}/trigger-alert`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        console.log(
          `📡 Frame sent → ${data.faces?.length || 0} face(s) detected`
        );
      } else {
        console.error("❌ Detection error:", data.error);
      }
    } catch (err) {
      console.error("⚠️ Auto-capture error:", err);
    }
  }, 10000); // Capture every 10 seconds
}

// ========================================================
// 4️⃣ DISCONNECT CAMERA
// ========================================================
function stopCamera() {
  if (captureInterval) {
    clearInterval(captureInterval);
    captureInterval = null;
  }

  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
    stream = null;
    console.log("🛑 Camera stopped");
  }

  if (video) video.srcObject = null;
}

if (stopBtn) stopBtn.addEventListener("click", stopCamera);
