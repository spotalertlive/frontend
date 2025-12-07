// =====================================================
// SpotAlert Frontend Script (FINAL CLEAN VERSION)
// =====================================================

// === Smooth Scroll for Internal Navigation (e.g., #features) ===
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    const targetId = anchor.getAttribute('href');
    const target = document.querySelector(targetId);
    if (!target) return;

    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth' });
  });
});

// === Frosted Header Shrink Effect (shared across pages) ===
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

// 🔍 Backend health check (console only)
async function checkBackendStatus() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/status`);
    if (!res.ok) throw new Error("Backend not responding");
    const json = await res.json();
    console.log("✅ Backend connected:", json);
  } catch (err) {
    console.error("❌ Backend offline:", err.message);
  }
}

// Optional: run health check on load (can be removed if you don't want it)
checkBackendStatus();
