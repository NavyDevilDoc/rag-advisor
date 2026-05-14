"""Prompt builder for /api/analyze.

The frontend already has the deterministic analysis (scores, why-bullets,
warnings). The LLM's only job is one focused paragraph that explains why
this specific combination of answers points where it points. Enum values
are translated to plain English before insertion so the model reads
natural language, not internal codes.
"""

from models import AnalyzeRequest, EvaluatePipelineRequest

SYSTEM_PROMPT = (
    "You are a RAG architecture advisor. Be concise and technical. "
    "Respond with exactly 2-3 sentences. No lists, no headers, no preamble."
)

EVAL_SYSTEM_PROMPT = (
    "You are a RAG pipeline engineer. Be concise, specific, and technical. "
    "Respond with 3-4 sentences. No lists, no headers, no preamble. "
    "Refer to specific pipeline stages by name."
)

RECOMMENDATION_LABEL = {
    "standard": "Standard Vector RAG",
    "graph": "Graph RAG",
    "agentic": "Agentic RAG",
}

ANSWER_PHRASING: dict[str, dict[str, str]] = {
    "corpusSize": {
        "small": "small (under 1M tokens)",
        "medium": "medium (1M–100M tokens)",
        "large": "large (100M+ tokens)",
    },
    "corpusChurn": {
        "rare": "rarely (monthly or less)",
        "regular": "regularly (weekly)",
        "frequent": "frequently (daily / continuous ingestion)",
    },
    "crossRefDensity": {
        "low": "low (mostly standalone documents)",
        "medium": "medium (some cross-references)",
        "high": "high (heavily cross-referenced)",
    },
    "relationshipImportance": {
        "none": "not important (semantic similarity is enough)",
        "some": "somewhat important",
        "critical": "critical (typed entity relationships are essential)",
    },
    "queryComplexity": {
        "simple": "simple (direct factual lookups)",
        "moderate": "moderate (synthesis across a few documents)",
        "complex": "complex (open-ended multi-step research)",
    },
    "multiHop": {
        "rarely": "rarely (answer lives in one or two chunks)",
        "sometimes": "sometimes (occasional chain-of-reference)",
        "frequently": "frequently (most answers connect multiple sources)",
    },
    "retrievalStrategy": {
        "known": "known at design time (same approach for every query)",
        "partial": "partially known (varies but bounded)",
        "unknown": "unknown (varies per query)",
    },
    "externalTools": {
        "none": "none (documents only)",
        "occasional": "occasional (sometimes web search or SQL)",
        "regular": "regular (web, code, APIs are core to the use case)",
    },
    "latency": {
        "realtime": "real-time (under 2 seconds)",
        "interactive": "interactive (2–8 seconds)",
        "async": "async OK (8+ seconds acceptable)",
    },
    "indexingCost": {
        "minimize": "minimize indexing spend",
        "moderate": "moderate (willing to invest for better retrieval)",
        "flexible": "flexible (cost is not a constraint)",
    },
    "queryCost": {
        "minimize": "minimize per-query cost",
        "moderate": "moderate (quality justifies cost)",
        "flexible": "flexible (quality over cost)",
    },
    "dataSensitivity": {
        "low": "low (public or internal non-sensitive)",
        "moderate": "moderate (some compliance concerns)",
        "high": "high (sensitive / classified / air-gap required)",
    },
}

QUESTION_LABELS = {
    "corpusSize": "Corpus size",
    "corpusChurn": "Corpus churn",
    "crossRefDensity": "Cross-reference density",
    "relationshipImportance": "Relationship importance",
    "queryComplexity": "Query complexity",
    "multiHop": "Multi-hop need",
    "retrievalStrategy": "Retrieval strategy known",
    "externalTools": "External tools needed",
    "latency": "Latency tolerance",
    "indexingCost": "Indexing cost tolerance",
    "queryCost": "Query cost tolerance",
    "dataSensitivity": "Data sensitivity",
}


def build_user_prompt(req: AnalyzeRequest) -> str:
    label = RECOMMENDATION_LABEL[req.recommendation]
    s = req.scores
    answers = req.answers.model_dump()

    lines = [
        f"- {QUESTION_LABELS[key]}: {ANSWER_PHRASING[key][answers[key]]}"
        for key in QUESTION_LABELS
    ]
    answers_block = "\n".join(lines)

    return (
        "A user completed a 12-question RAG architecture assessment.\n\n"
        f"Recommended architecture: {label}\n"
        f"Fit scores: Standard {s.standard}/100 · Graph {s.graph}/100 · "
        f"Agentic {s.agentic}/100\n\n"
        f"Their inputs:\n{answers_block}\n\n"
        f"Write 2-3 sentences explaining why {label} is the right architecture "
        "for this specific combination of inputs. Be specific about which 2-3 "
        "factors drove the recommendation and what the user should prioritize "
        "operationally."
    )


