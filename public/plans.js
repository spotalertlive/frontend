// =======================================================
// SpotAlert Plans Logic – FINAL (CONNECTED)
// =======================================================

const API_BASE = "https://api.spotalert.live";

// Stripe links (keep yours)
const STRIPE_LINK_STANDARD = "https://buy.stripe.com/8x2eVd27naqS6vs0OLaVa02";
const STRIPE_LINK_PREMIUM  = "https://buy.stripe.com/8x2eVd27naqS6vs0OLaVa02";
const STRIPE_LINK_ELITE    = "#"; // Coming soon

// Logged-in user
let user = {};
try {
  user = JSON.parse(localStorage.getItem("spotalert_user") || "{}");
} catch {}

if (!user.email) {
  alert("Please login first.");
  window.location.href = "login.html";
}

// =======================================================
// LOAD PLANS FROM BACKEND (REAL DATA)
// =======================================================
async function loadPlans() {
  try {
    const res = await fetch(`${API_BASE}/api/plans`);
    const plans = await res.json();

    plans.forEach(p => {
      const el = document.getElementById(`plan-${p.name.toLowerCase()}`);
      if (el) {
        el.querySelector(".price").textContent =
          p.price === 0 ? "Free" : `$${p.price}/mo`;
        el.querySelector(".limits").textContent =
          `${p.cameras} cameras · ${p.scan_limit} scans`;
      }
    });
  } catch {
    console.warn("Plans backend unavailable");
  }
}

// =======================================================
// PLAN SELECTION
// =======================================================
function choosePlan(plan) {
  if (plan === "Elite") {
    alert("Elite plan is coming soon. Features already visible.");
    return;
  }

  // Save selected plan locally (pre-confirm)
  localStorage.setItem(
    "pending_plan",
    JSON.stringify({ plan, email: user.email })
  );

  if (plan === "Standard") window.location.href = STRIPE_LINK_STANDARD;
  if (plan === "Premium") window.location.href = STRIPE_LINK_PREMIUM;
}

// =======================================================
// CONFIRM PLAN AFTER STRIPE (CALL FROM thank-you page)
// =======================================================
async function confirmPlan(plan) {
  try {
    const res = await fetch(`${API_BASE}/api/admin/confirm-plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: user.email,
        plan
      })
    });

    if (!res.ok) throw new Error();

    // Update local user
    user.plan = plan;
    localStorage.setItem("spotalert_user", JSON
