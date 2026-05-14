import { STEPS } from "../data/questions.js";

// Flatten the wizard's questions into a (questionId, allowedValues[]) list so
// we can validate that a decoded payload is well-formed before trusting it.
const QUESTION_VALUES = STEPS.flatMap((step) =>
  step.questions.map((q) => [q.id, q.options.map((o) => o.value)]),
);

function isValidAnswers(obj) {
  if (!obj || typeof obj !== "object") return false;
  return QUESTION_VALUES.every(
    ([qid, values]) => typeof obj[qid] === "string" && values.includes(obj[qid]),
  );
}

// btoa/atob round-trip on the JSON payload. Our answer values are ASCII enums
// (small/medium/large/etc.) so we don't need TextEncoder bytes here.
function base64UrlEncode(s) {
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(s) {
  const pad = s.length % 4 === 0 ? 0 : 4 - (s.length % 4);
  return atob(s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(pad));
}

export function encodeAnswers(answers) {
  return base64UrlEncode(JSON.stringify(answers));
}

export function decodeAnswers(encoded) {
  try {
    const obj = JSON.parse(base64UrlDecode(encoded));
    return isValidAnswers(obj) ? obj : null;
  } catch {
    return null;
  }
}

export function buildShareUrl(answers) {
  // Share links point at the assessment route directly so the recipient
  // skips the landing page. The legacy /#r=... form still works — App.jsx
  // auto-redirects from / to /assessment when a share-link hash is present.
  return `${window.location.origin}/assessment#r=${encodeAnswers(answers)}`;
}

// Reads the current URL hash for `?#r=<payload>` or `#&r=<payload>` patterns.
// Returns the decoded answers object or null if missing / invalid.
export function parseAnswersFromHash() {
  if (typeof window === "undefined") return null;
  const match = window.location.hash.match(/[#&]r=([A-Za-z0-9_-]+)/);
  return match ? decodeAnswers(match[1]) : null;
}