# One canonical pipeline description per pipeline key. Backend owns these
# (rather than receiving them from the frontend) so requests stay small and
# the LLM is grounded in a single source of truth.
PIPELINE_SUMMARIES: dict[str, str] = {
    "local": (
        "Fully Local pipeline (13 stages): filesystem watchers / local Airflow → "
        "PyMuPDF + Unstructured + Tesseract OCR → Python cleaning + spaCy → "
        "LangChain parent-child chunking → BGE-M3 embedding on local GPU → "
        "Qdrant (Docker) + rank_bm25 → RRF fusion → BGE-Reranker-v2-m3 → "
        "Ollama / vLLM with Llama 3.1 or Qwen2.5 or Mistral → optional QLoRA "
        "fine-tuning → FastAPI + nginx → Langfuse + Prometheus + Grafana. "
        "Air-gap capable, zero per-token cost, owner handles all ops."
    ),
    "hybrid": (
        "Hybrid pipeline (13 stages): local watchdog + cloud object-store triggers → "
        "local Unstructured / PyMuPDF parsing → local cleaning → local chunking → "
        "local BGE-M3 embedding (only float32 vectors egress) → "
        "Pinecone Serverless / Qdrant Cloud → local rank_bm25 or Elastic Cloud → "
        "cloud ANN + local RRF merge → local or Cohere reranking → "
        "cloud LLM (GPT-4o / Claude) → optional local QLoRA → SageMaker endpoint → "
        "local FastAPI internal + cloud API Gateway external → "
        "Langfuse local + Grafana Cloud aggregate metrics. "
        "Privacy perimeter held locally; scale from cloud."
    ),
    "cloud": (
        "Fully Cloud pipeline (13 stages): S3 / GCS / Blob + Lambda + MWAA → "
        "AWS Textract / Azure Document Intelligence → Lambda cleaning → "
        "Lambda fan-out chunking → OpenAI text-embedding-3-large or Cohere embed-v3 → "
        "Pinecone / Weaviate Cloud → OpenSearch Serverless → ECS RRF → "
        "Cohere Rerank API → GPT-4o / Claude Sonnet / Gemini with multi-provider "
        "failover → optional OpenAI fine-tune or SageMaker JumpStart → "
        "FastAPI on ECS + API Gateway + CloudFront → "
        "LangSmith / Arize Phoenix / DataDog with mandatory spend alerting. "
        "Zero hardware ops, infinite scale ceiling."
    ),
    "graph": (
        "Graph RAG pipeline (18 stages, dual-index): standard ingestion → "
        "sentence-aligned structure-aware chunking → LLM entity & relationship "
        "extraction (GPT-4o / Claude or fine-tuned GLiNER) → embedding-similarity "
        "entity resolution → Neo4j AuraDB / Amazon Neptune / Kuzu graph "
        "construction → Leiden community detection → LLM community summarization → "
        "embedding both chunk text and node descriptions → Neo4j graph + "
        "Pinecone vector dual store → LLM query classification (local vs global) → "
        "graph traversal + community summary lookup → cross-encoder reranking "
        "across mixed result types → 2–3 LLM-call generation. "
        "Indexing cost is 5–20× standard RAG; dual-index sync is the ongoing burden."
    ),
    "agentic": (
        "Agentic RAG pipeline (17 stages, dynamic): heterogeneous source connectors → "
        "standard parsing / cleaning / chunking / embedding per knowledge base → "
        "multiple vector stores as named tools → JSON-schema tool registry → "
        "LangGraph / LlamaIndex / AutoGen orchestration layer → LLM query planner "
        "and decomposer → tool execution loop with iteration limit and per-query "
        "token budget → mixed retrieval (ANN / BM25 / web search / SQL) determined "
        "per loop → self-critique / CRAG corrective step → Redis hot state + "
        "Postgres conversation store + tool result cache → multi-provider LLM "
        "generation with failover → optional fine-tuned router / critic models → "
        "FastAPI on ECS with WebSocket / SSE streaming → per-step distributed "
        "tracing in LangSmith / Arize. Cost non-deterministic; hard iteration "
        "and token limits mandatory."
    ),
}


def build_evaluation_prompt(req: EvaluatePipelineRequest) -> str:
    label = RECOMMENDATION_LABEL[req.recommendation]
    pipeline_summary = PIPELINE_SUMMARIES[req.pipeline_key]
    answers = req.answers.model_dump()

    lines = [
        f"- {QUESTION_LABELS[key]}: {ANSWER_PHRASING[key][answers[key]]}"
        for key in QUESTION_LABELS
    ]
    answers_block = "\n".join(lines)

    return (
        f"A user was recommended {label} based on a 12-question assessment.\n\n"
        f"Their inputs:\n{answers_block}\n\n"
        f"The canonical pipeline for {label}:\n{pipeline_summary}\n\n"
        "Write 3-4 sentences evaluating how well THIS specific pipeline fits "
        "THESE specific inputs. Be concrete: name 1-2 specific stages (by name) "
        "that will require the most operational attention given their constraints, "
        "and name 1 stage they could consider skipping, simplifying, or deferring "
        "if their requirements allow. Reference stage names verbatim."
    )
