# CLAUDE.md — RAG Architecture Advisor

## Project Overview

A full-stack web application that helps engineers select the optimal RAG architecture
(Standard Vector, Graph, or Agentic) for their use case through a 12-question wizard.
Produces two complementary outputs: deterministic template-based analysis (instant) and
AI-generated reasoning via the Anthropic API (async). Designed to run locally during
development and deploy as a single service on Railway.

---

## Tech Stack

| Layer       | Choice               | Rationale                                                                 |
|-------------|----------------------|---------------------------------------------------------------------------|
| Frontend    | Vite + React         | CRA is abandoned by Meta. Vite is faster, actively maintained, better DX. |
| Backend     | FastAPI + Uvicorn    | Python-native; matches owner's background. One endpoint, minimal surface. |
| AI          | Anthropic API (claude-sonnet-4-6) | Sonnet-class model; sufficient for a reasoning paragraph. |
| Deployment  | Railway (single service) | FastAPI serves built Vite static files. One service, one config.    |
| Styling     | Inline styles (React) | Consistent with existing artifacts; no Tailwind compiler needed.        |

**Why not Express/Node backend:** Owner has Python background. FastAPI is faster to
iterate on, and the backend is intentionally minimal (one endpoint + static file serving).

**Why single Railway service:** FastAPI serves the built Vite `dist/` as static files
at `/`, and the API at `/api/*`. Avoids Railway multi-service CORS complexity, keeps
deployment surface minimal.

---

## Project Structure

```
rag-advisor/
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # Root component — imports and renders RAGAdvisor
│   │   ├── RAGAdvisor.jsx       # Main advisor component (wizard + results)
│   │   ├── components/
│   │   │   ├── QuestionStep.jsx # Renders a step's questions with radio options
│   │   │   ├── ResultsPage.jsx  # Results view: scores, recommendation, AI reasoning
│   │   │   ├── ScoreBar.jsx     # Animated horizontal score bar
│   │   │   └── AIReasoning.jsx  # Async panel: spinner → Claude-generated paragraph
│   │   ├── data/
│   │   │   ├── questions.js     # STEPS array: all 12 questions across 3 steps
│   │   │   └── scoring.js       # WEIGHTS, computeScores(), getReasons(), getWarnings()
│   │   ├── utils/
│   │   │   └── recommend.js     # getDeployment(), getConfidence(), rankScores()
│   │   └── styles/
│   │       └── tokens.js        # Shared style constants (colors, fonts, spacing)
│   ├── index.html
│   ├── vite.config.js           # Dev proxy: /api → localhost:8000
│   ├── package.json
│   └── .env                     # VITE_API_URL (dev only; not committed)
│
├── backend/
│   ├── main.py                  # FastAPI app: /api/analyze + static file serving
│   ├── prompt.py                # Builds the Anthropic API prompt from answers + scores
│   ├── models.py                # Pydantic request/response models
│   ├── requirements.txt         # fastapi, uvicorn, anthropic, python-dotenv
│   ├── static/                  # Populated by build step (Vite dist/ copied here)
│   └── .env                     # ANTHROPIC_API_KEY (never committed)
│
├── railway.json                 # Single-service Railway config
├── .gitignore                   # Excludes both .env files and static/
├── README.md                    # Setup and deployment instructions
└── CLAUDE.md                    # This file
```

---

## Architecture Decisions

### Dual Output Design (Template + AI)
The results page produces two complementary outputs that render independently:

1. **Deterministic Analysis** — renders instantly from the JS scoring engine.
   Contains: fit scores, confidence level, deployment recommendation, why-bullets,
   watch-out warnings. This output is always available, even if the API call fails.

2. **AI Reasoning** — renders asynchronously after the deterministic output.
   A single Claude-generated paragraph (2-3 sentences) that synthesizes the *specific
   combination* of answers into a nuanced narrative. Template bullets say **what**;
   AI reasoning says **why these inputs together point here**.

The AI panel renders a skeleton/spinner until the API responds. If the API fails,
it shows a graceful fallback ("AI reasoning unavailable") without affecting the rest
of the results page.

### Scoring Engine (Pure JS, Deterministic)
Located in `frontend/src/data/scoring.js`. Every architecture starts at score 50.
Each of the 12 answers applies additive weights to [standard, graph, agentic] scores.
Scores are clamped to [0, 100].

