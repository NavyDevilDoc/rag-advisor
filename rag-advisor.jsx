import { useState } from "react";
import {
  ChevronRight, ChevronLeft, RotateCcw, AlertTriangle,
  Server, Cloud, Layers, GitBranch, Cpu, CheckCircle, Info
} from "lucide-react";

/* ══════════════════════════════════════════════════════
   QUESTION DEFINITIONS
══════════════════════════════════════════════════════ */
const STEPS = [
  {
    title: "Data Profile",
    subtitle: "Describe your document corpus",
    questions: [
      {
        id: "corpusSize",
        text: "How large is your document corpus?",
        options: [
          { value: "small",  label: "Small",  desc: "Under ~500 docs / 1M tokens total" },
          { value: "medium", label: "Medium", desc: "1M – 100M tokens" },
          { value: "large",  label: "Large",  desc: "100M+ tokens" },
        ],
      },
      {
        id: "corpusChurn",
        text: "How often does your corpus change?",
        options: [
          { value: "rare",     label: "Rarely",      desc: "Monthly updates or less" },
          { value: "regular",  label: "Regularly",   desc: "Weekly updates" },
          { value: "frequent", label: "Frequently",  desc: "Daily or continuous ingestion" },
        ],
      },
      {
        id: "crossRefDensity",
        text: "How densely cross-referenced are your documents?",
        options: [
          { value: "low",    label: "Low",    desc: "Most documents are standalone" },
          { value: "medium", label: "Medium", desc: "Some cross-references exist" },
          { value: "high",   label: "High",   desc: "Heavily cross-referenced corpus" },
        ],
      },
      {
        id: "relationshipImportance",
        text: "Are typed entity relationships critical to your queries?",
        options: [
          { value: "none",     label: "Not Important", desc: "Semantic similarity is enough" },
          { value: "some",     label: "Somewhat",      desc: "Relationships matter in some cases" },
          { value: "critical", label: "Critical",      desc: "Who/what relates to what is essential" },
        ],
      },
    ],
  },
  {
    title: "Query Profile",
    subtitle: "Describe how users interact with the system",
    questions: [
      {
        id: "queryComplexity",
        text: "How complex are typical user queries?",
        options: [
          { value: "simple",   label: "Simple",   desc: "Direct factual lookups" },
          { value: "moderate", label: "Moderate", desc: "Synthesis across a few documents" },
          { value: "complex",  label: "Complex",  desc: "Open-ended multi-step research" },
        ],
      },
      {
        id: "multiHop",
        text: "How often do queries require multi-hop reasoning?",
        options: [
          { value: "rarely",     label: "Rarely",      desc: "Answer lives in one or two chunks" },
          { value: "sometimes",  label: "Sometimes",   desc: "Occasional chain-of-reference needed" },
          { value: "frequently", label: "Frequently",  desc: "Most answers require connecting multiple sources" },
        ],
      },
      {
        id: "retrievalStrategy",
        text: "Is your retrieval strategy knowable at design time?",
        options: [
          { value: "known",   label: "Yes, always",   desc: "Same retrieval approach for all queries" },
          { value: "partial", label: "Partially",     desc: "Strategy varies but is bounded" },
          { value: "unknown", label: "No, it varies", desc: "Optimal strategy depends on each query" },
        ],
      },
      {
        id: "externalTools",
        text: "Do queries need external tools beyond document retrieval?",
        options: [
          { value: "none",       label: "None",         desc: "Documents only" },
          { value: "occasional", label: "Occasionally", desc: "Sometimes web search or SQL" },
          { value: "regular",    label: "Regularly",    desc: "Web, code, APIs are core to the use case" },
        ],
      },
    ],
  },
  {
    title: "Constraints",
    subtitle: "Define your operational boundaries",
    questions: [
      {
        id: "latency",
        text: "What response latency can users tolerate?",
        options: [
          { value: "realtime",    label: "Real-time",    desc: "Under 2 seconds" },
          { value: "interactive", label: "Interactive",  desc: "2 – 8 seconds" },
          { value: "async",       label: "Async OK",     desc: "8+ seconds is acceptable" },
        ],
      },
      {
        id: "indexingCost",
        text: "What is your tolerance for one-time indexing cost?",
        options: [
          { value: "minimize", label: "Minimize",  desc: "Keep indexing spend as low as possible" },
          { value: "moderate", label: "Moderate",  desc: "Willing to invest for better retrieval" },
          { value: "flexible", label: "Flexible",  desc: "Cost is not a constraint" },
        ],
      },
      {
        id: "queryCost",
        text: "What is your tolerance for per-query inference cost?",
        options: [
          { value: "minimize", label: "Minimize",  desc: "Cost per query must stay low" },
          { value: "moderate", label: "Moderate",  desc: "Moderate cost acceptable for quality" },
          { value: "flexible", label: "Flexible",  desc: "Quality over cost" },
        ],
      },
      {
        id: "dataSensitivity",
        text: "How sensitive is your data?",
        options: [
          { value: "low",      label: "Low",      desc: "Public or internal non-sensitive" },
          { value: "moderate", label: "Moderate", desc: "Internal, some compliance concerns" },
          { value: "high",     label: "High",     desc: "Sensitive, classified, or air-gap required" },
        ],
      },
    ],
  },
];

