# RAG Architecture Advisor

A 12-question wizard that recommends the optimal RAG architecture
(Standard Vector / Graph / Agentic) for a given use case, with deployment
paradigm guidance and AI-generated reasoning from the Anthropic API.

## Stack

- **Frontend:** Vite + React 18, inline styles, lucide-react icons
- **Backend:** FastAPI + Uvicorn, Anthropic Python SDK
- **Deploy:** Railway single service (FastAPI serves built Vite static files)

See [CLAUDE.md](CLAUDE.md) for full architecture details and design rationale.
See [PROGRESS.md](PROGRESS.md) for build status.

## Prerequisites

- Node.js 18+
- Python 3.11+
- [uv](https://docs.astral.sh/uv/) — fast Python package/project manager
- An Anthropic API key

## First-time setup

```bash
# Frontend
cd frontend
npm install
cp .env.example .env   # optional in dev; Vite proxy handles /api/*

# Backend
cd ../backend
uv venv                            # creates .venv/
uv pip install -r requirements.txt # installs into .venv/
cp .env.example .env
# then edit backend/.env and set ANTHROPIC_API_KEY=sk-ant-...
```

## Running locally

Two terminals:

```bash
# Terminal 1 — backend on :8000
cd backend
.venv/Scripts/uvicorn main:app --reload --port 8000   # Windows
# .venv/bin/uvicorn main:app --reload --port 8000      # macOS/Linux

# Terminal 2 — frontend on :5173
cd frontend
npm run dev
```

Or one terminal (from project root):

```bash
npm install        # installs concurrently once
npm run dev        # runs both
```

`npm run dev` invokes the venv's `uvicorn` directly so you don't need to
activate the venv manually. (The dev script is Windows-pathed; if you move
to macOS/Linux, switch `.venv/Scripts/` → `.venv/bin/` in `package.json`,
or add a minimal `pyproject.toml` so `uv run uvicorn ...` works on every OS.)

Vite dev server proxies `/api/*` to `http://localhost:8000`, so the frontend code
can call `fetch('/api/analyze', ...)` without worrying about CORS.

## Project structure

See [CLAUDE.md § Project Structure](CLAUDE.md#project-structure) for the canonical
tree and per-file responsibilities.

## Deploy to Railway

1. Push to GitHub and connect the repo to Railway.
2. In the Railway service settings, add the environment variable:
   `ANTHROPIC_API_KEY=sk-ant-...`
3. Railway uses [railway.json](railway.json) — single service, FastAPI serves
   built frontend at `/` and API at `/api/*`. Healthcheck on `/health`.
