// Persist wizard state across reloads / accidental tab closes. The version
// suffix on STORAGE_KEY lets us invalidate stale data cleanly if questions or
// scoring change in a future schema bump.
const STORAGE_KEY = "ragAdvisor.v1";

export function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data?.version !== 1) return null;
    return data;
  } catch {
    return null;
  }
}

export function saveToStorage(step, answers) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, step, answers }),
    );
  } catch {
    // localStorage disabled (private mode) or quota exceeded — degrade silently.
  }
}

export function clearStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

// True if the user has any saved progress worth resuming. Lets the landing
// page step aside for returning users without re-onboarding them.
export function hasSavedProgress() {
  const data = loadFromStorage();
  if (!data) return false;
  const stepStarted = typeof data.step === "number" && data.step > 0;
  const answersStarted = data.answers && Object.keys(data.answers).length > 0;
  return stepStarted || answersStarted;
}
