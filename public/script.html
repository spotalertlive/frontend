// =====================================================
// SpotAlert Frontend Script (FINAL – PRODUCTION LOCKED)
// =====================================================

// ================= HEADER HEIGHT =================
// Must match .frosted-header height in CSS
const HEADER_HEIGHT = 72;

// =====================================================
// Smooth Scroll for Internal Navigation (HEADER SAFE)
// =====================================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    const targetId = anchor.getAttribute('href');
    const target = document.querySelector(targetId);
    if (!target) return;

    e.preventDefault();

    const offsetTop =
      target.getBoundingClientRect().top +
      window.pageYOffset -
      HEADER_HEIGHT -
      10; // breathing space

    window.scrollTo({
      top: offsetTop,
      behavior: 'smooth'
    });
  });
});

// =====================================================
// Frosted Header Shrink Effect (SAFE & PERFORMANT)
// =====================================================
const header = document.querySelector('.frosted-header');

if (header) {
  window.addEventListener(
    'scroll',
    () => {
      header.classList.toggle('shrink', window.scrollY > 60);
    },
    { passive: true }
  );
}

// =====================================================
// 🔗 LIVE BACKEND CONNECTION (FINAL DOMAIN)
// =====================================================
const API_BASE_URL = "https://api.spotalert.live";

// =====================================================
// Backend Health Check (CONSOLE ONLY – PROD SAFE)
// =====================================================
async function checkBackendStatus() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/status`, {
      cache: "no-store"
    });

    if (!res.ok) throw new Error("Backend not responding");

    console.log("✅ SpotAlert API connected");
  } catch (err) {
    console.warn("⚠️ SpotAlert API unreachable");
  }
}

// Optional – safe to keep or remove later
checkBackendStatus();
