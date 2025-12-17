// =======================================================
// SpotAlert Plans Logic – FINAL (CONNECTED & LOGGED-IN)
// File: public/plans.js
// =======================================================

const API_BASE = "https://api.spotalert.live";

// -------------------------------------------------------
// STRIPE LINKS (USE YOUR REAL ONES)
// -------------------------------------------------------
const STRIPE_LINK_STANDARD = "https://buy.stripe.com/8x2eVd27naqS6vs0OLaVa02";
const STRIPE_LINK_PREMIUM  = "https://buy.stripe.com/8x2eVd27naqS6vs0OLaVa02";
const STRIPE_LINK_ELITE    = "#"; // Coming soon

// -------------------------------------------------------
// LOAD LOGGED-IN USER
// -------------------------------------------------------
let user = {};
try {
  user = JSON.parse(localStorage.getItem("spotalert_user") || "{}");
} catch {}

const token = localStorage.getItem("token");

// If user came here from dashboard, MUST be logged in
if (!token || !user.email) {
  alert("Please login to manage your subscription.");
  window.location.href = "login.html";
}

// -------------------------------------------------------
// SHOW CURRENT PLAN BANNER
// -------------------------------------------------------
const currentPlanBanner = document.getElementById("currentPlanBanner");
if (currentPlanBanner) {
  currentPlanBanner.textContent = `Your current plan: ${user.plan || "Free Trial"}`;
}

// -------------------------------------------------------
// LOAD PLANS FROM BACKEND (REAL DATA)
// -------------------------------------------------------
async function loadPlans() {
  try {
    const res = await fetch(`${API_BASE}/api/plans`);
    const plans = await res.json();

    plans.forEach(p => {
      const planId = `plan-${p.name.toLowerCase().replace(" ", "-")}`;
      const el = document.getElementById(planId);

      if (!el) return;

      // Price
      el.querySelector(".price").textContent =
        p.price === 0 ? "Free" : `$${p.price}/month`;

      // Limits
      el.querySelector(".limits").textContent =
        `${p.cameras} cameras · ${p.scan_limit} scans`;

      const btn = el.querySelector("button");

      // ---------------------------------------------------
      // CURRENT PLAN HANDLING
      // ---------------------------------------------------
      if ((user.plan || "").toLowerCase() === p.name.toLowerCase()) {
        btn.textContent = "Current Plan";
        btn.disabled = true;
        btn.classList.add("current-plan");
      } else {
        btn.textContent =
          isUpgrade(p.name) ? "Upgrade" : "Downgrade";
        btn.disabled = false;
        btn.onclick = () => choosePlan(p.name);
      }
    });
  } catch (err) {
    console.warn("⚠️ Failed to load plans from backend", err);
  }
}

// -------------------------------------------------------
// PLAN COMPARISON (UP / DOWN GRADE)
// -------------------------------------------------------
const planRank = {
  "Free Trial": 0,
  "Standard": 1,
  "Premium": 2,
  "Elite": 3
};

function isUpgrade(targetPlan) {
  return planRank[targetPlan] > planRank[user.plan || "Free Trial"];
}

// -------------------------------------------------------
// PLAN SELECTION
// -------------------------------------------------------
function choosePlan(plan) {
  if (plan === "Elite") {
    alert("Elite plan is coming soon.");
    return;
  }

  // Save intent (used after Stripe)
  localStorage.setItem(
    "pending_plan",
    JSON.stringify({
      plan,
      email: user.email
    })
  );

  if (plan === "Standard") window.location.href = STRIPE_LINK_STANDARD;
  if (plan === "Premium")  window.location.href = STRIPE_LINK_PREMIUM;
}

// -------------------------------------------------------
// CONFIRM PLAN (USED BY THANK-YOU PAGE / WEBHOOK)
// -------------------------------------------------------
async function confirmPlan(plan) {
  try {
    const res = await fetch(`${API_BASE}/api/admin/confirm-plan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token
      },
      body: JSON.stringify({
        email: user.email,
        plan
      })
    });

    if (!res.ok) throw new Error("Confirm failed");

    // Update local user
    user.plan = plan;
    localStorage.setItem("spotalert_user", JSON.stringify(user));

    alert("✅ Plan updated successfully");
    window.location.href = "dashboard.html";
  } catch (err) {
    alert("❌ Plan confirmation failed");
  }
}

// -------------------------------------------------------
// INIT
// -------------------------------------------------------
loadPlans();
