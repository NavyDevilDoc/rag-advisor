import { useEffect } from "react";
import RAGAdvisor from "./RAGAdvisor.jsx";
import Landing from "./components/Landing.jsx";
import Methodology from "./components/Methodology.jsx";
import Privacy from "./components/Privacy.jsx";
import Terms from "./components/Terms.jsx";
import { parseAnswersFromHash } from "./utils/shareLink.js";
import { usePath, navigate } from "./utils/router.js";

// Routes:
//   /              → Landing (first-time visitor only — see redirect below)
//   /assessment    → Wizard / results page
//   /methodology   → Long-form methodology page
//   /privacy       → Privacy page
//   /terms         → Terms page
//
// FastAPI's SPA fallback serves index.html for arbitrary paths, so direct
// visits to /assessment, /methodology, /privacy, /terms all land here and
// pick their view from window.location.pathname. No router dep needed.
export default function App() {
  const path = usePath();

  // Share-link visitors at / get auto-redirected to /assessment via
  // replaceState — so the URL semantically matches what they're viewing
  // and Back doesn't loop to a landing they never asked to see.
  //
  // We deliberately do NOT redirect for `hasSavedProgress()` alone:
  // localStorage from a prior session would make the landing unreachable
  // for any returning user (regression #4.15). Wizard state still resumes
  // when they navigate to /assessment via the Start CTA — RAGAdvisor.jsx
  // restores from localStorage on mount.
  useEffect(() => {
    if (path === "/" && parseAnswersFromHash()) {
      navigate(`/assessment${window.location.hash}`, { replace: true });
    }
  }, [path]);

  // Fire a synthetic pageview for analytics on every path change. Plausible's
  // auto-tracking only fires on initial load; SPA nav needs this nudge so the
  // dashboard correctly counts Landing vs Assessment as distinct pages.
  useEffect(() => {
    if (typeof window !== "undefined" && window.plausible) {
      window.plausible("pageview");
    }
  }, [path]);

  if (path === "/methodology") return <Methodology />;
  if (path === "/privacy") return <Privacy />;
  if (path === "/terms") return <Terms />;
  if (path === "/assessment") return <RAGAdvisor />;
  // Unknown paths render the Landing — soft 404, friendlier than a hard error.
  return <Landing />;
}
