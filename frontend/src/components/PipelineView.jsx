import { FlaskConical } from "lucide-react";
import { ARCHS, LOC, DELTA } from "../data/pipelines.js";

export default function PipelineView({ pipelineKey }) {
  const arch = ARCHS[pipelineKey];
  if (!arch) return null;
  const ArchIcon = arch.Icon;

  return (
    <div
      style={{
        background: "#0f172a",
        border: `1px solid ${arch.accent}40`,
        borderRadius: 10,
        padding: "16px",
        marginBottom: 16,
      }}
    >
      {/* Section header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 4,
        }}
      >
        <ArchIcon size={14} style={{ color: arch.accent }} />
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: "#475569",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}
        >
          Recommended Pipeline · {arch.label}
        </span>
      </div>
      <div
        style={{
          fontSize: 11,
          color: arch.accent,
          fontFamily: "system-ui",
          marginBottom: 14,
          marginLeft: 22,
          lineHeight: 1.5,
        }}
      >
        {arch.sublabel}
      </div>

      {/* Delta legend for graph / agentic */}
      {arch.badgeMode === "delta" && (
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            alignItems: "center",
            marginBottom: 12,
            paddingBottom: 10,
            borderBottom: "1px solid #1e293b",
          }}
        >
          <span style={{ fontSize: 9, color: "#475569", letterSpacing: "0.1em" }}>
            VS STANDARD RAG →
          </span>
          {Object.values(DELTA).map((b) => (
            <Badge key={b.label} badge={b} />
          ))}
        </div>
      )}

      {/* Stages */}
      {arch.stages.map((stage, i) => (
        <Stage
          key={i}
          stage={stage}
          index={i}
          isLast={i === arch.stages.length - 1}
          accent={arch.accent}
          badgeMode={arch.badgeMode}
        />
      ))}
    </div>
  );
}

function Stage({ stage, index, isLast, accent, badgeMode }) {
  const badge = badgeMode === "loc" ? LOC[stage.loc] : DELTA[stage.delta];

  return (
    <div style={{ display: "flex", gap: 10 }}>
      {/* Spine */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: 26,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: stage.optional ? "transparent" : `${accent}18`,
            border: `1.5px solid ${stage.optional ? "#334155" : accent}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 10,
            fontWeight: 800,
            color: stage.optional ? "#475569" : accent,
            flexShrink: 0,
          }}
        >
          {index + 1}
        </div>
        {!isLast && (
          <div
            style={{
              width: "1.5px",
              flex: 1,
              background: `${accent}28`,
              minHeight: 10,
            }}
          />
        )}
      </div>

      {/* Card */}
      <div
        style={{
          flex: 1,
          background: "#080f1a",
          border: `1px solid ${stage.optional ? "#1e293b" : "#1e2d42"}`,
          borderRadius: 8,
          padding: "10px 12px",
          marginBottom: 7,
          opacity: stage.optional ? 0.85 : 1,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 6,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "#64748b",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            {stage.name}
          </span>
          <Badge badge={badge} />
          {stage.optional && (
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                padding: "2px 6px",
                borderRadius: 4,
                background: "#1a1040",
                color: "#a78bfa",
                border: "1px solid #7c3aed",
                letterSpacing: "0.07em",
                display: "flex",
                alignItems: "center",
                gap: 3,
              }}
            >
              <FlaskConical size={9} /> OPTIONAL
            </span>
          )}
        </div>
        <div
          style={{
            fontSize: 11,
            color: "#e2e8f0",
            marginBottom: 6,
            lineHeight: 1.5,
            wordBreak: "break-word",
          }}
        >
          {stage.comp}
        </div>
        <div
          style={{
            fontSize: 11,
            color: "#475569",
            lineHeight: 1.55,
            fontFamily: "system-ui, sans-serif",
          }}
        >
          {stage.note}
        </div>
      </div>
    </div>
  );
}

function Badge({ badge }) {
  return (
    <span
      style={{
        fontSize: 9,
        fontWeight: 700,
        padding: "2px 7px",
        borderRadius: 4,
        background: badge.bg,
        color: badge.color,
        border: `1px solid ${badge.border}`,
        letterSpacing: "0.07em",
        whiteSpace: "nowrap",
      }}
    >
      {badge.label}
    </span>
  );
}
