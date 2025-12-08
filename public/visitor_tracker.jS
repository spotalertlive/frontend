// =======================================================
// SpotAlert Visitor Tracker (FULL PRO VERSION)
// File: public/visitor_tracker.js
// Backend endpoint used:
//   POST https://api.spotalert.live/api/visitors/track
// =======================================================

(function () {
  const API_BASE = "https://api.spotalert.live";

  // --- 1️⃣ Generate / reuse session id (for "active now") ---
  function getSessionId() {
    try {
      let sid = sessionStorage.getItem("spotalert_session_id");
      if (!sid) {
        sid = "sess_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
        sessionStorage.setItem("spotalert_session_id", sid);
      }
      return sid;
    } catch (e) {
      return "sess_" + Date.now();
    }
  }

  // --- 2️⃣ Device type from user-agent ---
  function getDeviceType(ua) {
    ua = ua.toLowerCase();
    if (/mobile|iphone|ipod|android.*mobile|opera mini/.test(ua)) return "Mobile";
    if (/ipad|tablet|android(?!.*mobile)/.test(ua)) return "Tablet";
    if (/smart-tv|hbbtv|appletv/.test(ua)) return "TV";
    return "Desktop";
  }

  // --- 3️⃣ Browser name (rough detection, good enough) ---
  function getBrowser(ua) {
    ua = ua.toLowerCase();
    if (ua.includes("edg")) return "Edge";
    if (ua.includes("opr") || ua.includes("opera")) return "Opera";
    if (ua.includes("chrome") && !ua.includes("chromium")) return "Chrome";
    if (ua.includes("safari") && !ua.includes("chrome")) return "Safari";
    if (ua.includes("firefox")) return "Firefox";
    return "Other";
  }

  // --- 4️⃣ Traffic source (referrer → hostname) ---
  function getSource() {
    const ref = document.referrer || "";
    if (!ref) return "Direct";
    try {
      const url = new URL(ref);
      return url.hostname.replace(/^www\./, "");
    } catch {
      return ref;
    }
  }

  // --- 5️⃣ Build payload for backend ---
  function buildPayload() {
    const ua = navigator.userAgent || "";
    const lang = (navigator.language || "").toLowerCase();
    const tz = (Intl.DateTimeFormat().resolvedOptions().timeZone || "");
    const path = window.location.pathname + window.location.search;

    return {
      session_id: getSessionId(),
      path,
      referrer: document.referrer || "",
      source: getSource(),
      user_agent: ua,
      device_type: getDeviceType(ua),
      browser: getBrowser(ua),
      language: lang,
      timezone: tz,
      screen_width: window.screen && window.screen.width ? window.screen.width : null,
      screen_height: window.screen && window.screen.height ? window.screen.height : null,
      ts: new Date().toISOString()
    };
  }

  // --- 6️⃣ Send visit to backend ---
  async function trackVisit() {
    try {
      // Small debounce so we don't hammer in weird cases
      if (window.__spotalert_visit_tracked) return;
      window.__spotalert_visit_tracked = true;

      const payload = buildPayload();

      await fetch(`${API_BASE}/api/visitors/track`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      // No alerts, no UI. Pure silent tracking.
      // console.log("✅ Visitor tracked:", payload.source, payload.device_type);

    } catch (err) {
      // Silent fail – analytics should never break the app
      // console.error("❌ Visitor tracking failed:", err);
    }
  }

  // --- 7️⃣ Run once per page load ---
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", trackVisit);
  } else {
    trackVisit();
  }
})();
