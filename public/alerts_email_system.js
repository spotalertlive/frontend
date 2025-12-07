// ===============================================================
// SpotAlert – Email Alert System (FINAL PRODUCTION VERSION)
// File: alerts_email_system.js
// Backend route used:  POST https://api.spotalert.live/alert-email
// ===============================================================

// 🔗 FINAL backend API base
const EMAIL_API_BASE = "https://api.spotalert.live";

// ===============================================================
// 🚨 Send Alert Email to User
//    - userEmail: recipient email (string)
//    - imageURL:  snapshot URL or S3 link (string, optional)
//    - cameraName: name/label of the camera (string, optional)
// ===============================================================
async function sendEmailAlert(userEmail, imageURL = "", cameraName = "Camera 1") {
  try {
    console.log("📨 Sending SpotAlert email to:", userEmail);

    const body = {
      to: userEmail,
      subject: `SpotAlert - Unknown Person Detected (${cameraName})`,
      message: `
An unknown person was detected by your camera: ${cameraName}.

Snapshot:
${imageURL || "No snapshot URL provided."}

Log in to your SpotAlert dashboard for full tracking history.
      `.trim()
    };

    const response = await fetch(`${EMAIL_API_BASE}/alert-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("❌ Email send failed:", errText);
      return false;
    }

    console.log("✅ Email sent successfully to", userEmail);
    return true;

  } catch (err) {
    console.error("❌ Critical email error:", err);
    return false;
  }
}

// ===============================================================
// (Optional) Fetch Email Logs — Only works if backend exposes:
//   GET https://api.spotalert.live/email-logs
// ===============================================================
async function fetchEmailLogs() {
  try {
    const response = await fetch(`${EMAIL_API_BASE}/email-logs`);
    if (!response.ok) {
      console.warn("⚠️ Email logs endpoint not available.");
      return [];
    }

    const logs = await response.json();
    console.table(logs);
    return logs;

  } catch (err) {
    console.error("❌ Failed to fetch email logs:", err);
    return [];
  }
}