```js
// Weight format: [standard_delta, graph_delta, agentic_delta]
const WEIGHTS = {
  corpusChurn: {
    rare:     [0,  3,  0],   // Graph loves stable corpora
    frequent: [3, -3,  1],   // Graph penalized hard for churn
  },
  latency: {
    realtime: [3,  1, -4],   // Near-disqualifier for Agentic
    async:    [0,  1,  3],
  },
  // ... all 12 questions
};
```

Confidence level is derived from the gap between 1st and 2nd place:
- Gap ≥ 15 → "Strong Match"
- Gap 8–14 → "Good Match"
- Gap < 8  → "Close Call" (surfaces runner-up name in UI)

### API Privacy Boundary
The Anthropic API key lives **only in `backend/.env`** and never touches the frontend.
The React app calls `POST /api/analyze` on its own backend. In dev, Vite proxies
`/api/*` to `localhost:8000`. In production on Railway, both are served from the same
origin — no CORS needed.

### Railway Single-Service Strategy
Build step copies Vite `dist/` into `backend/static/`. FastAPI mounts static files at `/`
as a catch-all, with API routes registered first so they take priority.

```
Request to /api/analyze  →  FastAPI route handler
Request to /             →  FastAPI serves frontend/static/index.html
Request to /assets/*     →  FastAPI serves frontend/static/assets/*
```

---

## API Specification

### POST /api/analyze

**Request:**
```json
{
  "answers": {
    "corpusSize": "large",
    "corpusChurn": "rare",
    "crossRefDensity": "high",
    "relationshipImportance": "critical",
    "queryComplexity": "moderate",
    "multiHop": "frequently",
    "retrievalStrategy": "known",
    "externalTools": "none",
    "latency": "interactive",
    "indexingCost": "flexible",
    "queryCost": "moderate",
    "dataSensitivity": "high"
  },
  "recommendation": "graph",
  "scores": {
    "standard": 53,
    "graph": 78,
    "agentic": 51
  }
}
```

**Response:**
```json
{
  "reasoning": "string — 2-3 sentence paragraph from Claude"
}
```

**Error response:**
```json
{
  "reasoning": null,
  "error": "string"
}
```

The frontend treats a null `reasoning` field as a graceful degradation — shows fallback
text, does not throw an error to the user.

### GET /health
Returns `{"status": "ok"}`. Used by Railway healthcheck.

---

## Prompt Design (`backend/prompt.py`)

The prompt sent to Claude is built from the answers object + computed recommendation.
It is intentionally terse — the goal is one focused paragraph, not a full analysis.

```
System: You are a RAG architecture advisor. Be concise and technical.
        Respond with exactly 2-3 sentences. No lists, no headers.

User: A user completed a 12-question RAG architecture assessment.

Recommended architecture: {recommendation_label}
Fit scores: Standard {s}/100 · Graph {g}/100 · Agentic {a}/100

Their inputs:
- Corpus size: {value}
- Corpus churn: {value}
[... all 12 answers in plain English ...]

Write 2-3 sentences explaining why {recommendation_label} is the right architecture
for this specific combination of inputs. Be specific about which 2-3 factors drove
the recommendation and what the user should prioritize operationally.
```

Answer values are translated to plain English before insertion (e.g., `"rare"` → 
`"rarely (monthly or less)"`). This translation map lives in `prompt.py`.

---

## Design System

Consistent with the `rag-architectures` architecture viewer. Dark theme throughout.

```js
// tokens.js
export const COLORS = {
  bg:           "#080f1a",
  surface:      "#0f172a",
  border:       "#1e293b",
  borderActive: "#1e2d42",
  textPrimary:  "#f1f5f9",
  textSecondary:"#cbd5e1",
  textMuted:    "#64748b",
  textDim:      "#475569",

  // RAG type accents
  standard:     "#22c55e",
  graph:        "#a855f7",
  agentic:      "#f97316",

  // Deployment accents
  local:        "#22c55e",
  hybrid:       "#f59e0b",
  cloud:        "#3b82f6",

  // Status
  good:         "#22c55e",
  warning:      "#f59e0b",
  danger:       "#ef4444",
};

export const FONTS = {
  mono: "'SF Mono','Fira Code','Cascadia Code',monospace",
  sans: "system-ui, sans-serif",
};
```

All font sizes in px via inline styles. No Tailwind, no CSS modules.
Component labels in monospace. Descriptive/note text in system-ui sans-serif.

---

