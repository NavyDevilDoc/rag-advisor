import { ArrowRight, CheckCircle, Layers, Sparkles, GitBranch, Cpu } from "lucide-react";
import { PAGE, BTN_PRIMARY, COLORS, FONTS } from "../styles/tokens.js";
import { PageFooter } from "./longform.jsx";
import { track } from "../utils/analytics.js";
import { navigate } from "../utils/router.js";

export default function Landing() {
  function handleStart() {
    track("Wizard Start");
    navigate("/assessment");
  }
  return (
    <div style={PAGE}>
      <BrandStrip />
      <div style={{ maxWidth: 620, margin: "0 auto" }}>
        <Hero onStart={handleStart} />
        <WhatYouGet />
        <WhoItsFor />
        <HowItWorks />
        <PageFooter />
      </div>
    </div>
  );
}

function BrandStrip() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        marginBottom: 48,
      }}
    >
      <BrandMark />
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

// Inline SVG version of the favicon (three colored dots) for use in headers.
function BrandMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="6" fill={COLORS.surface} />
      <circle cx="8" cy="16" r="3.5" fill={COLORS.standard} />
      <circle cx="16" cy="16" r="3.5" fill={COLORS.graph} />
      <circle cx="24" cy="16" r="3.5" fill={COLORS.agentic} />
    </svg>
  );
}

function Hero({ onStart }) {
  return (
    <div style={{ textAlign: "center", marginBottom: 56 }}>
      <h1
        style={{
          fontSize: 30,
          fontWeight: 800,
          color: COLORS.textPrimary,
          letterSpacing: "0.01em",
          lineHeight: 1.2,
          margin: "0 0 18px 0",
        }}
      >
        Find your optimal RAG architecture
        <br />
        <span style={{ color: COLORS.primary }}>in 12 questions.</span>
      </h1>
      <p
        style={{
          fontSize: 14,
          color: COLORS.textSecondary,
          fontFamily: FONTS.sans,
          lineHeight: 1.65,
          margin: "0 auto 28px",
          maxWidth: 520,
        }}
      >
        Free, no signup, ~3 minutes. Get a fit score across the three major
        paradigms — Standard, Graph, Agentic — plus a deployment recommendation
        tuned to your data sensitivity and an AI-generated evaluation of the
        canonical pipeline against your specific constraints.
      </p>
      <button
        onClick={onStart}
        style={{
          ...BTN_PRIMARY,
          padding: "14px 28px",
          fontSize: 14,
          margin: "0 auto",
        }}
      >
        Start the assessment <ArrowRight size={16} />
      </button>
    </div>
  );
}

function WhatYouGet() {
  const items = [
    {
      Icon: CheckCircle,
      color: COLORS.standard,
      title: "Scored recommendation",
      body: "A 0–100 fit score for each paradigm with a Strong / Good / Close Call confidence indicator. Runner-up is surfaced when the call is tight.",
    },
    {
      Icon: Layers,
      color: COLORS.hybrid,
      title: "Deployment paradigm",
      body: "Whether to ship Fully Local, Hybrid, or Fully Cloud based on your data sensitivity — with the canonical stack at each tier.",
    },
    {
      Icon: Sparkles,
      color: COLORS.primary,
      title: "AI pipeline evaluation",
      body: "Two Claude-generated paragraphs: why this architecture fits your inputs, and which specific pipeline stages will need operational attention.",
    },
  ];
  return (
    <Section label="What you get">
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
        {items.map(({ Icon, color, title, body }) => (
          <div
            key={title}
            style={{
              background: COLORS.surface,
              border: `1px solid ${color}30`,
              borderRadius: 10,
              padding: "14px 16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <Icon size={14} style={{ color }} />
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color,
                  letterSpacing: "0.04em",
                }}
              >
                {title}
              </span>
            </div>
            <div
              style={{
                fontSize: 12,
                color: COLORS.textSecondary,
                fontFamily: FONTS.sans,
                lineHeight: 1.6,
              }}
            >
              {body}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function WhoItsFor() {
  const personas = [
    "Engineering leads picking a RAG architecture without prior expertise.",
    "ML / AI leads doing technical due diligence on a vendor pitch.",
    "Engineers prototyping a RAG system and wanting a sanity check on direction.",
  ];
  return (
    <Section label="Who this is for">
      <div
        style={{
          background: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 10,
          padding: "14px 16px",
        }}
      >
        {personas.map((line, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
              marginBottom: i === personas.length - 1 ? 0 : 8,
            }}
          >
            <span style={{ color: COLORS.textDim, fontFamily: FONTS.mono, lineHeight: 1.6 }}>·</span>
            <span
              style={{
                fontSize: 12,
                color: COLORS.textSecondary,
                fontFamily: FONTS.sans,
                lineHeight: 1.6,
              }}
            >
              {line}
            </span>
          </div>
        ))}
      </div>
    </Section>
  );
}

function HowItWorks() {
  const points = [
    {
      Icon: GitBranch,
      text: (
        <>
          A <strong style={{ color: COLORS.textPrimary }}>deterministic scoring engine</strong>{" "}
          maps your 12 answers to per-paradigm weights. Same inputs → same recommendation, every time.
        </>
      ),
    },
    {
      Icon: Cpu,
      text: (
        <>
          A <strong style={{ color: COLORS.textPrimary }}>curated pipeline database</strong>{" "}
          covers all 5 deployment paradigms (local, hybrid, cloud, graph, agentic) with 13–18 stages each.
        </>
      ),
    },
    {
      Icon: Sparkles,
      text: (
        <>
          An <strong style={{ color: COLORS.textPrimary }}>AI evaluation layer</strong>{" "}
          (Claude Sonnet 4.6) writes two grounded paragraphs against the canonical pipeline data — so it can't invent components that don't exist.
        </>
      ),
    },
  ];
  return (
    <Section label="How it works">
      <div
        style={{
          background: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 10,
          padding: "14px 16px",
        }}
      >
        {points.map(({ Icon, text }, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
              marginBottom: i === points.length - 1 ? 12 : 10,
            }}
          >
            <Icon size={13} style={{ color: COLORS.textMuted, flexShrink: 0, marginTop: 3 }} />
            <span
              style={{
                fontSize: 12,
                color: COLORS.textSecondary,
                fontFamily: FONTS.sans,
                lineHeight: 1.65,
              }}
            >
              {text}
            </span>
          </div>
        ))}
        <a
          href="/methodology"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontSize: 11,
            color: COLORS.primary,
            fontFamily: FONTS.sans,
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          Read the full methodology <ArrowRight size={11} />
        </a>
      </div>
    </Section>
  );
}

function Section({ label, children }) {
  return (
    <section style={{ marginBottom: 32 }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: COLORS.textDim,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          marginBottom: 12,
        }}
      >
        {label}
      </div>
      {children}
    </section>
  );
}
