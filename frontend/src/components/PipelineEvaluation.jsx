import { useEffect, useState } from "react";
import { ScanSearch, AlertCircle } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "";

export default function PipelineEvaluation({ payload, accentColor }) {
  const [state, setState] = useState({ status: "loading", text: "", error: "" });

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function fetchEvaluation() {
      try {
        const res = await fetch(`${API_BASE}/api/evaluate-pipeline`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;

        if (!res.ok || !data.reasoning) {
          setState({
            status: "error",
            text: "",
            error: data.error || `Request failed (${res.status})`,
          });
          return;
        }
        setState({ status: "ready", text: data.reasoning, error: "" });
      } catch (err) {
        if (cancelled || err.name === "AbortError") return;
        setState({ status: "error", text: "", error: err.message || "Network error" });
      }
    }

    fetchEvaluation();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [payload]);

  return (
    <div
      style={{
        background: "#0f172a",
        border: `1px solid ${accentColor}40`,
        borderRadius: 10,
        padding: "14px 16px",
        marginBottom: 16,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <ScanSearch size={12} style={{ color: accentColor }} />
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: "#475569",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}
        >
          AI Pipeline Evaluation
        </span>
      </div>

      {state.status === "loading" && <Skeleton accentColor={accentColor} />}

      {state.status === "ready" && (
        <div
          style={{
            fontSize: 12,
            color: "#cbd5e1",
            fontFamily: "system-ui",
            lineHeight: 1.7,
          }}
        >
          {state.text}
        </div>
      )}

      {state.status === "error" && (
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "flex-start",
            fontFamily: "system-ui",
          }}
        >
          <AlertCircle size={13} style={{ color: "#64748b", flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6 }}>
            Pipeline evaluation unavailable right now. The canonical pipeline above is
            independently complete — these are the components our deterministic engine
            recommends for your inputs.
          </div>
        </div>
      )}
    </div>
  );
}

function Skeleton({ accentColor }) {
  const bar = {
    height: 9,
    background: `${accentColor}18`,
    borderRadius: 4,
    marginBottom: 7,
    animation: "ragPulse 1.4s ease-in-out infinite",
  };
  return (
    <>
      <style>{`@keyframes ragPulse { 0%,100% { opacity: 0.45 } 50% { opacity: 0.9 } }`}</style>
      <div style={{ ...bar, width: "94%" }} />
      <div style={{ ...bar, width: "88%" }} />
      <div style={{ ...bar, width: "76%" }} />
      <div style={{ ...bar, width: "60%", marginBottom: 0 }} />
    </>
  );
}
