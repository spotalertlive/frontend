// =======================================================
// SpotAlert Email Verification Script (FINAL – LOCKED)
// File: frontend/public/verify_email.js
// =======================================================

const API_BASE = "https://api.spotalert.live";

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  const title = document.getElementById("title");
  const message = document.getElementById("message");
  const icon = document.getElementById("statusIcon");
  const primaryBtn = document.getElementById("primaryBtn");
  const secondaryBtn = document.getElementById("secondaryBtn");

  // Safety check – missing token
  if (!token) {
    showError("Invalid verification link.");
    return;
  }

  try {
    const res = await fetch(
      `${API_BASE}/api/auth/verify?token=${encodeURIComponent(token)}`,
      { cache: "no-store" } // prevent cached responses
    );

    if (!res.ok) {
      throw new Error("Verification failed");
    }

    showSuccess();
  } catch (err) {
    showError("This verification link is expired or already used.");
  }

  // -----------------------------
  // UI STATES
  // -----------------------------
  function showSuccess() {
    icon.textContent = "✅";
    title.textContent = "Email Verified";
    message.innerHTML =
      "Your SpotAlert account has been successfully verified.<br>" +
      "You can now access your dashboard and start protecting your property.";
    primaryBtn.style.display = "block";
    secondaryBtn.style.display = "block";
  }

  function showError(text) {
    icon.textContent = "❌";
    title.textContent = "Verification Failed";
    message.textContent = text;
    secondaryBtn.style.display = "block";
  }
});
