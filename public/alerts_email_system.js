// ===============================================================
// SpotAlert – Email Alert System
// FINAL PRODUCTION VERSION (LOCKED)
// Backend: POST https://api.spotalert.live/api/alert-email
// ===============================================================

const API_BASE = "https://api.spotalert.live";

// ===============================================================
// 🚨 SEND ALERT EMAIL
// ===============================================================
async function sendEmailAlert(userEmail, imageURL, cameraName) {
  if (!userEmail) {
    console.error("❌ Email alert aborted: missing user email");
    return false;
  }

  try {
    const response = await fetch(`${API_BASE}/api/alert-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      },
      body: JSON.stringify({
        to: userEmail,
        subject: `SpotAlert – Unknown Person Detected (${cameraName})`,
        message: `
🚨 SpotAlert Security Alert

An unknown person was detected.

Camera: ${cameraName}
Time: ${new Date().toLocaleString()}

Snapshot:
${imageURL}

Review alert:
https://spotalert.live/dashboard.html

— SpotAlert AI Security
        `
      })
    });

    if (!response.ok) {
      console.error("❌ Email alert failed");
      return false;
    }

    console.log("✅ Email alert sent");
    return true;

  } catch (err) {
    console.error("❌ Email system error:", err);
    return false;
  }
}
