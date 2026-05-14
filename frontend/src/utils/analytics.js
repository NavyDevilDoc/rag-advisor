// Privacy-respecting analytics. No-op when VITE_PLAUSIBLE_DOMAIN is not set,
// so local dev and the no-paid-service path stay zero-overhead.
//
// To activate in production:
//   1. Sign up at plausible.io (or any Plausible-compatible provider — Umami,
//      Pirsch, etc. all support the same script + event API).
//   2. Add the production domain in their dashboard.
//   3. Set VITE_PLAUSIBLE_DOMAIN=<your-domain> in Railway service variables.
//   4. Redeploy.
//
// The custom events fired throughout the app are tagged so a Plausible "goal"
// can be set against any of them in the dashboard:
//   - Wizard Start
//   - Step Complete (props: { step })
//   - Assessment Complete (props: { recommendation, confidence })
//   - Share Link Copied
//   - Methodology Viewed
//   - Feedback Submitted (props: { helpful })

const DOMAIN = import.meta.env.VITE_PLAUSIBLE_DOMAIN;
// Allow overriding the script host for self-hosted Umami/Pirsch deployments.
// Defaults to Plausible Cloud.
const SCRIPT_HOST = import.meta.env.VITE_ANALYTICS_HOST || "https://plausible.io";

let loaded = false;

export function initAnalytics() {
  if (loaded) return;
  if (!DOMAIN) return; // analytics disabled (env var not set)
  loaded = true;

  const script = document.createElement("script");
  script.defer = true;
  // `script.tagged-events.js` enables custom events + automatic outbound-link tracking.
  script.src = `${SCRIPT_HOST}/js/script.tagged-events.js`;
  script.setAttribute("data-domain", DOMAIN);
  document.head.appendChild(script);

  // Plausible's queue-based API. If the script has already initialised this is
  // a no-op; otherwise the events are buffered and flushed on script load.
  window.plausible =
    window.plausible ||
    function () {
      (window.plausible.q = window.plausible.q || []).push(arguments);
    };
}

export function track(eventName, props) {
  if (!DOMAIN) return;
  if (typeof window === "undefined" || !window.plausible) return;
  if (props) {
    window.plausible(eventName, { props });
  } else {
    window.plausible(eventName);
  }
}
