import { ArrowLeft } from "lucide-react";
import { PAGE, COLORS, FONTS } from "../styles/tokens.js";

const REPO = "https://github.com/NavyDevilDoc/rag-advisor";

export default function Methodology() {
  return (
    <div style={PAGE}>
      <BrandStrip />
      <article style={{ maxWidth: 620, margin: "0 auto" }}>
        <BackLink />
        <H1>Methodology</H1>
        <Lede>
          How the recommendation is computed, what the AI panels do, what this
          tool deliberately doesn't try to do, and where the curated pipeline
          data comes from.
        </Lede>

        <H2>What this tool does</H2>
        <P>
          A 12-question wizard that turns your specific RAG constraints into a
          quantified recommendation across three architectural paradigms
          (Standard Vector, Graph, Agentic) plus a deployment paradigm
          (Fully Local, Hybrid, Fully Cloud, or their per-architecture variants).
          The recommendation has two layers: a <Em>deterministic scoring engine</Em>{" "}
          that produces the numerical fit scores, and an{" "}
          <Em>AI evaluation layer</Em> that interprets those scores in plain
          language against your specific inputs.
        </P>
        <P>
          The deterministic side is the load-bearing one. If the AI layer is
          unavailable, you still get a complete, useful recommendation. The AI
          layer adds context, not certainty.
        </P>

        <H2>How the recommendation works</H2>
        <P>
          Every architecture starts at a baseline score of <Code>50/100</Code>.
          Each of the 12 answers applies a weight to the three paradigm scores.
          Weights add (or subtract — some constraints are near-disqualifying),
          and the final scores are clamped to <Code>[0, 100]</Code>.
        </P>
        <P>For example, the latency question has these weights:</P>
        <Pre>
{`latency           [standard, graph, agentic]
  realtime       → [ +3,      +1,    -4    ]   // <2s — agentic near-disqualified
  interactive    → [ +2,      +2,    -1    ]   // 2-8s
  async          → [  0,      +1,    +3    ]   // 8s+ acceptable`}
        </Pre>
        <P>
          A user requiring real-time latency adds +3 to Standard, +1 to Graph,
          and −4 to Agentic — the agentic loop's typical 8–45s P50 latency is
          fundamentally incompatible with sub-2s SLAs, so its score is pushed
          down hard. The full weight matrix lives in{" "}
          <Link href={`${REPO}/blob/main/frontend/src/data/scoring.js`}>
            frontend/src/data/scoring.js
          </Link>
          . Each weight reflects a real architectural trade-off — corpus churn
          punishes graph indexing, retrieval-strategy-unknown rewards agentic,
          query complexity discounts standard.
        </P>
        <P>
          After all 12 weights are applied, the top score wins. Confidence is
          derived from the gap between 1st and 2nd place:
        </P>
        <Bullets
          items={[
            <>
              <Strong>Strong Match</Strong> — gap ≥ 15. Recommendation is well-separated.
            </>,
            <>
              <Strong>Good Match</Strong> — gap 8–14. Clear winner; runner-up is in the conversation.
            </>,
            <>
              <Strong>Close Call</Strong> — gap &lt; 8. The tool surfaces the runner-up
              explicitly. Consider evaluating both.
            </>,
          ]}
        />
        <P>
          The weights are intentionally opinionated. They will not be right
          for every edge case. The Close Call indicator exists specifically to
          flag when the recommendation might not deserve high confidence.
        </P>

        <H2>How the deployment paradigm is chosen</H2>
        <P>
          The deployment paradigm is decoupled from the architecture and driven
          entirely by the <Em>data sensitivity</Em> answer:
        </P>
        <Table
          headers={["Recommendation", "Low", "Moderate", "High"]}
          rows={[
            ["Standard Vector", "Fully Cloud", "Hybrid", "Fully Local"],
            ["Graph RAG", "Cloud Graph", "Cloud Graph", "Self-Hosted Graph"],
            ["Agentic RAG", "Cloud Agentic", "Hybrid Agentic", "Hybrid Agentic"],
          ]}
        />
        <P>
          High data sensitivity (air-gap, classified, regulated) forces compute
          and embeddings on-prem. Low sensitivity removes the constraint and
          cloud-managed services win on ops burden. Hybrid is the middle path
          where the privacy perimeter stays local but scale comes from cloud.
          Full mapping with recommended component stacks is in{" "}
          <Link href={`${REPO}/blob/main/frontend/src/utils/recommend.js`}>
            utils/recommend.js
          </Link>
          .
        </P>

        <H2>What the AI panels do</H2>
        <P>
          Two panels on the results page (AI Reasoning + AI Pipeline Evaluation)
          are generated by <Em>Claude Sonnet 4.6</Em> via two separate API
          calls. They serve different purposes:
        </P>
        <Bullets
          items={[
            <>
              <Strong>AI Reasoning</Strong> — a 2–3 sentence paragraph
              explaining <Em>why</Em> the recommended architecture fits this
              specific combination of inputs. Names the 2–3 factors that drove
              the decision.
            </>,
            <>
              <Strong>AI Pipeline Evaluation</Strong> — a 3–4 sentence paragraph
              evaluating the canonical pipeline (the stage-by-stage diagram on
              the results page) against your specific constraints. Identifies
              which stages need operational attention and which can potentially
              be simplified.
            </>,
          ]}
        />
        <P>
          <Strong>The AI layer is grounded.</Strong> The pipeline data —
          every stage, every component recommendation, every operational note —
          lives in the backend code, not in the LLM's head. Claude is asked to
          evaluate fixed pipeline data against fixed user answers. It cannot
          invent vector databases that don't exist or hallucinate component
          stacks.
        </P>
        <P>
          If either AI call fails, the corresponding panel shows a graceful
          fallback message. The deterministic recommendation, scores, deployment
          paradigm, why-bullets, watch-outs, and pipeline diagram are all
          independent of the AI calls and always render.
        </P>

        <H2>What this tool doesn't do</H2>
        <P>Important to be explicit about limitations:</P>
        <NumberedList
          items={[
            <>
              <Strong>It doesn't model your team's specific expertise or vendor relationships.</Strong>{" "}
              If your engineering org is already deep on Neo4j, that biases the
              trade-off in ways this tool can't see.
            </>,
            <>
              <Strong>It doesn't guarantee the recommendation will work for your specific data.</Strong>{" "}
              RAG quality is overwhelmingly determined by chunk quality,
              embedding model choice, and reranker tuning — none of which this
              tool evaluates. The recommendation tells you what{" "}
              <Em>architectural pattern</Em> fits your constraints, not whether
              RAG will solve your specific problem.
            </>,
            <>
              <Strong>It is not a substitute for prototyping.</Strong> For a
              real production deployment, build a small scoped prototype,
              measure retrieval quality with RAGAS or your own evals, and
              iterate before committing to the full pipeline.
            </>,
            <>
              <Strong>The pipeline data is opinionated, dated, and curated.</Strong>{" "}
              It reflects a snapshot of production RAG patterns as of mid-2026.
              Component recommendations age fast in this space. Cross-reference
              current docs when you're making real budget commitments.
            </>,
            <>
              <Strong>The AI evaluation isn't measurement.</Strong> Claude is
              reading your answers and the canonical pipeline summary; it is not
              running benchmarks against your data. Its evaluation is informed
              pattern-matching, not empirical evidence.
            </>,
          ]}
        />

        <H2>Pipeline data sources</H2>
        <P>
          The pipeline data shown on the results page lives in{" "}
          <Link href={`${REPO}/blob/main/frontend/src/data/pipelines.js`}>
            frontend/src/data/pipelines.js
          </Link>
          . Five paradigms (local, hybrid, cloud, graph, agentic), 13–18 stages
          each, with components, operational notes, and LOC / DELTA badges
          showing how each stage differs from baseline.
        </P>
        <P>
          Component recommendations were curated by hand from published
          documentation, vendor benchmarks, and observed production patterns.
          The data should be reviewed periodically; component recommendations
          age fast in this space.
        </P>
        <P>
          If you spot a missing or out-of-date component, please{" "}
          <Link href={`${REPO}/issues`}>file a GitHub issue</Link>.
          Suggestions welcome.
        </P>

        <H2>About the author</H2>
        <P>
          <span style={{ color: COLORS.warning, fontWeight: 600 }}>
            [TODO: replace this paragraph with your own bio.]
          </span>{" "}
          A few prompts: who you are (role, technical background), why you
          built this tool, what problem you were trying to solve, what you'd
          change if you redid it. Aim for 3–5 sentences. This is the
          credibility section — write in your own voice, not anyone else's.
        </P>

        <H2>Open source</H2>
        <P>
          The full implementation is MIT-licensed and available at{" "}
          <Link href={REPO}>github.com/NavyDevilDoc/rag-advisor</Link>. You can:
        </P>
        <Bullets
          items={[
            <>
              <Strong>Read the code</Strong> — scoring engine, pipeline data,
              prompt templates, and API are all viewable.
            </>,
            <>
              <Strong>File issues</Strong> — bugs, suggested weight changes,
              pipeline data corrections.
            </>,
            <>
              <Strong>Fork and self-host</Strong> — single-service Docker deploy;
              instructions in the README.
            </>,
          ]}
        />
        <P>
          The pipeline data and scoring weights are the most likely areas to
          want community input. PRs welcome.
        </P>

        <Footer />
      </article>
    </div>
  );
}

