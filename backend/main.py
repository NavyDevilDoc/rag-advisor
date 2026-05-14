import hashlib
import json
import logging
import os
from collections import OrderedDict
from pathlib import Path
from typing import Optional

import httpx
from anthropic import APIError, AsyncAnthropic, AuthenticationError
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from starlette.exceptions import HTTPException as StarletteHTTPException

from models import (
    AnalyzeRequest,
    AnalyzeResponse,
    EvaluatePipelineRequest,
    EvaluatePipelineResponse,
    FeedbackRequest,
    FeedbackResponse,
)
from prompt import (
    EVAL_SYSTEM_PROMPT,
    SYSTEM_PROMPT,
    build_evaluation_prompt,
    build_user_prompt,
)

load_dotenv()

logger = logging.getLogger("rag_advisor")
logging.basicConfig(level=logging.INFO)

MODEL = "claude-sonnet-4-6"


# ───── In-memory LRU caches for the two LLM endpoints ─────
# Same answers → same canonical hash → cached response. First share-link
# visitor pays the LLM cost; every subsequent viewer of the same payload
# returns in milliseconds for free. Process-local; restart clears. Fine at
# this scale — when persistence is needed (Phase 5+), swap for Redis.
_CACHE_MAX = 1024
_analyze_cache: "OrderedDict[str, str]" = OrderedDict()
_eval_cache: "OrderedDict[str, str]" = OrderedDict()


def _cache_key(payload: BaseModel) -> str:
    """SHA-256 over the request body's canonical JSON form. Stable across
    equivalent payloads (sorted keys) so semantically-identical requests
    collapse to one cache entry."""
    canonical = json.dumps(payload.model_dump(), sort_keys=True)
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def _cache_get(cache: "OrderedDict[str, str]", key: str) -> Optional[str]:
    if key in cache:
        cache.move_to_end(key)  # LRU bump
        return cache[key]
    return None


def _cache_set(cache: "OrderedDict[str, str]", key: str, value: str) -> None:
    cache[key] = value
    cache.move_to_end(key)
    while len(cache) > _CACHE_MAX:
        cache.popitem(last=False)


def get_real_ip(request: Request) -> str:
    # Behind Railway's proxy the real client IP arrives in X-Forwarded-For;
    # request.client.host is the proxy. Fall back to the direct address for
    # local dev where there's no proxy.
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


limiter = Limiter(key_func=get_real_ip)

app = FastAPI(title="RAG Architecture Advisor")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

anthropic_client = AsyncAnthropic()  # reads ANTHROPIC_API_KEY from env


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/analyze", response_model=AnalyzeResponse)
@limiter.limit("20/hour")
async def analyze(request: Request, req: AnalyzeRequest) -> AnalyzeResponse:
    key = _cache_key(req)
    cached = _cache_get(_analyze_cache, key)
    if cached is not None:
        return AnalyzeResponse(reasoning=cached)

    user_prompt = build_user_prompt(req)
    try:
        response = await anthropic_client.messages.create(
            model=MODEL,
            max_tokens=400,
            system=SYSTEM_PROMPT,
            thinking={"type": "disabled"},
            output_config={"effort": "low"},
            messages=[{"role": "user", "content": user_prompt}],
        )
    except AuthenticationError:
        logger.error("Anthropic auth failed — check ANTHROPIC_API_KEY")
        return AnalyzeResponse(error="auth_failed")
    except APIError as exc:
        logger.warning("Anthropic API error: %s", exc)
        return AnalyzeResponse(error="upstream_error")

    parts = [block.text for block in response.content if block.type == "text"]
    reasoning = " ".join(parts).strip()
    if not reasoning:
        return AnalyzeResponse(error="empty_response")
    _cache_set(_analyze_cache, key, reasoning)
    return AnalyzeResponse(reasoning=reasoning)


@app.post("/api/evaluate-pipeline", response_model=EvaluatePipelineResponse)
@limiter.limit("20/hour")
async def evaluate_pipeline(
    request: Request, req: EvaluatePipelineRequest
) -> EvaluatePipelineResponse:
    key = _cache_key(req)
    cached = _cache_get(_eval_cache, key)
    if cached is not None:
        return EvaluatePipelineResponse(reasoning=cached)

    user_prompt = build_evaluation_prompt(req)
    try:
        response = await anthropic_client.messages.create(
            model=MODEL,
            max_tokens=500,
            system=EVAL_SYSTEM_PROMPT,
            thinking={"type": "disabled"},
            output_config={"effort": "low"},
            messages=[{"role": "user", "content": user_prompt}],
        )
    except AuthenticationError:
        logger.error("Anthropic auth failed — check ANTHROPIC_API_KEY")
        return EvaluatePipelineResponse(error="auth_failed")
    except APIError as exc:
        logger.warning("Anthropic API error (evaluate-pipeline): %s", exc)
        return EvaluatePipelineResponse(error="upstream_error")

    parts = [block.text for block in response.content if block.type == "text"]
    reasoning = " ".join(parts).strip()
    if not reasoning:
        return EvaluatePipelineResponse(error="empty_response")
    _cache_set(_eval_cache, key, reasoning)
    return EvaluatePipelineResponse(reasoning=reasoning)


@app.post("/api/feedback", response_model=FeedbackResponse)
@limiter.limit("10/hour")
async def submit_feedback(
    request: Request, req: FeedbackRequest
) -> FeedbackResponse:
    # Always log to stdout so the owner sees feedback in the Railway dashboard.
    thumb = "👍" if req.helpful else "👎"
    rec = req.recommendation or "?"
    conf = req.confidence or "?"
    comment_part = f' "{req.comment}"' if req.comment else ""
    logger.info("Feedback: %s — %s (%s confidence)%s", thumb, rec, conf, comment_part)

    # Optionally forward to a Discord webhook for push notifications.
    webhook = os.environ.get("FEEDBACK_DISCORD_WEBHOOK_URL")
    if webhook:
        payload = {
            "content": (
                f"{thumb} **{rec}** ({conf} confidence)"
                + (f"\n> {req.comment}" if req.comment else "")
            )
        }
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                await client.post(webhook, json=payload)
        except httpx.HTTPError as exc:
            logger.warning("Discord webhook failed: %s", exc)
            # Don't surface the webhook failure to the user — log capture worked.

    return FeedbackResponse(ok=True)


class SPAStaticFiles(StaticFiles):
    """StaticFiles that falls back to index.html for any unmatched path.

    Starlette's built-in `html=True` only serves index.html at the directory
    root — it returns 404 for arbitrary client-side routes like `/methodology`.
    For an SPA, we want the React bundle to load on any non-API path and let
    the client decide what to render.
    """

    async def get_response(self, path: str, scope):
        try:
            return await super().get_response(path, scope)
        except StarletteHTTPException as ex:
            if ex.status_code == 404:
                return await super().get_response("index.html", scope)
            raise


# Static file mount must be registered AFTER the API routes so /api/*
# takes priority. Subclassed StaticFiles makes /methodology, /privacy, etc.
# all return index.html so the React app can route on the client.
STATIC_DIR = Path(__file__).parent / "static"
if STATIC_DIR.exists():
    app.mount("/", SPAStaticFiles(directory=STATIC_DIR, html=True), name="static")
