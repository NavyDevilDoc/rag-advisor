// Minimal client-side router. No external dep — just a `usePath` hook driven
// by popstate + a custom "ragnav" event that we dispatch on `navigate()` calls
// so internal links re-render React without a full page reload.

import { useEffect, useState } from "react";

const NAV_EVENT = "ragnav";

export function usePath() {
  const [path, setPath] = useState(() =>
    typeof window !== "undefined" ? window.location.pathname : "/",
  );

  useEffect(() => {
    function onChange() {
      setPath(window.location.pathname);
    }
    // popstate covers browser Back/Forward; the custom event covers our own
    // navigate() calls (history.pushState alone doesn't fire popstate).
    window.addEventListener("popstate", onChange);
    window.addEventListener(NAV_EVENT, onChange);
    return () => {
      window.removeEventListener("popstate", onChange);
      window.removeEventListener(NAV_EVENT, onChange);
    };
  }, []);

  return path;
}

// In-app navigation. Default is pushState (new history entry). Pass
// `{replace: true}` for replaceState (no back-button breadcrumb), e.g. the
// auto-redirect from / to /assessment.
export function navigate(to, options = {}) {
  if (typeof window === "undefined") return;
  if (options.replace) {
    window.history.replaceState(null, "", to);
  } else {
    window.history.pushState(null, "", to);
  }
  window.dispatchEvent(new Event(NAV_EVENT));
}
