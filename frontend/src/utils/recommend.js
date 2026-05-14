import { CheckCircle, GitBranch, Cpu, Server, Layers, Cloud } from "lucide-react";

export const RAG_META = {
  standard: { label: "Standard Vector RAG", color: "#22c55e", dim: "#052e16", Icon: CheckCircle },
  graph:    { label: "Graph RAG",           color: "#a855f7", dim: "#2e1065", Icon: GitBranch  },
  agentic:  { label: "Agentic RAG",         color: "#f97316", dim: "#3b1a00", Icon: Cpu        },
};

const DEPLOYMENTS = {
  standard: {
    low:      { label: "Fully Cloud",      color: "#3b82f6", Icon: Cloud,  desc: "OpenAI embeddings + Pinecone/Weaviate + GPT-4o/Claude. Fastest time to production with zero infrastructure ops." },
    moderate: { label: "Hybrid",           color: "#f59e0b", Icon: Layers, desc: "Embed locally (BGE-M3) → cloud vector store (Pinecone/Qdrant Cloud) → cloud LLM. Raw text never leaves perimeter." },
    high:     { label: "Fully Local",      color: "#22c55e", Icon: Server, desc: "Self-hosted embedding (BGE-M3/Ollama) + Qdrant (Docker) + local LLM (vLLM/Ollama). Air-gap compatible." },
  },
  graph: {
    low:      { label: "Cloud Graph",      color: "#a855f7", Icon: Cloud,  desc: "Neo4j AuraDB + Pinecone/Qdrant Cloud + GPT-4o for extraction and generation. Fully managed." },
    moderate: { label: "Cloud Graph",      color: "#a855f7", Icon: Cloud,  desc: "Neo4j AuraDB + cloud vector store. Consider local extraction if chunks are sensitive." },
    high:     { label: "Self-Hosted Graph",color: "#22c55e", Icon: Server, desc: "Kuzu (embedded) or Neo4j (Docker) + local extraction pipeline + local LLM. High ops burden but full data control." },
  },
  agentic: {
    low:      { label: "Cloud Agentic",    color: "#f97316", Icon: Cloud,  desc: "LangGraph/LlamaIndex on ECS + Pinecone + GPT-4o/Claude with multi-provider failover. Full managed stack." },
    moderate: { label: "Hybrid Agentic",   color: "#f59e0b", Icon: Layers, desc: "Hybrid knowledge bases + cloud LLM APIs. Implement per-tool data classification to control egress." },
    high:     { label: "Hybrid Agentic",   color: "#f59e0b", Icon: Layers, desc: "Local orchestration (LangGraph) + local knowledge bases + cloud LLM. Carefully scope which tools can egress data." },
  },
};

export function getDeployment(ragType, sensitivity) {
  return DEPLOYMENTS[ragType][sensitivity];
}

// Maps the advisor's recommendation + sensitivity to a pipeline key in
// frontend/src/data/pipelines.js. The 3 standard tiers split by sensitivity;
// graph and agentic map straight through.
export function getPipelineKey(ragType, sensitivity) {
  if (ragType === "standard") {
    if (sensitivity === "high") return "local";
    if (sensitivity === "moderate") return "hybrid";
    return "cloud";
  }
  return ragType;
}

export function rankScores(scores) {
  return Object.entries(scores).sort(([, a], [, b]) => b - a);
}

export function getConfidence(ranked) {
  const [, winnerScore] = ranked[0];
  const [, secondScore] = ranked[1];
  const gap = winnerScore - secondScore;
  if (gap >= 15) return { label: "Strong Match", color: "#22c55e", gap };
  if (gap >= 8)  return { label: "Good Match",   color: "#f59e0b", gap };
  return            { label: "Close Call",      color: "#f97316", gap };
}
