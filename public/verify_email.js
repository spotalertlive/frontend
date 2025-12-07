const API = "https://api.spotalert.live/api";

async function verifyEmail() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  if (!token) {
    alert("Invalid verification link.");
    return;
  }

  const res = await fetch(`${API}/verify-email?token=${token}`);

  if (res.ok) {
    document.getElementById("status").innerText = "Email verified!";
  } else {
    document.getElementById("status").innerText = "Verification failed.";
  }
}

verifyEmail();
