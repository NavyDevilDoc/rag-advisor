import { RAG_META } from "../utils/recommend.js";

export default function ScoreBar({ ragKey, score, isWinner }) {
  const meta = RAG_META[ragKey];
  const color = isWinner ? meta.color : "#64748b";
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 11, color, fontWeight: isWinner ? 700 : 400 }}>
          {meta.label}
        </span>
        <span style={{ fontSize: 11, color, fontFamily: "monospace", fontWeight: 700 }}>
          {score}
        </span>
      </div>
      <div style={{ height: 6, background: "#1e293b", borderRadius: 3, overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${score}%`,
            background: isWinner ? meta.color : "#334155",
            borderRadius: 3,
            transition: "width 0.6s ease",
          }}
        />
      </div>
    </div>
  );
}