/* ══════════════════════════════════════════════════════
   SCORING ENGINE
══════════════════════════════════════════════════════ */
const WEIGHTS = {
  corpusSize:             { small:  [2,-1,0],  medium: [1,1,1],   large:     [0,2,1]   },
  corpusChurn:            { rare:   [0,3,0],   regular:[1,0,1],   frequent:  [3,-3,1]  },
  crossRefDensity:        { low:    [3,-1,0],  medium: [1,2,0],   high:      [-2,4,0]  },
  relationshipImportance: { none:   [2,-1,0],  some:   [1,2,0],   critical:  [-2,4,0]  },
  queryComplexity:        { simple: [3,1,-2],  moderate:[2,1,1],  complex:   [-1,1,3]  },
  multiHop:               { rarely: [2,1,0],   sometimes:[0,2,1], frequently:[-2,3,2]  },
  retrievalStrategy:      { known:  [3,1,-2],  partial: [1,1,2],  unknown:   [-2,0,4]  },
  externalTools:          { none:   [2,1,-1],  occasional:[1,0,2],regular:   [-1,0,4]  },
  latency:                { realtime:[3,1,-4], interactive:[2,2,-1], async:  [0,1,3]   },
  indexingCost:           { minimize:[2,-3,0], moderate:[1,1,0],  flexible:  [0,3,1]   },
  queryCost:              { minimize:[3,1,-4], moderate:[2,1,0],  flexible:  [0,0,3]   },
  dataSensitivity:        { low:    [0,0,0],   moderate:[0,0,0],  high:      [0,0,0]   },
};

function computeScores(answers) {
  let s = 50, g = 50, a = 50;
  for (const [id, val] of Object.entries(answers)) {
    const w = WEIGHTS[id]?.[val];
    if (w) { s += w[0]; g += w[1]; a += w[2]; }
  }
  return {
    standard: Math.max(0, Math.min(100, s)),
    graph:    Math.max(0, Math.min(100, g)),
    agentic:  Math.max(0, Math.min(100, a)),
  };
}

/* ══════════════════════════════════════════════════════
   RECOMMENDATION METADATA
══════════════════════════════════════════════════════ */
const RAG_META = {
  standard: { label: "Standard Vector RAG", color: "#22c55e", dim: "#052e16", Icon: CheckCircle },
  graph:    { label: "Graph RAG",            color: "#a855f7", dim: "#2e1065", Icon: GitBranch  },
  agentic:  { label: "Agentic RAG",          color: "#f97316", dim: "#3b1a00", Icon: Cpu        },
};

