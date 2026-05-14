export const COLORS = {
  bg:           "#080f1a",
  surface:      "#0f172a",
  border:       "#1e293b",
  borderActive: "#1e2d42",
  textPrimary:  "#f1f5f9",
  textSecondary:"#cbd5e1",
  textMuted:    "#64748b",
  textDim:      "#475569",

  standard:     "#22c55e",
  graph:        "#a855f7",
  agentic:      "#f97316",

  local:        "#22c55e",
  hybrid:       "#f59e0b",
  cloud:        "#3b82f6",

  good:         "#22c55e",
  warning:      "#f59e0b",
  danger:       "#ef4444",

  primary:      "#3b82f6",
  primaryDeep:  "#1d4ed8",
};

export const FONTS = {
  mono: "'SF Mono','Fira Code','Cascadia Code',monospace",
  sans: "system-ui, sans-serif",
};

export const PAGE = {
  background: COLORS.bg,
  minHeight: "100vh",
  padding: "24px 16px 48px",
  fontFamily: FONTS.mono,
  color: COLORS.textSecondary,
};

export const BTN_PRIMARY = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  padding: "11px 20px",
  borderRadius: 8,
  border: "none",
  background: COLORS.primaryDeep,
  color: "#fff",
  fontWeight: 700,
  fontSize: 13,
  letterSpacing: "0.04em",
  fontFamily: "inherit",
};

export const BTN_OUTLINE = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  padding: "11px 16px",
  borderRadius: 8,
  border: `1.5px solid ${COLORS.border}`,
  background: COLORS.surface,
  color: COLORS.textMuted,
  fontWeight: 600,
  fontSize: 12,
  letterSpacing: "0.04em",
  cursor: "pointer",
  fontFamily: "inherit",
};
