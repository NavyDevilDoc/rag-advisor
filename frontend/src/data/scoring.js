/*
 * Scoring engine. Pure functions, no React.
 *
 * Each architecture starts at 50. Per-answer weights are additive across
 * [standard, graph, agentic]. Final scores clamped to [0, 100].
 *
 * dataSensitivity is intentionally all-zeros for scoring — it drives the
 * deployment paradigm choice in utils/recommend.js, not the architecture fit.
 */

export const WEIGHTS = {
  corpusSize:             { small:  [2,-1, 0], medium:    [1, 1, 1], large:     [ 0, 2, 1] },
  corpusChurn:            { rare:   [0, 3, 0], regular:   [1, 0, 1], frequent:  [ 3,-3, 1] },
  crossRefDensity:        { low:    [3,-1, 0], medium:    [1, 2, 0], high:      [-2, 4, 0] },
  relationshipImportance: { none:   [2,-1, 0], some:      [1, 2, 0], critical:  [-2, 4, 0] },
  queryComplexity:        { simple: [3, 1,-2], moderate:  [2, 1, 1], complex:   [-1, 1, 3] },
  multiHop:               { rarely: [2, 1, 0], sometimes: [0, 2, 1], frequently:[-2, 3, 2] },
  retrievalStrategy:      { known:  [3, 1,-2], partial:   [1, 1, 2], unknown:   [-2, 0, 4] },
  externalTools:          { none:   [2, 1,-1], occasional:[1, 0, 2], regular:   [-1, 0, 4] },
  latency:                { realtime:[3, 1,-4], interactive:[2, 2,-1], async:   [ 0, 1, 3] },
  indexingCost:           { minimize:[2,-3, 0], moderate: [1, 1, 0], flexible:  [ 0, 3, 1] },
  queryCost:              { minimize:[3, 1,-4], moderate: [2, 1, 0], flexible:  [ 0, 0, 3] },
  dataSensitivity:        { low:    [0, 0, 0], moderate:  [0, 0, 0], high:      [ 0, 0, 0] },
};

const clamp = (n) => Math.max(0, Math.min(100, n));

export function computeScores(answers) {
  let s = 50, g = 50, a = 50;
  for (const [id, val] of Object.entries(answers)) {
    const w = WEIGHTS[id]?.[val];
    if (w) { s += w[0]; g += w[1]; a += w[2]; }
  }
  return { standard: clamp(s), graph: clamp(g), agentic: clamp(a) };
}

export function getReasons(ragType, answers) {
  const r = [];
  if (ragType === "standard") {
    if (answers.queryComplexity === "simple")          r.push("Simple factual queries are best served by a direct semantic retrieval pass — no orchestration overhead.");
    if (answers.retrievalStrategy === "known")         r.push("Predictable retrieval strategy means a fixed pipeline outperforms an adaptive agent loop.");
    if (answers.latency === "realtime")                r.push("Real-time latency (<2s) rules out agentic multi-step loops and is borderline for Graph RAG's 3–8s P50.");
    if (answers.queryCost === "minimize")              r.push("Single-LLM-call-per-query cost is predictable and low — the most economical option at scale.");
    if (answers.externalTools === "none")              r.push("Document-only retrieval doesn't require an agent loop to orchestrate external tools.");
    if (answers.crossRefDensity === "low")             r.push("Standalone documents are retrievable by semantic similarity alone — graph traversal adds cost without benefit.");
    if (answers.corpusChurn === "frequent")            r.push("High corpus churn makes graph re-indexing prohibitively expensive; vector re-embedding is the cheaper update path.");
  }
  if (ragType === "graph") {
    if (answers.crossRefDensity === "high")            r.push("Dense cross-references require graph traversal — high-k vector retrieval cannot reliably follow citation chains.");
    if (answers.relationshipImportance === "critical") r.push("Typed entity relationships (cites, overrules, operates, is-part-of) carry meaning that embeddings cannot represent.");
    if (answers.multiHop === "frequently")             r.push("Frequent multi-hop queries require following directed edges — ANN search finds semantically similar chunks, not structurally connected ones.");
    if (answers.corpusChurn === "rare")                r.push("Stable corpus amortizes the high indexing cost over time — the key economic precondition for Graph RAG.");
    if (answers.indexingCost !== "minimize")           r.push("Budget flexibility enables the entity extraction pipeline that Graph RAG requires at index time.");
    if (answers.latency !== "realtime")                r.push("Interactive or async latency tolerance accommodates Graph RAG's 3–8s P50 query time.");
  }
  if (ragType === "agentic") {
    if (answers.retrievalStrategy === "unknown")       r.push("Retrieval strategy is unknowable at design time — an agent that dynamically reasons about what to retrieve is the only viable architecture.");
    if (answers.externalTools === "regular")           r.push("Regular use of external tools (web, code, APIs) requires an orchestrated agent loop — standard RAG is document-only.");
    if (answers.queryComplexity === "complex")         r.push("Complex open-ended queries benefit from iterative self-correction loops that single-pass RAG cannot perform.");
    if (answers.latency === "async")                   r.push("Async latency tolerance makes multi-step agent loops viable without degrading user experience.");
    if (answers.queryCost !== "minimize")              r.push("Per-query budget flexibility is a prerequisite for agentic RAG's non-deterministic, multi-call cost profile.");
  }
  return r.slice(0, 5);
}

export function getWarnings(ragType, answers) {
  const w = [];
  if (ragType === "graph") {
    if (answers.corpusChurn !== "rare")    w.push("Corpus churn conflict: Graph RAG re-indexing is expensive. Community detection must re-run on every update — plan for this operationally.");
    if (answers.indexingCost === "minimize") w.push("Budget conflict: Your indexing cost constraint conflicts with Graph RAG. Entity extraction LLM calls cost 5–20× standard RAG indexing.");
    if (answers.latency === "realtime")    w.push("Latency conflict: Graph RAG's 3–8s P50 is incompatible with your real-time requirement. Evaluate carefully.");
  }
  if (ragType === "agentic") {
    if (answers.latency === "realtime")    w.push("Critical latency conflict: Agentic RAG's 8–45s P50 is fundamentally incompatible with a <2s SLA. Reconsider this choice.");
    if (answers.queryCost === "minimize")  w.push("Cost conflict: Agentic RAG's non-deterministic cost directly conflicts with your minimize-cost constraint. Hard token budgets and loop iteration limits are mandatory.");
    w.push("Hard requirement: implement per-query token budgets and max-iteration limits before any production deployment.");
  }
  if (ragType === "standard") {
    if (answers.multiHop === "frequently")   w.push("Multi-hop gap: Frequent multi-hop queries will reduce retrieval quality. Parent-child chunking and higher reranker top-k partially compensate, but Graph RAG scored close — test both.");
    if (answers.crossRefDensity === "high")  w.push("Cross-reference gap: High cross-reference density may reduce retrieval quality. Evaluate whether Graph RAG's precision improvement justifies the indexing cost for your use case.");
  }
  return w;
}
