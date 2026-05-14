import { useState } from "react";
import RAGAdvisor from "./RAGAdvisor.jsx";
import Landing from "./components/Landing.jsx";
import Methodology from "./components/Methodology.jsx";
import Privacy from "./components/Privacy.jsx";
import Terms from "./components/Terms.jsx";
import { hasSavedProgress } from "./utils/storage.js";
import { parseAnswersFromHash } from "./utils/shareLink.js";

export default function App() {
  // Simple pathname-based routing. FastAPI's SPA fallback returns index.html
  // for arbitrary paths, so /methodology, /privacy, etc. all land here and
  // we pick the view from window.location.pathname. No router dep needed.
  const path = typeof window !== "undefined" ? window.location.pathname : "/";

  if (path === "/methodology") return <Methodology />;
  if (path === "/privacy") return <Privacy />;
  if (path === "/terms") return <Terms />;

  // At "/" we decide between landing and the wizard. Returning users and
  // share-link visitors skip the landing — landing is only for first-touch.
  return <Root />;
}

function Root() {
  const [showLanding, setShowLanding] = useState(() => {
    if (parseAnswersFromHash()) return false; // shared-link visitor → jump to results
    if (hasSavedProgress()) return false;     // returning user → resume their work
    return true;                               // first-time visitor → onboard
  });

  if (showLanding) {
    return <Landing onStart={() => setShowLanding(false)} />;
  }
  return <RAGAdvisor />;
}