## Environment Variables

### `backend/.env`
```
ANTHROPIC_API_KEY=sk-ant-...
```

### `frontend/.env` (dev only, not needed in production)
```
VITE_API_URL=http://localhost:8000
```

Neither file is committed. Both are listed in `.gitignore`.

---

## Local Development

### Prerequisites
- Node.js 18+
- Python 3.11+
- pip

### First-time setup
```bash
# Frontend
cd frontend && npm install

# Backend
cd backend && pip install -r requirements.txt
cp .env.example .env   # then add ANTHROPIC_API_KEY
```

### Running locally (two terminals)
```bash
# Terminal 1 — backend
cd backend && uvicorn main:app --reload --port 8000

# Terminal 2 — frontend
cd frontend && npm run dev
```

Frontend runs on http://localhost:5173.
Vite proxies `/api/*` to `http://localhost:8000` (configured in `vite.config.js`).

### Optional: single-command start
```bash
# From project root (requires: npm install -g concurrently)
npm run dev
```
Root `package.json` runs both with `concurrently`.

---

## Railway Deployment

### `railway.json`
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "cd frontend && npm ci && npm run build && mkdir -p ../backend/static && cp -r dist/. ../backend/static/"
  },
  "deploy": {
    "startCommand": "cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT",
    "healthcheckPath": "/health",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

### Required Railway environment variable
Set in Railway dashboard → Service → Variables:
```
ANTHROPIC_API_KEY = sk-ant-...
```

### FastAPI static file mounting (in `main.py`)
```python
# API routes must be registered BEFORE static file mount
app.include_router(api_router, prefix="/api")

# Static files as catch-all — must be last
if os.path.exists("static"):
    app.mount("/", StaticFiles(directory="static", html=True), name="static")
```

`html=True` enables SPA fallback: any unmatched path returns `index.html`, which
lets React Router handle client-side navigation.

### Deployment checklist
- [ ] `ANTHROPIC_API_KEY` set in Railway dashboard
- [ ] `backend/static/` is in `.gitignore` (Railway build generates it)
- [ ] `frontend/.env` is in `.gitignore`
- [ ] `backend/.env` is in `.gitignore`
- [ ] `/health` endpoint returns 200

---

## Current State

### Built (exists in `rag-architectures.jsx` and `rag-advisor.jsx`)
- [x] 12-question wizard with 3 steps (Data, Query, Constraints)
- [x] Scoring engine with full weight matrix
- [x] Confidence level (Strong / Good / Close Call)
- [x] Deployment paradigm recommendation per RAG type × sensitivity
- [x] Template-based why-bullets and watch-out warnings
- [x] Results page with score bars

### Still to build
- [ ] Project scaffold (Vite frontend + FastAPI backend folder structure)
- [ ] Split monolithic `rag-advisor.jsx` into component files per structure above
- [ ] `backend/main.py` — FastAPI app with `/api/analyze` and `/health`
- [ ] `backend/prompt.py` — prompt builder with answer-to-plain-English translation
- [ ] `backend/models.py` — Pydantic models for request/response validation
- [ ] `backend/requirements.txt`
- [ ] `AIReasoning.jsx` — async panel with loading skeleton
- [ ] `vite.config.js` — proxy config for dev
- [ ] `railway.json`
- [ ] Root `package.json` with `concurrently` dev script
- [ ] `.gitignore`
- [ ] `README.md`

---

## Session Notes

- Owner has Python background; prefer Python patterns and idioms in backend code.
- Owner uses `CLAUDE.md` + `PROGRESS.md` for multi-session continuity.
  Create `PROGRESS.md` at project root to track completed vs. remaining tasks.
- All previous design decisions (scoring weights, question text, option values,
  color tokens) are considered finalized unless explicitly revisited.
- Do not change the scoring engine without documenting the change and rationale
  in the session notes below.

### Change log
| Date       | Change                              | Reason                         |
|------------|-------------------------------------|--------------------------------|
| 2025-05-13 | Initial CLAUDE.md created           | Project scaffolding session    |
| 2026-05-13 | Model `claude-sonnet-4-20250514` → `claude-sonnet-4-6` | Original ID retires 2026-06-15; per Anthropic migration guide, `claude-sonnet-4-6` is the drop-in replacement. |
| 2026-05-13 | Full project scaffold (frontend split + FastAPI backend) | Phase 1 build-out — see PROGRESS.md |
