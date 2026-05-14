// Shared building blocks for long-form pages (Methodology / Privacy / Terms).
// These are intentionally low-frills: consistent typography, ink-friendly dark
// theme, no clever animation.

import { ArrowLeft } from "lucide-react";
import { COLORS, FONTS } from "../styles/tokens.js";

const REPO = "https://github.com/NavyDevilDoc/rag-advisor";

// ─── shell ───────────────────────────────────────────────────────────

export function BrandStrip() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        marginBottom: 40,
      }}
    >
      <svg width="20" height="20" viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="6" fill={COLORS.surface} />
        <circle cx="8" cy="16" r="3.5" fill={COLORS.standard} />
        <circle cx="16" cy="16" r="3.5" fill={COLORS.graph} />
        <circle cx="24" cy="16" r="3.5" fill={COLORS.agentic} />
      </svg>
      <span
        style={{
          fontSize: 10,
          letterSpacing: "0.22em",
          color: COLORS.textDim,
          textTransform: "uppercase",
        }}
      >
        RAG Architecture Advisor
      </span>
    </div>
  );
}

export function BackLink() {
  return (
    <a
      href="/assessment"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 11,
        color: COLORS.textMuted,
        fontFamily: FONTS.sans,
        textDecoration: "none",
        marginBottom: 20,
        letterSpacing: "0.04em",
      }}
    >
      <ArrowLeft size={12} /> Back to the assessment
    </a>
  );
}

export function PageFooter() {
  return (
    <div
      style={{
        marginTop: 56,
        paddingTop: 20,
        borderTop: `1px solid ${COLORS.border}`,
        fontSize: 10,
        color: COLORS.textDim,
        fontFamily: FONTS.sans,
        letterSpacing: "0.04em",
        textAlign: "center",
        lineHeight: 1.8,
      }}
    >
      <div>Built by Jeremy Springston · MIT licensed</div>
      <div>
        <FooterLink href="/methodology">Methodology</FooterLink>
        <Sep />
        <FooterLink href="/privacy">Privacy</FooterLink>
        <Sep />
        <FooterLink href="/terms">Terms</FooterLink>
        <Sep />
        <FooterLink href={REPO} external>GitHub</FooterLink>
      </div>
    </div>
  );
}

function FooterLink({ href, external, children }) {
  return (
    <a
      href={href}
      style={{ color: COLORS.textMuted, textDecoration: "none" }}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
    >
      {children}
    </a>
  );
}

function Sep() {
  return <span style={{ color: COLORS.border, margin: "0 8px" }}>·</span>;
}

// ─── typography ──────────────────────────────────────────────────────

export function H1({ children }) {
  return (
    <h1
      style={{
        fontSize: 28,
        fontWeight: 800,
        color: COLORS.textPrimary,
        letterSpacing: "0.01em",
        margin: "0 0 12px 0",
      }}
    >
      {children}
    </h1>
  );
}

export function Lede({ children }) {
  return (
    <p
      style={{
        fontSize: 14,
        color: COLORS.textSecondary,
        fontFamily: FONTS.sans,
        lineHeight: 1.7,
        margin: "0 0 36px 0",
      }}
    >
      {children}
    </p>
  );
}

export function H2({ children }) {
  return (
    <h2
      style={{
        fontSize: 16,
        fontWeight: 700,
        color: COLORS.textPrimary,
        letterSpacing: "0.02em",
        margin: "32px 0 14px 0",
        paddingTop: 12,
        borderTop: `1px solid ${COLORS.border}`,
      }}
    >
      {children}
    </h2>
  );
}

export function P({ children }) {
  return (
    <p
      style={{
        fontSize: 13,
        color: COLORS.textSecondary,
        fontFamily: FONTS.sans,
        lineHeight: 1.75,
        margin: "0 0 14px 0",
      }}
    >
      {children}
    </p>
  );
}

export function Strong({ children }) {
  return <strong style={{ color: COLORS.textPrimary, fontWeight: 700 }}>{children}</strong>;
}

export function Em({ children }) {
  return <em style={{ color: COLORS.textPrimary, fontStyle: "italic" }}>{children}</em>;
}

export function Link({ href, children }) {
  const external = href.startsWith("http");
  return (
    <a
      href={href}
      style={{
        color: COLORS.primary,
        textDecoration: "underline",
        textDecorationColor: `${COLORS.primary}60`,
        textUnderlineOffset: 2,
      }}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
    >
      {children}
    </a>
  );
}

export function Bullets({ items }) {
  return (
    <ul
      style={{
        margin: "0 0 14px 0",
        paddingLeft: 22,
        fontSize: 13,
        color: COLORS.textSecondary,
        fontFamily: FONTS.sans,
        lineHeight: 1.75,
      }}
    >
      {items.map((it, i) => (
        <li key={i} style={{ marginBottom: 6 }}>
          {it}
        </li>
      ))}
    </ul>
  );
}

export function NumberedList({ items }) {
  return (
    <ol
      style={{
        margin: "0 0 14px 0",
        paddingLeft: 22,
        fontSize: 13,
        color: COLORS.textSecondary,
        fontFamily: FONTS.sans,
        lineHeight: 1.75,
      }}
    >
      {items.map((it, i) => (
        <li key={i} style={{ marginBottom: 10 }}>
          {it}
        </li>
      ))}
    </ol>
  );
}
