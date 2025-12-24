// =====================================================
// SpotAlert Frontend Script (FINAL CLEAN VERSION)
// =====================================================

// ================= HEADER HEIGHT =================
const HEADER_HEIGHT = 72; // must match CSS --header-height

// =====================================================
// === Smooth Scroll for Internal Navigation (FIXED) ===
// =====================================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    const targetId = anchor.getAttribute('href');
    const target = document.querySelector(targetId);
    if (!target) return;

    e.preventDefault();

    const y =
      target.getBoundingClientRect().top +
      window.pageYOffset -
      HEADER_HEIGHT -
      10; // small breathing space

    window.scrollTo({
      top: y,
      behavior: 'smooth'
    });
  });
});

// =====================================================
// === Frosted Header Shrink Effect (SAFE & CLEAN) ===
// =====================================================
const header = document.querySelector('.frosted-header');
if (header) {
  window.addEventListener('scroll', () => {
    header.classList.toggle('shrink', window.scrollY > 60);
  });
}

// =====================================================
// 🔗 LIVE BACKEND CONNECTION (FINAL – HTTPS API DOMAIN)
// =====================================================
const API_BASE_URL = "https://api.spotalert.live";

// 🔍 Backend health check (console only – safe for prod)
async function checkBackendStatus() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/status`, {
      cache: "no-store"
    });
    if (!res.ok) throw new Error("Backend not responding");
    const json = await res.json();
    console.log("✅ Backend connected:", json);
  } catch (err) {
    console.error("❌ Backend offline:", err.message);
  }
}

// Optional – can be removed later without breaking anything
checkBackendStatus();