function getDeployment(ragType, sensitivity) {
  const map = {
    standard: {
      low:      { label: "Fully Cloud",       color: "#3b82f6", Icon: Cloud,  desc: "OpenAI embeddings + Pinecone/Weaviate + GPT-4o/Claude. Fastest time to production with zero infrastructure ops." },
      moderate: { label: "Hybrid",             color: "#f59e0b", Icon: Layers, desc: "Embed locally (BGE-M3) → cloud vector store (Pinecone/Qdrant Cloud) → cloud LLM. Raw text never leaves perimeter." },
      high:     { label: "Fully Local",        color: "#22c55e", Icon: Server, desc: "Self-hosted embedding (BGE-M3/Ollama) + Qdrant (Docker) + local LLM (vLLM/Ollama). Air-gap compatible." },
    },
    graph: {
      low:      { label: "Cloud Graph",        color: "#a855f7", Icon: Cloud,  desc: "Neo4j AuraDB + Pinecone/Qdrant Cloud + GPT-4o for extraction and generation. Fully managed." },
      moderate: { label: "Cloud Graph",        color: "#a855f7", Icon: Cloud,  desc: "Neo4j AuraDB + cloud vector store. Consider local extraction if chunks are sensitive." },
      high:     { label: "Self-Hosted Graph",  color: "#22c55e", Icon: Server, desc: "Kuzu (embedded) or Neo4j (Docker) + local extraction pipeline + local LLM. High ops burden but full data control." },
    },
    agentic: {
      low:      { label: "Cloud Agentic",      color: "#f97316", Icon: Cloud,  desc: "LangGraph/LlamaIndex on ECS + Pinecone + GPT-4o/Claude with multi-provider failover. Full managed stack." },
      moderate: { label: "Hybrid Agentic",     color: "#f59e0b", Icon: Layers, desc: "Hybrid knowledge bases + cloud LLM APIs. Implement per-tool data classification to control egress." },
      high:     { label: "Hybrid Agentic",     color: "#f59e0b", Icon: Layers, desc: "Local orchestration (LangGraph) + local knowledge bases + cloud LLM. Carefully scope which tools can egress data." },
    },
  };
  return map[ragType][sensitivity];
}

function getReasons(ragType, answers) {
  const r = [];
  if (ragType === "standard") {
    if (answers.queryComplexity === "simple")        r.push("Simple factual queries are best served by a direct semantic retrieval pass — no orchestration overhead.");
    if (answers.retrievalStrategy === "known")       r.push("Predictable retrieval strategy means a fixed pipeline outperforms an adaptive agent loop.");
    if (answers.latency === "realtime")              r.push("Real-time latency (<2s) rules out agentic multi-step loops and is borderline for Graph RAG's 3–8s P50.");
    if (answers.queryCost === "minimize")            r.push("Single-LLM-call-per-query cost is predictable and low — the most economical option at scale.");
    if (answers.externalTools === "none")            r.push("Document-only retrieval doesn't require an agent loop to orchestrate external tools.");
    if (answers.crossRefDensity === "low")           r.push("Standalone documents are retrievable by semantic similarity alone — graph traversal adds cost without benefit.");
    if (answers.corpusChurn === "frequent")          r.push("High corpus churn makes graph re-indexing prohibitively expensive; vector re-embedding is the cheaper update path.");
  }
  if (ragType === "graph") {
    if (answers.crossRefDensity === "high")          r.push("Dense cross-references require graph traversal — high-k vector retrieval cannot reliably follow citation chains.");
    if (answers.relationshipImportance === "critical") r.push("Typed entity relationships (cites, overrules, operates, is-part-of) carry meaning that embeddings cannot represent.");
    if (answers.multiHop === "frequently")           r.push("Frequent multi-hop queries require following directed edges — ANN search finds semantically similar chunks, not structurally connected ones.");
    if (answers.corpusChurn === "rare")              r.push("Stable corpus amortizes the high indexing cost over time — the key economic precondition for Graph RAG.");
    if (answers.indexingCost !== "minimize")         r.push("Budget flexibility enables the entity extraction pipeline that Graph RAG requires at index time.");
    if (answers.latency !== "realtime")              r.push("Interactive or async latency tolerance accommodates Graph RAG's 3–8s P50 query time.");
  }
  if (ragType === "agentic") {
    if (answers.retrievalStrategy === "unknown")     r.push("Retrieval strategy is unknowable at design time — an agent that dynamically reasons about what to retrieve is the only viable architecture.");
    if (answers.externalTools === "regular")         r.push("Regular use of external tools (web, code, APIs) requires an orchestrated agent loop — standard RAG is document-only.");
    if (answers.queryComplexity === "complex")       r.push("Complex open-ended queries benefit from iterative self-correction loops that single-pass RAG cannot perform.");
    if (answers.latency === "async")                 r.push("Async latency tolerance makes multi-step agent loops viable without degrading user experience.");
    if (answers.queryCost !== "minimize")            r.push("Per-query budget flexibility is a prerequisite for agentic RAG's non-deterministic, multi-call cost profile.");
  }
  return r.slice(0, 5);
}

