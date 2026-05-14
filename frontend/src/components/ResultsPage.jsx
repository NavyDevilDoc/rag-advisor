import { useState } from "react";
import { RotateCcw, AlertTriangle, CheckCircle, Link2, Check } from "lucide-react";
import { computeScores, getReasons, getWarnings } from "../data/scoring.js";
import {
  RAG_META,
  getDeployment,
  getConfidence,
  getPipelineKey,
  rankScores,
} from "../utils/recommend.js";
import { BTN_OUTLINE } from "../styles/tokens.js";
import { buildShareUrl } from "../utils/shareLink.js";
import ScoreBar from "./ScoreBar.jsx";
import AIReasoning from "./AIReasoning.jsx";
import PipelineView from "./PipelineView.jsx";
import PipelineEvaluation from "./PipelineEvaluation.jsx";

export default function ResultsPage({ answers, onReset }) {
  const scores = computeScores(answers);
  const ranked = rankScores(scores);
  const [winnerKey] = ranked[0];
  const [secondKey] = ranked[1];
  const confidence = getConfidence(ranked);
  const meta = RAG_META[winnerKey];
  const deployment = getDeployment(winnerKey, answers.dataSensitivity);
  const reasons = getReasons(winnerKey, answers);
  const warnings = getWarnings(winnerKey, answers);
  const DeployIcon = deployment.Icon;
  const WinIcon = meta.Icon;

  const aiPayload = { answers, recommendation: winnerKey, scores };
  const pipelineKey = getPipelineKey(winnerKey, answers.dataSensitivity);
  const pipelinePayload = { ...aiPayload, pipeline_key: pipelineKey };

  return (
    <div style={{ maxWidth: 620, margin: "0 auto" }}>
      {/* Hero */}
      <div
        style={{
          background: meta.dim,
          border: `1.5px solid ${meta.color}40`,
          borderRadius: 12,
          padding: "20px 20px 16px",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 12,
            flexWrap: "wrap",
          }}
        >
          <WinIcon size={20} style={{ color: meta.color }} />
          <span
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: meta.color,
              letterSpacing: "0.03em",
            }}
          >
            {meta.label}
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              padding: "3px 10px",
              borderRadius: 20,
              background: `${confidence.color}22`,
              color: confidence.color,
              border: `1px solid ${confidence.color}60`,
              letterSpacing: "0.1em",
            }}
          >
            {confidence.label.toUpperCase()}
          </span>
        </div>
        <div
          style={{
            fontSize: 11,
            color: "#64748b",
            fontFamily: "system-ui",
            lineHeight: 1.6,
          }}
        >
          Based on your inputs, this is the highest-fit architecture for your use case.
          {confidence.gap < 8 && (
            <span style={{ color: "#f97316" }}>
              {" "}Note: {RAG_META[secondKey].label} scored close — consider evaluating both.
            </span>
          )}
        </div>
        <ShareLinkButton answers={answers} accentColor={meta.color} />
      </div>

      {/* Score bars */}
      <div
        style={{
          background: "#0f172a",
          border: "1px solid #1e293b",
          borderRadius: 10,
          padding: "14px 16px",
          marginBottom: 16,
        }}
      >
        <SectionLabel>Fit Scores</SectionLabel>
        {ranked.map(([key, score]) => (
          <ScoreBar key={key} ragKey={key} score={score} isWinner={key === winnerKey} />
        ))}
      </div>

      {/* Deployment */}
      <div
        style={{
          background: "#0f172a",
          border: `1px solid ${deployment.color}40`,
          borderRadius: 10,
          padding: "14px 16px",
          marginBottom: 16,
        }}
      >
        <SectionLabel>Recommended Deployment Paradigm</SectionLabel>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <DeployIcon size={15} style={{ color: deployment.color }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: deployment.color }}>
            {deployment.label}
          </span>
        </div>
        <div
          style={{
            fontSize: 12,
            color: "#94a3b8",
            fontFamily: "system-ui",
            lineHeight: 1.6,
          }}
        >
          {deployment.desc}
        </div>
      </div>

      {/* AI reasoning (async) */}
      <AIReasoning payload={aiPayload} accentColor={meta.color} />

      {/* Canonical pipeline for the recommended architecture */}
      <PipelineView pipelineKey={pipelineKey} />

      {/* AI evaluation of the canonical pipeline against the user's specific inputs (async) */}
      <PipelineEvaluation payload={pipelinePayload} accentColor={meta.color} />

      {/* Why */}
      {reasons.length > 0 && (
        <div
          style={{
            background: "#0f172a",
            border: "1px solid #1e293b",
            borderRadius: 10,
            padding: "14px 16px",
            marginBottom: 16,
          }}
        >
          <SectionLabel>Why This Architecture</SectionLabel>
          {reasons.map((r, i) => (
            <div
              key={i}
              style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}
            >
              <CheckCircle size={12} style={{ color: meta.color, flexShrink: 0, marginTop: 2 }} />
              <span
                style={{
                  fontSize: 12,
                  color: "#94a3b8",
                  fontFamily: "system-ui",
                  lineHeight: 1.6,
                }}
              >
                {r}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div
          style={{
            background: "#1a0f00",
            border: "1px solid #92400e40",
            borderRadius: 10,
            padding: "14px 16px",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "#92400e",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            ⚠ Watch Out For
          </div>
          {warnings.map((w, i) => (
            <div
              key={i}
              style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}
            >
              <AlertTriangle size={12} style={{ color: "#f59e0b", flexShrink: 0, marginTop: 2 }} />
              <span
                style={{
                  fontSize: 12,
                  color: "#92400e",
                  fontFamily: "system-ui",
                  lineHeight: 1.6,
                }}
              >
                {w}
              </span>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={onReset}
        style={{ ...BTN_OUTLINE, width: "100%", justifyContent: "center", marginTop: 4 }}
      >
        <RotateCcw size={14} /> Start Over
      </button>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div
      style={{
        fontSize: 10,
        fontWeight: 700,
        color: "#475569",
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        marginBottom: 10,
      }}
    >
      {children}
    </div>
  );
}

function ShareLinkButton({ answers, accentColor }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const url = buildShareUrl(answers);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable (non-secure origin, denied permission).
      // Fall back to a prompt so the user can copy manually.
      window.prompt("Copy this share link:", url);
    }
  }

  return (
    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
      <button
        onClick={handleCopy}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 12px",
          fontSize: 11,
          fontWeight: 600,
          fontFamily: "inherit",
          letterSpacing: "0.04em",
          color: copied ? "#22c55e" : accentColor,
          background: "transparent",
          border: `1px solid ${copied ? "#22c55e60" : `${accentColor}60`}`,
          borderRadius: 6,
          cursor: "pointer",
          transition: "color 0.15s, border-color 0.15s",
        }}
      >
        {copied ? (
          <>
            <Check size={12} /> Copied
          </>
        ) : (
          <>
            <Link2 size={12} /> Copy share link
          </>
        )}
      </button>
    </div>
  );
}
