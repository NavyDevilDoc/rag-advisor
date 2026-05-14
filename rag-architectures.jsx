import { useState } from "react";
import { Server, Cloud, Layers, CheckCircle, AlertTriangle, XCircle, FlaskConical, GitBranch, Cpu } from "lucide-react";

/* ─── Location badges (deployment paradigm tabs) ─── */
const LOC = {
  local: { label: "LOCAL",         bg: "#052e16", color: "#86efac", border: "#16a34a" },
  cloud: { label: "CLOUD",         bg: "#0c1a4e", color: "#93c5fd", border: "#3b82f6" },
  mixed: { label: "LOCAL → CLOUD", bg: "#3b1a00", color: "#fcd34d", border: "#d97706" },
};

/* ─── Delta badges (graph / agentic tabs — relative to standard vector RAG) ─── */
const DELTA = {
  standard: { label: "STANDARD", bg: "#1e293b", color: "#64748b",  border: "#334155" },
  modified: { label: "MODIFIED",  bg: "#0c1a4e", color: "#93c5fd",  border: "#3b82f6" },
  new:      { label: "NEW STAGE", bg: "#2e1065", color: "#c4b5fd",  border: "#7c3aed" },
};

/* ══════════════════════════════════════════════════════════════
   ARCHITECTURE DATA
══════════════════════════════════════════════════════════════ */
const ARCHS = {

  /* ── 1. FULLY LOCAL ── */
  local: {
    label: "Fully Local", sublabel: "Air-gap capable · Zero egress · Own all ops",
    Icon: Server, accent: "#22c55e", glow: "#22c55e18", badgeMode: "loc",
    stages: [
      { name: "Source Connectors",    loc: "local", comp: "watchdog · local Airflow / Prefect", note: "Filesystem watchers for hot-folder ingestion; cron-scheduled DAGs; zero external connectivity required." },
      { name: "Document Parsing",     loc: "local", comp: "PyMuPDF · Unstructured (Docker) · Tesseract OCR", note: "Unstructured preserves document hierarchy; Tesseract for scanned PDFs; all parsing on-machine." },
      { name: "Cleaning & Metadata",  loc: "local", comp: "Custom Python pipeline · spaCy NLP", note: "Rule-based noise removal (headers, footers, watermarks); spaCy for metadata NER extraction." },
      { name: "Chunking Strategy",    loc: "local", comp: "LangChain RecursiveTextSplitter · parent-child chunker", note: "Parent-child: small chunks (128–256t) for precise retrieval, large parent (512–1024t) sent to LLM." },
      { name: "Embedding",            loc: "local", comp: "BGE-M3 · nomic-embed-text · sentence-transformers / Ollama", note: "GPU preferred (CUDA); CPU viable under ~1M chunks. Asymmetric embed (query vs. doc) for retrieval quality lift." },
      { name: "Vector Store",         loc: "local", comp: "Qdrant (Docker)  ·  pgvector on local Postgres", note: "Qdrant for high-performance HNSW + filtering; pgvector if SQL joins on metadata are needed." },
      { name: "Sparse / BM25 Index",  loc: "local", comp: "rank_bm25  ·  local Elasticsearch (Docker)", note: "rank_bm25 for lean setups; Elasticsearch when full-text search and analytics are both needed." },
      { name: "Retrieval & Fusion",   loc: "local", comp: "Custom Python RRF merge (dense + sparse)", note: "Reciprocal Rank Fusion across ANN and BM25 result sets before passing to reranker." },
      { name: "Reranking",            loc: "local", comp: "BGE-Reranker-v2-m3  ·  ms-marco-MiniLM", note: "Cross-encoder via sentence-transformers; GPU gives <300ms at top-50. Rerank to top-5 for generation." },
      { name: "LLM Generation",       loc: "local", comp: "Ollama (Llama 3.1 / Qwen2.5 / Mistral)  ·  vLLM server", note: "vLLM for production throughput (continuous batching); Ollama for dev or small-team deployments." },
      { name: "Fine-Tuning",          loc: "local", comp: "QLoRA via Unsloth / HuggingFace PEFT  ·  GGUF quantization", optional: true, note: "LoRA adapters keep base model frozen; train on domain corpus locally. Quantize to GGUF for CPU inference fallback." },
      { name: "API & Serving",        loc: "local", comp: "FastAPI + Uvicorn  ·  nginx reverse proxy", note: "Async Python stack; nginx for TLS termination, load balancing, and static asset serving." },
      { name: "Monitoring & Eval",    loc: "local", comp: "Langfuse (Docker)  ·  Prometheus + Grafana", note: "Full RAGAS eval suite runs locally; Prometheus scrapes FastAPI /metrics; Grafana for latency / cost dashboards." },
    ],
    summary: {
      good: "Zero per-token inference cost. Full data sovereignty. Air-gap and SCIF-compatible.",
      bad:  "You own hardware, uptime, upgrades, and backups. Re-indexing a large corpus on CPU is painfully slow.",
      ugly: "GPU VRAM is the hard ceiling. A 7B model needs 8–16 GB; a 70B model needs multi-GPU or heavy quantization. Underspec and the whole pipeline crawls.",
    },
  },

  /* ── 2. HYBRID ── */
  hybrid: {
    label: "Hybrid", sublabel: "Privacy perimeter local · Scale from cloud · Best of both",
    Icon: Layers, accent: "#f59e0b", glow: "#f59e0b18", badgeMode: "loc",
    stages: [
      { name: "Source Connectors",    loc: "mixed", comp: "Local watchdog  +  S3 / Azure Blob / GCS event triggers", note: "On-prem docs via filesystem watcher; cloud-originated docs via object-store put events. Two ingestion paths, one pipeline." },
      { name: "Document Parsing",     loc: "local", comp: "Unstructured (local)  ·  PyMuPDF (local)", note: "CRITICAL BOUNDARY: raw text never leaves the perimeter. Parse locally regardless of where the source doc lives." },
      { name: "Cleaning & Metadata",  loc: "local", comp: "Custom Python (local)", note: "Cleaning is cheap CPU work — no justification to send raw text to cloud for this step." },
      { name: "Chunking Strategy",    loc: "local", comp: "Local LangChain / custom parent-child chunker", note: "Chunks stay local until embedded. Vectors carry far less re-identification risk than raw text." },
      { name: "Embedding",            loc: "local", comp: "BGE-M3 (local)  →  float32 vectors egress to cloud", note: "KEY DESIGN DECISION: embed locally so only vectors leave the perimeter — not text. This is the core privacy trade." },
      { name: "Vector Store",         loc: "cloud", comp: "Pinecone Serverless  ·  Qdrant Cloud  ·  Supabase pgvector", note: "Vectors only — no raw text in cloud vector store. Raw document store and chunk store remain on-prem." },
      { name: "Sparse / BM25 Index",  loc: "mixed", comp: "Local rank_bm25  OR  Elastic Cloud", note: "Local BM25 = max privacy (chunks never leave). Elastic Cloud = less ops burden but chunk text may egress." },
      { name: "Retrieval & Fusion",   loc: "mixed", comp: "Cloud ANN lookup  →  local RRF merge", note: "Vector search hits cloud; fusion logic runs locally before reranking. Chunks referenced by ID, not sent to cloud." },
      { name: "Reranking",            loc: "mixed", comp: "Local BGE-Reranker  OR  Cohere Rerank API", note: "Local reranking = chunks never leave perimeter. Cohere Rerank = lower ops burden but chunk text egresses." },
      { name: "LLM Generation",       loc: "cloud", comp: "OpenAI GPT-4o  ·  Anthropic Claude  ·  fine-tuned on SageMaker", note: "Only top-k reranked chunks sent to cloud LLM — minimize data exposure surface area per query." },
      { name: "Fine-Tuning",          loc: "mixed", comp: "Local QLoRA train  →  export weights  →  SageMaker / Cloud Run endpoint", optional: true, note: "Train on sensitive local data; export adapter weights; serve from cloud for scale. Weights are low-risk to egress." },
      { name: "API & Serving",        loc: "mixed", comp: "Local FastAPI (internal)  +  cloud API Gateway (external)", note: "Internal users hit local endpoint; public-facing traffic proxied through cloud gateway with WAF and auth." },
      { name: "Monitoring & Eval",    loc: "mixed", comp: "Langfuse (local)  +  Grafana Cloud / DataDog (aggregate metrics)", note: "Sensitive query traces stay local; latency and cost metrics exported to cloud dashboard without raw content." },
    ],
    summary: {
      good: "Data privacy maintained via local embedding — raw text never leaves the perimeter. Cloud provides scale for vector search and LLM without the GPU burden.",
      bad:  "Two infrastructure environments to operate and keep in sync. Schema changes in the vector store require coordinated updates on both sides.",
      ugly: "The privacy guarantee lives and dies by operational discipline. One misconfigured cloud parse call or cloud reranking step and raw text leaves — often silently.",
    },
  },

  /* ── 3. FULLY CLOUD ── */
  cloud: {
    label: "Fully Cloud", sublabel: "Zero hardware ops · Infinite scale · Fastest time-to-production",
    Icon: Cloud, accent: "#3b82f6", glow: "#3b82f618", badgeMode: "loc",
    stages: [
      { name: "Source Connectors",    loc: "cloud", comp: "S3 / GCS / Blob + Lambda / Cloud Functions  ·  MWAA · Prefect Cloud", note: "Event-driven on object-store writes; managed Airflow for complex multi-step ingestion DAGs." },
      { name: "Document Parsing",     loc: "cloud", comp: "AWS Textract  ·  Azure Document Intelligence  ·  Unstructured.io API", note: "Managed OCR + structure parsing; pay-per-page; parallelizes to thousands of documents trivially." },
      { name: "Cleaning & Metadata",  loc: "cloud", comp: "Lambda / Cloud Run (containerized functions)", note: "Serverless cleaning functions auto-scale to zero between ingestion runs; no idle cost." },
      { name: "Chunking Strategy",    loc: "cloud", comp: "Lambda / Cloud Run  ·  fan-out pattern per document", note: "Stateless, embarrassingly parallel; one function invocation per document shard." },
      { name: "Embedding",            loc: "cloud", comp: "OpenAI text-embedding-3-large  ·  Cohere embed-v3", note: "Use asymmetric input types (query vs. document) — measurable retrieval quality improvement over symmetric." },
      { name: "Vector Store",         loc: "cloud", comp: "Pinecone  ·  Weaviate Cloud  ·  Qdrant Cloud  ·  Neon pgvector", note: "Pinecone for operational simplicity at scale; Weaviate if native hybrid search is a priority." },
      { name: "Sparse / BM25 Index",  loc: "cloud", comp: "Elastic Cloud  ·  OpenSearch Serverless (AWS)", note: "OpenSearch Serverless auto-scales with query volume; no cluster provisioning or shard management." },
      { name: "Retrieval & Fusion",   loc: "cloud", comp: "App tier on ECS / Cloud Run  ·  API Gateway for RRF merge", note: "RRF merge in application tier; all compute in cloud; horizontally scalable by default." },
      { name: "Reranking",            loc: "cloud", comp: "Cohere Rerank API  ·  BGE-Reranker on SageMaker endpoint", note: "Cohere for simplicity; SageMaker endpoint when per-call volume makes API pricing expensive." },
      { name: "LLM Generation",       loc: "cloud", comp: "GPT-4o  ·  Claude Sonnet  ·  Gemini  ·  Bedrock models", note: "Multi-provider failover is strongly recommended for resilience. Streaming via API; structured output for citations." },
      { name: "Fine-Tuning",          loc: "cloud", comp: "OpenAI fine-tune API  ·  AWS Bedrock  ·  SageMaker JumpStart  ·  Vertex AI", optional: true, note: "OpenAI fine-tune API is the simplest entry point; SageMaker / Vertex for open-model fine-tuning with full weight control." },
      { name: "API & Serving",        loc: "cloud", comp: "FastAPI on ECS  ·  API Gateway  ·  CloudFront CDN", note: "CDN for global latency; WAF for security; blue/green deployments and auto-scaling built in." },
      { name: "Monitoring & Eval",    loc: "cloud", comp: "LangSmith  ·  Arize Phoenix  ·  DataDog  ·  cloud-native logging", note: "Full distributed tracing across all pipeline stages; RAGAS eval suite scheduled on cloud infra; spend alerting mandatory." },
    ],
    summary: {
      good: "Zero hardware ops. Infinite scale ceiling. Multi-region redundancy available out of the box. Fastest path from prototype to production.",
      bad:  "Per-token and per-query costs compound hard at scale. Vendor lock-in is real — migrating a large Pinecone index is painful.",
      ugly: "A missing spend alert at scale can mean a five-figure surprise bill in 24 hours. Hard budget caps and cost anomaly detection are not nice-to-haves — they are table stakes.",
    },
  },

  /* ── 4. GRAPH RAG ── */
  graph: {
    label: "Graph RAG", sublabel: "Entity-graph index · Multi-hop retrieval · Community summaries",
    Icon: GitBranch, accent: "#a855f7", glow: "#a855f718", badgeMode: "delta",
    stages: [
      { name: "Source Connectors",                delta: "standard", comp: "S3 / GCS / Blob + Lambda · MWAA · Prefect Cloud", note: "Same as standard RAG. Prefer stable, low-churn corpora — graph re-indexing on document updates is expensive." },
      { name: "Document Parsing",                 delta: "standard", comp: "AWS Textract · Azure Document Intelligence · Unstructured.io API", note: "Same as standard RAG. Structure preservation (sections, headers) is more important here — it directly feeds entity extraction quality." },
      { name: "Cleaning & Metadata",              delta: "standard", comp: "Lambda / Cloud Run pipeline", note: "Standard cleaning. Entity-rich metadata (author, date, doc type) becomes node properties in the graph." },
      { name: "Chunking Strategy",                delta: "modified", comp: "Sentence-aligned chunker · structure-aware splitter", note: "MODIFIED: Chunks are smaller and sentence-aligned to improve entity extraction precision. Parent-child still applies; extraction runs at the child chunk level." },
      { name: "Entity & Relationship Extraction", delta: "new",      comp: "GPT-4o / Claude (LLM extraction)  ·  GLiNER (fine-tuned NER)  ·  spaCy", note: "NEW: Most expensive indexing step. LLM extracts (entity, type, relationship, entity) triples from each chunk. Fine-tuned GLiNER replaces LLM calls at ~80% quality for ~10% cost." },
      { name: "Entity Resolution",                delta: "new",      comp: "Embedding similarity + RapidFuzz · custom resolver", note: "NEW: 'USS Nimitz', 'CVN-68', 'Nimitz' → one canonical node. Resolution errors compound — missed merges fragment the graph; false merges corrupt it." },
      { name: "Graph Construction",               delta: "new",      comp: "Neo4j AuraDB  ·  Amazon Neptune  ·  Kuzu (embedded/single-node)", note: "NEW: Nodes (entities), typed directed edges (relationships), and properties stored in graph DB. Each source chunk is also stored as a node linked to its entities." },
      { name: "Community Detection",              delta: "new",      comp: "Leiden algorithm  ·  Louvain (networkx / graspologic)", note: "NEW: Partitions entity graph into thematic clusters. Leiden preferred over Louvain for partition stability. Must re-run on affected subgraph when documents are added." },
      { name: "Community Summarization",          delta: "new",      comp: "LLM summarizer (GPT-4o / Claude) per community cluster", note: "NEW: Each community cluster gets an LLM-generated prose summary — the global search targets. Community count × token cost = significant ongoing indexing expense." },
      { name: "Embedding (Nodes + Chunks)",       delta: "modified", comp: "OpenAI text-embedding-3-large  ·  Cohere embed-v3", note: "MODIFIED: Embed both chunk text AND entity node descriptions for hybrid graph+vector search. Two embedding passes vs. one in standard RAG." },
      { name: "Graph Store + Vector Store",       delta: "new",      comp: "Neo4j AuraDB (graph)  +  Pinecone / Qdrant Cloud (vector)", note: "NEW: Dual-index architecture. Both stores must remain in sync on document updates — the primary ongoing operational burden of Graph RAG." },
      { name: "Query Classification",             delta: "new",      comp: "LLM classifier  ·  rule-based router", note: "NEW: Determines whether query is local (entity-anchored, high precision) or global (thematic, community-summary-based) and routes to the appropriate search path." },
      { name: "Local / Global Search",            delta: "new",      comp: "Graph traversal (local)  ·  community summary lookup (global)  ·  ANN (hybrid)", note: "NEW: Local search follows typed entity edges from query anchors. Global search retrieves relevant community summaries. Both paths may be combined with a final synthesis step." },
      { name: "Reranking",                        delta: "modified", comp: "Cohere Rerank API  ·  BGE-Reranker on SageMaker", note: "MODIFIED: Reranks across mixed result types — traversed chunks and community summaries. Cross-encoder must handle variable-length inputs gracefully." },
      { name: "LLM Generation",                   delta: "modified", comp: "GPT-4o  ·  Claude Sonnet  ·  Gemini", note: "MODIFIED: Global search queries require synthesizing across multiple community summaries before final generation — 2–3 LLM calls vs. 1 in standard RAG." },
      { name: "Fine-Tuning",                      delta: "modified", optional: true, comp: "GLiNER domain fine-tune (extraction)  ·  domain-adapted embedding model", note: "MODIFIED: Fine-tuning targets the extraction layer, not the generation LLM. A domain-tuned GLiNER cuts indexing LLM call volume by 70–80%. Highest ROI for large, stable corpora." },
      { name: "API & Serving",                    delta: "standard", comp: "FastAPI on ECS  ·  API Gateway  ·  CloudFront", note: "Standard serving layer. Query latency is higher than standard RAG (3–8s P50) — set client timeout and UX expectations accordingly." },
      { name: "Monitoring & Eval",                delta: "modified", comp: "LangSmith  ·  Arize Phoenix  ·  custom graph health metrics", note: "MODIFIED: Add graph-specific metrics: entity resolution quality, community coherence scores, graph coverage per query. Standard RAGAS metrics still apply." },
    ],
    summary: {
      good: "Structurally relational queries answered correctly that standard RAG fundamentally cannot handle. Multi-hop traversal follows typed edges, not semantic similarity. The entity graph improves in value as the corpus grows.",
      bad:  "Indexing cost is 5–20× standard RAG. Entity resolution at scale is an unsolved operational problem. Dual-index sync is a continuous maintenance burden.",
      ugly: "Graph schema changes require reprocessing the entire corpus. High-churn corpora make community detection a perpetual background job. At very large scale, cross-shard graph traversal can be slower than a well-tuned single-node instance.",
    },
  },

  /* ── 5. AGENTIC RAG ── */
  agentic: {
    label: "Agentic RAG", sublabel: "LLM-directed retrieval · Tool loop · Adaptive reasoning",
    Icon: Cpu, accent: "#f97316", glow: "#f9731618", badgeMode: "delta",
    stages: [
      { name: "Source Connectors",               delta: "modified", comp: "S3 / GCS / Blob + Lambda · MWAA · multiple source adapters", note: "MODIFIED: Agentic systems index multiple heterogeneous knowledge bases, each with its own connector. Each source becomes a distinct tool the agent can invoke." },
      { name: "Document Parsing",                delta: "standard", comp: "AWS Textract  ·  Unstructured.io API", note: "Standard per knowledge base. Multiple corpora may use different parsers; run in parallel ingestion pipelines." },
      { name: "Cleaning & Metadata",             delta: "standard", comp: "Lambda / Cloud Run pipeline", note: "Standard. Metadata quality is especially important — agents use source type and recency metadata for tool routing decisions." },
      { name: "Chunking Strategy",               delta: "standard", comp: "LangChain / custom chunker  ·  parent-child pattern", note: "Standard chunking. Each backing knowledge base may be tuned to a different optimal chunk size independently." },
      { name: "Embedding",                       delta: "standard", comp: "OpenAI text-embedding-3-large  ·  Cohere embed-v3", note: "Standard. One shared embedding model may serve all knowledge bases, or domain-specific models per source." },
      { name: "Vector Store(s)",                 delta: "modified", comp: "Pinecone / Qdrant Cloud / pgvector  ·  one or more instances", note: "MODIFIED: Agentic systems may maintain multiple separate vector stores — one per knowledge domain — that the agent selects between as distinct named tools." },
      { name: "Tool Registry",                   delta: "new",      comp: "Tool definitions (JSON schema)  ·  function signatures  ·  tool descriptions", note: "NEW: Defines all capabilities available to the agent: vector search, web search, SQL query, calculator, code interpreter, API calls. Tool descriptions are critical — poor wording causes wrong tool selection." },
      { name: "Agent Orchestration Layer",       delta: "new",      comp: "LangGraph  ·  LlamaIndex Workflows  ·  AutoGen  ·  custom ReAct loop", note: "NEW: Manages the reasoning loop, tool dispatch, state between steps, loop termination, and error handling. LangGraph for complex multi-agent workflows; custom ReAct for simpler single-agent." },
      { name: "Query Planning / Decomposition",  delta: "new",      comp: "LLM planner (GPT-4o / Claude)  ·  task decomposer", note: "NEW: LLM breaks complex queries into sub-tasks and determines which tools to invoke in what order. Quality of this step is the primary determinant of overall answer quality." },
      { name: "Tool Execution Loop",             delta: "new",      comp: "Tool dispatcher  ·  async executor  ·  retry handler  ·  loop limiter", note: "NEW: Iterative — the agent may call 3–15 tools across multiple loops. Hard iteration limits and per-query token budgets must be enforced here to prevent runaway cost." },
      { name: "Retrieval (within loop)",         delta: "modified", comp: "ANN search  ·  BM25  ·  web search (Tavily / Brave)  ·  SQL query", note: "MODIFIED: Retrieval is one of many possible tool calls, not a fixed pipeline step. Query formulation, source selection, and top-k are determined dynamically by the agent each iteration." },
      { name: "Response Evaluation / Self-Critique", delta: "new", comp: "LLM critic (self-RAG pattern)  ·  CRAG corrective step  ·  confidence scorer", note: "NEW: Agent evaluates retrieved content quality and decides to accept, refine the query, or retrieve again. This loop is where quality gains come from — and where cost can spiral without bounds." },
      { name: "State & Memory Management",       delta: "new",      comp: "Redis (hot state)  ·  Postgres / DynamoDB (conversation store)  ·  tool result cache", note: "NEW: Full agent state (reasoning trace, tool results, history) persists across loop iterations. Tool result caching by input hash cuts redundant LLM calls by 30–40%." },
      { name: "LLM Generation",                  delta: "modified", comp: "GPT-4o  ·  Claude Sonnet  ·  Gemini  ·  multi-provider failover", note: "MODIFIED: Generation occurs at the end of the agent loop with the full reasoning trace in context — not after a single retrieval pass. Multi-provider failover is critical; failed runs at the last step are expensive." },
      { name: "Fine-Tuning",                     delta: "modified", optional: true, comp: "Fine-tuned router / critic model  ·  small tool-calling model (7B)", note: "MODIFIED: Fine-tuning targets routing and critique steps, not the generation LLM. A fine-tuned 7B router + fine-tuned critic replaces large-model calls for those steps, cutting per-loop cost significantly." },
      { name: "API & Serving",                   delta: "modified", comp: "FastAPI on ECS  ·  WebSocket / SSE for streaming  ·  API Gateway", note: "MODIFIED: Streaming via WebSocket or SSE is essential — 8–45s P50 latency makes a blocking response unusable. Stream reasoning traces to the client as the agent works." },
      { name: "Monitoring & Eval",               delta: "modified", comp: "LangSmith  ·  Arize Phoenix  ·  DataDog  ·  per-step distributed tracing", note: "MODIFIED: Must trace token usage, tool call sequences, loop counts, and failure modes per step across every run. Without this, debugging production failures is guesswork. Log storage costs are significant at scale." },
    ],
    summary: {
      good: "Handles queries where the retrieval strategy is unknowable at design time. Self-correction loops catch retrieval failures that standard RAG silently passes through.",
      bad:  "Per-query cost is non-deterministic and can be 10–50× standard RAG. Latency is high and variable (8–45s P50). Full distributed tracing is required infrastructure, not optional.",
      ugly: "A poorly bounded agent loop with no token budget or iteration limit is a cost time bomb. At scale, one runaway query pattern can spike API spend faster than any alert can catch it.",
    },
  },
};