function getWarnings(ragType, answers) {
  const w = [];
  if (ragType === "graph") {
    if (answers.corpusChurn !== "rare")              w.push("Corpus churn conflict: Graph RAG re-indexing is expensive. Community detection must re-run on every update — plan for this operationally.");
    if (answers.indexingCost === "minimize")         w.push("Budget conflict: Your indexing cost constraint conflicts with Graph RAG. Entity extraction LLM calls cost 5–20× standard RAG indexing.");
    if (answers.latency === "realtime")              w.push("Latency conflict: Graph RAG's 3–8s P50 is incompatible with your real-time requirement. Evaluate carefully.");
  }
  if (ragType === "agentic") {
    if (answers.latency === "realtime")              w.push("Critical latency conflict: Agentic RAG's 8–45s P50 is fundamentally incompatible with a <2s SLA. Reconsider this choice.");
    if (answers.queryCost === "minimize")            w.push("Cost conflict: Agentic RAG's non-deterministic cost directly conflicts with your minimize-cost constraint. Hard token budgets and loop iteration limits are mandatory.");
    w.push("Hard requirement: implement per-query token budgets and max-iteration limits before any production deployment.");
  }
  if (ragType === "standard") {
    if (answers.multiHop === "frequently")           w.push("Multi-hop gap: Frequent multi-hop queries will reduce retrieval quality. Parent-child chunking and higher reranker top-k partially compensate, but Graph RAG scored close — test both.");
    if (answers.crossRefDensity === "high")          w.push("Cross-reference gap: High cross-reference density may reduce retrieval quality. Evaluate whether Graph RAG's precision improvement justifies the indexing cost for your use case.");
  }
  return w;
}

