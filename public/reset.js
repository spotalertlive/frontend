const API = "https://api.spotalert.live"; 

document.getElementById("resetForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("resetEmail").value.trim();
  const msg = document.getElementById("resetMessage");

  msg.textContent = "Sending reset link...";

  try {
    const res = await fetch(`${API}/auth/reset-request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    const data = await res.json();

    if (!res.ok) {
      msg.style.color = "red";
      msg.textContent = data.message || "Something went wrong.";
      return;
    }

    msg.style.color = "green";
    msg.textContent = "Reset link sent! Check your email.";

  } catch (err) {
    msg.style.color = "red";
    msg.textContent = "Network error.";
  }
});