/* ══════════════════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════════════════ */
export default function RAGArchitectures() {
  const [tab, setTab] = useState("local");
  const arch = ARCHS[tab];
  const TabIcon = arch.Icon;

  return (
    <div style={{
      background: "#080f1a", minHeight: "100vh", padding: "24px 16px 48px",
      fontFamily: "'SF Mono','Fira Code','Cascadia Code',monospace", color: "#cbd5e1",
    }}>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        <div style={{ fontSize: "10px", letterSpacing: "0.2em", color: "#475569", textTransform: "uppercase", marginBottom: "5px" }}>
          Production RAG · All Paradigms
        </div>
        <h1 style={{ fontSize: "18px", fontWeight: "700", color: "#f1f5f9", margin: 0, letterSpacing: "0.04em" }}>
          Architecture Comparison
        </h1>
      </div>

      {/* Tabs split into two rows */}
      <div style={{ maxWidth: "660px", margin: "0 auto 24px" }}>
        <div style={{ fontSize: "9px", letterSpacing: "0.15em", color: "#334155", textTransform: "uppercase", marginBottom: "6px" }}>
          Deployment Paradigm
        </div>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "12px" }}>
          {["local","hybrid","cloud"].map(key => <TabBtn key={key} id={key} tab={tab} setTab={setTab} />)}
        </div>
        <div style={{ fontSize: "9px", letterSpacing: "0.15em", color: "#334155", textTransform: "uppercase", marginBottom: "6px" }}>
          Pipeline Paradigm
        </div>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {["graph","agentic"].map(key => <TabBtn key={key} id={key} tab={tab} setTab={setTab} />)}
        </div>
      </div>

      {/* Paradigm subtitle */}
      <div style={{ textAlign: "center", marginBottom: "18px" }}>
        <TabIcon size={14} style={{ color: arch.accent, display: "inline", verticalAlign: "middle", marginRight: "6px" }} />
        <span style={{ fontSize: "12px", color: arch.accent, letterSpacing: "0.07em" }}>{arch.sublabel}</span>
      </div>

      {/* Delta legend for graph/agentic */}
      {arch.badgeMode === "delta" && (
        <div style={{ maxWidth: "660px", margin: "0 auto 16px", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: "9px", color: "#475569", letterSpacing: "0.1em" }}>VS STANDARD RAG →</span>
          {Object.values(DELTA).map(b => (
            <span key={b.label} style={{ fontSize: "9px", fontWeight: "700", padding: "2px 8px", borderRadius: "4px", background: b.bg, color: b.color, border: `1px solid ${b.border}`, letterSpacing: "0.07em" }}>
              {b.label}
            </span>
          ))}
        </div>
      )}

      {/* Pipeline */}
      <div style={{ maxWidth: "660px", margin: "0 auto" }}>
        {arch.stages.map((stage, i) => {
          const isLast = i === arch.stages.length - 1;
          const badge = arch.badgeMode === "loc" ? LOC[stage.loc] : DELTA[stage.delta];
          return (
            <div key={i} style={{ display: "flex", gap: "10px" }}>
              {/* Spine */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "28px", flexShrink: 0 }}>
                <div style={{
                  width: "26px", height: "26px", borderRadius: "50%",
                  background: stage.optional ? "transparent" : `${arch.accent}18`,
                  border: `1.5px solid ${stage.optional ? "#334155" : arch.accent}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "10px", fontWeight: "800",
                  color: stage.optional ? "#475569" : arch.accent, flexShrink: 0,
                }}>
                  {i + 1}
                </div>
                {!isLast && <div style={{ width: "1.5px", flex: 1, background: `${arch.accent}28`, minHeight: "12px" }} />}
              </div>

              {/* Card */}
              <div style={{
                flex: 1, background: "#0f172a",
                border: `1px solid ${stage.optional ? "#1e293b" : "#1e2d42"}`,
                borderRadius: "9px", padding: "11px 14px", marginBottom: "8px",
                opacity: stage.optional ? 0.85 : 1,
              }}>
                {/* Stage name + badges */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "7px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "10px", fontWeight: "700", color: "#64748b", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    {stage.name}
                  </span>
                  <span style={{ fontSize: "9px", fontWeight: "700", padding: "2px 7px", borderRadius: "4px", background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`, letterSpacing: "0.07em", whiteSpace: "nowrap" }}>
                    {badge.label}
                  </span>
                  {stage.optional && (
                    <span style={{ fontSize: "9px", fontWeight: "700", padding: "2px 7px", borderRadius: "4px", background: "#1a1040", color: "#a78bfa", border: "1px solid #7c3aed", letterSpacing: "0.07em", display: "flex", alignItems: "center", gap: "3px" }}>
                      <FlaskConical size={9} /> OPTIONAL
                    </span>
                  )}
                </div>
                {/* Component */}
                <div style={{ fontSize: "12px", color: "#e2e8f0", marginBottom: "7px", lineHeight: "1.6", wordBreak: "break-word" }}>
                  {stage.comp}
                </div>
                {/* Note */}
                <div style={{ fontSize: "11px", color: "#475569", lineHeight: "1.6", fontFamily: "system-ui, sans-serif" }}>
                  {stage.note}
                </div>
              </div>
            </div>
          );
        })}

        {/* Good · Bad · Ugly */}
        <div style={{ background: "#0f172a", border: `1px solid ${arch.accent}40`, borderRadius: "10px", padding: "16px", marginTop: "8px" }}>
          <div style={{ fontSize: "10px", fontWeight: "800", color: arch.accent, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "14px" }}>
            ◆ Good · Bad · Ugly
          </div>
          {[
            { label: "GOOD", text: arch.summary.good, color: "#22c55e", Icon: CheckCircle },
            { label: "BAD",  text: arch.summary.bad,  color: "#f59e0b", Icon: AlertTriangle },
            { label: "UGLY", text: arch.summary.ugly, color: "#ef4444", Icon: XCircle },
          ].map(({ label, text, color, Icon: SIcon }) => (
            <div key={label} style={{ display: "flex", gap: "9px", marginBottom: "12px", alignItems: "flex-start" }}>
              <SIcon size={13} style={{ color, flexShrink: 0, marginTop: "1px" }} />
              <div style={{ fontFamily: "system-ui, sans-serif" }}>
                <span style={{ fontSize: "10px", fontWeight: "800", color, letterSpacing: "0.1em" }}>{label}: </span>
                <span style={{ fontSize: "12px", color: "#94a3b8", lineHeight: "1.6" }}>{text}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: "14px", justifyContent: "center", marginTop: "18px", flexWrap: "wrap" }}>
          {arch.badgeMode === "loc"
            ? Object.values(LOC).map(b   => <LegendDot key={b.label} color={b.border} label={b.label} />)
            : Object.values(DELTA).map(b => <LegendDot key={b.label} color={b.border} label={b.label} />)
          }
          <LegendDot color="#7c3aed" label="OPTIONAL STAGE" />
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ── */
function TabBtn({ id, tab, setTab }) {
  const a = ARCHS[id];
  const TIcon = a.Icon;
  const active = tab === id;
  return (
    <button onClick={() => setTab(id)} style={{
      display: "flex", alignItems: "center", gap: "6px",
      padding: "8px 14px", borderRadius: "7px", cursor: "pointer",
      border: `1.5px solid ${active ? a.accent : "#1e293b"}`,
      background: active ? a.glow : "#0f172a",
      color: active ? a.accent : "#475569",
      fontWeight: active ? "700" : "400",
      fontSize: "11px", letterSpacing: "0.06em",
      transition: "all 0.15s ease", fontFamily: "inherit",
    }}>
      <TIcon size={12} />
      {a.label.toUpperCase()}
    </button>
  );
}

function LegendDot({ color, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
      <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: color }} />
      <span style={{ fontSize: "9px", color: "#475569", letterSpacing: "0.08em" }}>{label}</span>
    </div>
  );
}