/* ══════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════ */
export default function RAGAdvisor() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});

  const totalSteps = STEPS.length;
  const currentStepData = STEPS[step];
  const stepQuestions = currentStepData?.questions ?? [];
  const stepAnswered = stepQuestions.every(q => answers[q.id] !== undefined);
  const onLastStep = step === totalSteps - 1;

  function handleAnswer(qId, val) {
    setAnswers(prev => ({ ...prev, [qId]: val }));
  }

  function handleNext() {
    if (onLastStep) setStep(totalSteps);
    else setStep(s => s + 1);
  }

  function handleBack() {
    setStep(s => Math.max(0, s - 1));
  }

  function handleReset() {
    setStep(0);
    setAnswers({});
  }

  /* Results page */
  if (step === totalSteps) {
    const scores = computeScores(answers);
    const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const [winnerKey, winnerScore] = ranked[0];
    const [secondKey, secondScore] = ranked[1];
    const gap = winnerScore - secondScore;
    const confidence = gap >= 15 ? "Strong Match" : gap >= 8 ? "Good Match" : "Close Call";
    const confColor = gap >= 15 ? "#22c55e" : gap >= 8 ? "#f59e0b" : "#f97316";
    const meta = RAG_META[winnerKey];
    const deployment = getDeployment(winnerKey, answers.dataSensitivity);
    const reasons = getReasons(winnerKey, answers);
    const warnings = getWarnings(winnerKey, answers);
    const DeployIcon = deployment.Icon;
    const WinIcon = meta.Icon;

    return (
      <div style={PAGE}>
        <Header />
        <div style={{ maxWidth: 620, margin: "0 auto" }}>

          {/* Recommendation hero */}
          <div style={{ background: meta.dim, border: `1.5px solid ${meta.color}40`, borderRadius: 12, padding: "20px 20px 16px", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
              <WinIcon size={20} style={{ color: meta.color }} />
              <span style={{ fontSize: 18, fontWeight: 800, color: meta.color, letterSpacing: "0.03em" }}>
                {meta.label}
              </span>
              <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: `${confColor}22`, color: confColor, border: `1px solid ${confColor}60`, letterSpacing: "0.1em" }}>
                {confidence.toUpperCase()}
              </span>
            </div>
            <div style={{ fontSize: 11, color: "#64748b", fontFamily: "system-ui", lineHeight: 1.6 }}>
              Based on your inputs, this is the highest-fit architecture for your use case.
              {gap < 8 && <span style={{ color: "#f97316" }}> Note: {RAG_META[secondKey].label} scored close — consider evaluating both.</span>}
            </div>
          </div>

          {/* Score bars */}
          <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10, padding: "14px 16px", marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12 }}>
              Fit Scores
            </div>
            {ranked.map(([key, score]) => {
              const m = RAG_META[key];
              return (
                <div key={key} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: key === winnerKey ? m.color : "#64748b", fontWeight: key === winnerKey ? 700 : 400 }}>{m.label}</span>
                    <span style={{ fontSize: 11, color: key === winnerKey ? m.color : "#64748b", fontFamily: "monospace", fontWeight: 700 }}>{score}</span>
                  </div>
                  <div style={{ height: 6, background: "#1e293b", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${score}%`, background: key === winnerKey ? m.color : "#334155", borderRadius: 3, transition: "width 0.6s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Deployment recommendation */}
          <div style={{ background: "#0f172a", border: `1px solid ${deployment.color}40`, borderRadius: 10, padding: "14px 16px", marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 10 }}>
              Recommended Deployment Paradigm
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <DeployIcon size={15} style={{ color: deployment.color }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: deployment.color }}>{deployment.label}</span>
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8", fontFamily: "system-ui", lineHeight: 1.6 }}>
              {deployment.desc}
            </div>
          </div>

          {/* Reasons */}
          {reasons.length > 0 && (
            <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10, padding: "14px 16px", marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 10 }}>
                Why This Architecture
              </div>
              {reasons.map((r, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
                  <CheckCircle size={12} style={{ color: meta.color, flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: 12, color: "#94a3b8", fontFamily: "system-ui", lineHeight: 1.6 }}>{r}</span>
                </div>
              ))}
            </div>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <div style={{ background: "#1a0f00", border: "1px solid #92400e40", borderRadius: 10, padding: "14px 16px", marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#92400e", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 10 }}>
                ⚠ Watch Out For
              </div>
              {warnings.map((w, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
                  <AlertTriangle size={12} style={{ color: "#f59e0b", flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: 12, color: "#92400e", fontFamily: "system-ui", lineHeight: 1.6 }}>{w}</span>
                </div>
              ))}
            </div>
          )}

          {/* Reference note */}
          <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10, padding: "12px 16px", marginBottom: 20 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <Info size={13} style={{ color: "#475569", flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 11, color: "#475569", fontFamily: "system-ui", lineHeight: 1.6 }}>
                Load the <strong style={{ color: "#64748b" }}>rag-architectures</strong> file to see the full stage-by-stage pipeline for your recommended architecture, including component choices and engineering notes.
              </span>
            </div>
          </div>

          {/* Reset */}
          <button onClick={handleReset} style={{ ...BTN_OUTLINE, width: "100%", justifyContent: "center" }}>
            <RotateCcw size={14} /> Start Over
          </button>
        </div>
      </div>
    );
  }

  /* Question steps */
  const progress = ((step) / totalSteps) * 100;

  return (
    <div style={PAGE}>
      <Header />
      <div style={{ maxWidth: 620, margin: "0 auto" }}>

        {/* Progress */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: "#475569", letterSpacing: "0.08em" }}>
              STEP {step + 1} OF {totalSteps} · {currentStepData.title.toUpperCase()}
            </span>
            <span style={{ fontSize: 11, color: "#334155" }}>{Math.round(progress)}%</span>
          </div>
          <div style={{ height: 3, background: "#1e293b", borderRadius: 2, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progress}%`, background: "#3b82f6", borderRadius: 2, transition: "width 0.3s ease" }} />
          </div>
        </div>

        {/* Step subtitle */}
        <div style={{ fontSize: 12, color: "#475569", fontFamily: "system-ui", marginBottom: 18, letterSpacing: "0.02em" }}>
          {currentStepData.subtitle}
        </div>

        {/* Questions */}
        {stepQuestions.map(q => (
          <div key={q.id} style={{ background: "#0f172a", border: "1px solid #1e2d42", borderRadius: 10, padding: "14px 16px", marginBottom: 12 }}>
            <div style={{ fontSize: 13, color: "#e2e8f0", marginBottom: 12, fontFamily: "system-ui", lineHeight: 1.5, fontWeight: 500 }}>
              {q.text}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {q.options.map(opt => {
                const selected = answers[q.id] === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleAnswer(q.id, opt.value)}
                    style={{
                      display: "flex", alignItems: "flex-start", gap: 10,
                      padding: "10px 12px", borderRadius: 7, cursor: "pointer", textAlign: "left",
                      border: `1.5px solid ${selected ? "#3b82f6" : "#1e293b"}`,
                      background: selected ? "#0c1a4e" : "#080f1a",
                      transition: "all 0.12s ease",
                    }}
                  >
                    <div style={{
                      width: 16, height: 16, borderRadius: "50%", flexShrink: 0, marginTop: 1,
                      border: `2px solid ${selected ? "#3b82f6" : "#334155"}`,
                      background: selected ? "#3b82f6" : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {selected && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />}
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: selected ? "#93c5fd" : "#cbd5e1", marginBottom: 2 }}>
                        {opt.label}
                      </div>
                      <div style={{ fontSize: 11, color: "#475569", fontFamily: "system-ui", lineHeight: 1.4 }}>
                        {opt.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Navigation */}
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          {step > 0 && (
            <button onClick={handleBack} style={BTN_OUTLINE}>
              <ChevronLeft size={15} /> Back
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!stepAnswered}
            style={{
              ...BTN_PRIMARY,
              flex: 1,
              opacity: stepAnswered ? 1 : 0.4,
              cursor: stepAnswered ? "pointer" : "not-allowed",
            }}
          >
            {onLastStep ? "Get Recommendation" : "Next"}
            <ChevronRight size={15} />
          </button>
        </div>

        <div style={{ fontSize: 10, color: "#334155", fontFamily: "system-ui", textAlign: "center", marginTop: 14, lineHeight: 1.5 }}>
          Answer all questions on this step to continue
        </div>
      </div>
    </div>
  );
}

/* ── Shared styles ── */
const PAGE = {
  background: "#080f1a", minHeight: "100vh", padding: "24px 16px 48px",
  fontFamily: "'SF Mono','Fira Code','Cascadia Code',monospace", color: "#cbd5e1",
};

const BTN_PRIMARY = {
  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
  padding: "11px 20px", borderRadius: 8, border: "none",
  background: "#1d4ed8", color: "#fff", fontWeight: 700, fontSize: 13,
  letterSpacing: "0.04em", fontFamily: "inherit",
};

const BTN_OUTLINE = {
  display: "flex", alignItems: "center", gap: 6,
  padding: "11px 16px", borderRadius: 8,
  border: "1.5px solid #1e293b", background: "#0f172a",
  color: "#64748b", fontWeight: 600, fontSize: 12,
  letterSpacing: "0.04em", cursor: "pointer", fontFamily: "inherit",
};

function Header() {
  return (
    <div style={{ textAlign: "center", marginBottom: 28 }}>
      <div style={{ fontSize: 10, letterSpacing: "0.2em", color: "#475569", textTransform: "uppercase", marginBottom: 5 }}>
        RAG Architecture Advisor
      </div>
      <h1 style={{ fontSize: 18, fontWeight: 700, color: "#f1f5f9", margin: 0, letterSpacing: "0.04em" }}>
        Find Your Optimal Architecture
      </h1>
      <div style={{ fontSize: 11, color: "#334155", marginTop: 6, fontFamily: "system-ui" }}>
        12 questions · Standard · Graph · Agentic
      </div>
    </div>
  );
}
