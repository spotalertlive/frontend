// ===============================================================
// SpotAlert – Email Alert System (FINAL PRODUCTION VERSION)
// Connected to backend route: POST https://api.spotalert.live/alert-email
// ===============================================================

const API_BASE = "https://api.spotalert.live";

// ===============================================================
// 🚨 Send Alert Email
// ===============================================================

async function sendEmailAlert(userEmail, imageURL, cameraName) {
  if (!userEmail) {
    console.error("❌ No email provided for email alert");
    return false;
  }

  try {
    console.log("📨 Sending alert email to:", userEmail);

    const response = await fetch(`${API_BASE}/alert-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: userEmail,
        subject: `SpotAlert – Unknown Person Detected (${cameraName})`,
        message: `
🚨 SpotAlert Security Alert

An unknown person was detected on your camera:

Camera: ${cameraName}
Time: ${new Date().toLocaleString()}

Snapshot:
${imageURL}

Login to your dashboard to review:
https://spotalert.live/dashboard.html

Stay safe,
SpotAlert AI Security
        `
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("❌ Email sending failed:", err);
      return false;
    }

    console.log("✅ Email sent successfully");
    return true;

  } catch (err) {
    console.error("❌ Email system error:", err);
    return false;
  }
}

// ===============================================================
// OPTIONAL — Fetch Email Logs (backend must support it)
// ===============================================================

async function fetchEmailLogs() {
  try {
    const res = await fetch(`${API_BASE}/email-logs`);
    if (!res.ok) return [];

    const logs = await res.json();
    console.table(logs);
    return logs;

  } catch (err) {
    console.error("❌ Could not fetch logs:", err);
    return [];
  }
}
