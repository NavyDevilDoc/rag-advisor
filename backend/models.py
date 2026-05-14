from typing import Literal, Optional

from pydantic import BaseModel, Field

# Restricting each field to the same enum values the frontend uses
# (see frontend/src/data/scoring.js) keeps the API honest — an unknown
# value fails Pydantic validation rather than reaching the LLM.
CorpusSize = Literal["small", "medium", "large"]
CorpusChurn = Literal["rare", "regular", "frequent"]
CrossRefDensity = Literal["low", "medium", "high"]
RelationshipImportance = Literal["none", "some", "critical"]
QueryComplexity = Literal["simple", "moderate", "complex"]
MultiHop = Literal["rarely", "sometimes", "frequently"]
RetrievalStrategy = Literal["known", "partial", "unknown"]
ExternalTools = Literal["none", "occasional", "regular"]
Latency = Literal["realtime", "interactive", "async"]
IndexingCost = Literal["minimize", "moderate", "flexible"]
QueryCost = Literal["minimize", "moderate", "flexible"]
DataSensitivity = Literal["low", "moderate", "high"]

Recommendation = Literal["standard", "graph", "agentic"]
PipelineKey = Literal["local", "hybrid", "cloud", "graph", "agentic"]


class Answers(BaseModel):
    corpusSize: CorpusSize
    corpusChurn: CorpusChurn
    crossRefDensity: CrossRefDensity
    relationshipImportance: RelationshipImportance
    queryComplexity: QueryComplexity
    multiHop: MultiHop
    retrievalStrategy: RetrievalStrategy
    externalTools: ExternalTools
    latency: Latency
    indexingCost: IndexingCost
    queryCost: QueryCost
    dataSensitivity: DataSensitivity


class Scores(BaseModel):
    standard: int = Field(ge=0, le=100)
    graph: int = Field(ge=0, le=100)
    agentic: int = Field(ge=0, le=100)


class AnalyzeRequest(BaseModel):
    answers: Answers
    recommendation: Recommendation
    scores: Scores


class AnalyzeResponse(BaseModel):
    reasoning: Optional[str] = None
    error: Optional[str] = None


class EvaluatePipelineRequest(BaseModel):
    answers: Answers
    recommendation: Recommendation
    scores: Scores
    pipeline_key: PipelineKey


class EvaluatePipelineResponse(BaseModel):
    reasoning: Optional[str] = None
    error: Optional[str] = None
