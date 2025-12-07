const STRIPE_LINK_STANDARD = "https://buy.stripe.com/8x2eVd27naqS6vs0OLaVa02"; 
const STRIPE_LINK_PREMIUM  = "https://buy.stripe.com/8x2eVd27naqS6vs0OLaVa02";
const STRIPE_LINK_ELITE    = "#"; // Coming soon

function choosePlan(plan) {
  if (plan === "Standard") window.location.href = STRIPE_LINK_STANDARD;
  if (plan === "Premium") window.location.href = STRIPE_LINK_PREMIUM;

  if (plan === "Elite") {
    alert("Elite plan is coming soon. All features already visible.");
  }
}