// ────────────────────────── building blocks ──────────────────────────

function BrandStrip() {
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

function BackLink() {
  return (
    <a
      href="/"
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

function Footer() {
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
      }}
    >
      Built by Jeremy Springston · MIT licensed ·{" "}
      <a href={REPO} style={{ color: COLORS.textMuted, textDecoration: "none" }}>
        GitHub
      </a>
    </div>
  );
}

function H1({ children }) {
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

function Lede({ children }) {
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

function H2({ children }) {
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

function P({ children }) {
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

function Strong({ children }) {
  return <strong style={{ color: COLORS.textPrimary, fontWeight: 700 }}>{children}</strong>;
}

function Em({ children }) {
  return <em style={{ color: COLORS.textPrimary, fontStyle: "italic" }}>{children}</em>;
}

function Code({ children }) {
  return (
    <code
      style={{
        fontFamily: FONTS.mono,
        fontSize: 12,
        color: COLORS.primary,
        background: `${COLORS.primary}12`,
        padding: "1px 6px",
        borderRadius: 4,
      }}
    >
      {children}
    </code>
  );
}

function Pre({ children }) {
  return (
    <pre
      style={{
        fontFamily: FONTS.mono,
        fontSize: 11.5,
        color: COLORS.textPrimary,
        background: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 8,
        padding: "12px 14px",
        overflowX: "auto",
        lineHeight: 1.6,
        margin: "0 0 16px 0",
      }}
    >
      {children}
    </pre>
  );
}

function Link({ href, children }) {
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

function Bullets({ items }) {
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

function NumberedList({ items }) {
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

function Table({ headers, rows }) {
  return (
    <div
      style={{
        overflowX: "auto",
        margin: "0 0 16px 0",
        border: `1px solid ${COLORS.border}`,
        borderRadius: 8,
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontFamily: FONTS.sans,
          fontSize: 12,
        }}
      >
        <thead>
          <tr style={{ background: COLORS.surface }}>
            {headers.map((h, i) => (
              <th
                key={i}
                style={{
                  textAlign: "left",
                  padding: "10px 12px",
                  color: COLORS.textDim,
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  fontSize: 10,
                  borderBottom: `1px solid ${COLORS.border}`,
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td
                  key={j}
                  style={{
                    padding: "10px 12px",
                    color: j === 0 ? COLORS.textPrimary : COLORS.textSecondary,
                    fontWeight: j === 0 ? 600 : 400,
                    borderBottom: i === rows.length - 1 ? "none" : `1px solid ${COLORS.border}`,
                  }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
