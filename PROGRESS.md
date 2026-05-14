# PROGRESS.md — RAG Architecture Advisor

Status snapshot + session log. Three companion documents:
- **[CLAUDE.md](CLAUDE.md)** — stable architecture, design rationale, frozen decisions
- **[IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)** — detailed task tree for upcoming work, decision log
- **PROGRESS.md** (this file) — what's done, what's in flight, session-by-session log

---

## Status snapshot

**Phase 1 — Scaffolding & component split:** ✅ complete (2026-05-13)
**Phase 2 — Local end-to-end run:** ✅ complete (2026-05-13)
**Phase 3 — Polish + stretch features:** ✅ complete (2026-05-13)
**Phase 4 — COA 1: Public deploy + polish:** 🔨 ready for launch (4.12)
- Sprint 1 ✅ (4.1 deploy, 4.3 brand basics, 4.6 localStorage, 4.7 share link)
- Sprint 2A ✅ (4.4 landing, 4.5 methodology, + SPA fallback fix)
- Sprint 2B ✅ (4.8 print-to-PDF, 4.9 analytics scaffolding, 4.10 feedback, 4.11 privacy/terms)
- Owner-owned: 4.2 custom domain, 4.12 launch decision (Show HN + cross-posts)
**Phase 5 — COA 2: Accounts + Save + Share + Export:** ⏸ conditional on traction
**Phase 6 — COA 3: Cost calculator + Vendor DB + Code scaffolds:** ⏸ conditional on Phase 5 paying customers

**Strategic ceiling:** COA 3. COA 4 (marketplace + consulting network) explicitly ruled out — owner doesn't have the capacity for a full company-shaped build.

See [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) for the detailed task tree on Phase 4 and high-level sketches of Phases 5–6.

---

## Phase 1 — Scaffolding & component split ✅

### Root
- [x] `.gitignore`
- [x] `PROGRESS.md`
- [x] `README.md`
- [x] Root `package.json` (concurrently dev script)
- [x] `railway.json`

### Frontend (`frontend/`)
- [x] `package.json` (Vite + React 18 + lucide-react)
- [x] `vite.config.js` (proxy `/api` → `localhost:8000`)
- [x] `index.html`
- [x] `.env.example`
- [x] `src/main.jsx` (React 18 root)
- [x] `src/App.jsx`
- [x] `src/RAGAdvisor.jsx` (wizard state + step navigation)
- [x] `src/styles/tokens.js` (COLORS, FONTS, BTN/PAGE)
- [x] `src/data/questions.js` (STEPS)
- [x] `src/data/scoring.js` (WEIGHTS, computeScores, getReasons, getWarnings)
- [x] `src/utils/recommend.js` (RAG_META, getDeployment, getConfidence, rankScores)
- [x] `src/components/QuestionStep.jsx`
- [x] `src/components/ResultsPage.jsx`
- [x] `src/components/ScoreBar.jsx`
- [x] `src/components/AIReasoning.jsx`

### Backend (`backend/`)
- [x] `requirements.txt` (fastapi, uvicorn, anthropic ≥0.92, python-dotenv, pydantic)
- [x] `models.py` (Pydantic models with Literal-typed answer fields)
- [x] `prompt.py` (translation map + builder)
- [x] `main.py` (`AsyncAnthropic`, `/api/analyze`, `/health`, static mount last)
- [x] `.env.example`

---

## Phase 2 — Local end-to-end run ✅

- [x] `npm install` in `frontend/` (clean install)
- [x] `uv venv && uv pip install -r requirements.txt` in `backend/` (Python 3.12.12 venv)
- [x] `backend/.env` populated with real `ANTHROPIC_API_KEY`
- [x] Backend boots on :8000 — `/health` → `{"status":"ok"}`
- [x] Frontend boots on :5173 — Vite dev server returns 200
- [x] **Live Anthropic round-trip verified** — POST `/api/analyze` with the
      graph-RAG scenario returned a clean 3-sentence paragraph naming three
      drivers + operational guidance (model: `claude-sonnet-4-6`)
- [x] **Browser walkthrough confirmed (golden path):**
  - 12-question wizard renders and navigates correctly across all 3 steps
  - Results page renders hero, fit-score bars, deployment paradigm, AI reasoning, why-bullets, warnings
  - **Back button preserves answers** (user-validated as correct behavior)
  - **Start Over resets cleanly** (user-validated as correct behavior)
  - **Close Call confidence** (< 8 gap) surfaces runner-up name (user-validated)

---

## Phase 3 — Polish + stretch features ✅

### Confirmed scope

- [x] **UX:** Snap to top on step transitions (Next / Back / Start Over). Implemented via `useEffect` on `step` in `RAGAdvisor.jsx`.

### Stretch — implemented (Option A)

- [x] Ported `ARCHS` pipeline data into [frontend/src/data/pipelines.js](frontend/src/data/pipelines.js) — 5 paradigms (local, hybrid, cloud, graph, agentic) × 13–18 stages each, including LOC and DELTA badge metadata.
- [x] `getPipelineKey(recommendation, sensitivity)` helper in [utils/recommend.js](frontend/src/utils/recommend.js) maps `standard × sensitivity` → local/hybrid/cloud; graph/agentic map straight through.
- [x] [PipelineView.jsx](frontend/src/components/PipelineView.jsx) renders the canonical pipeline for the recommended architecture inline on the results page (numbered spine, badges per stage, optional flag, narrowed to the 620px column).
- [x] [PipelineEvaluation.jsx](frontend/src/components/PipelineEvaluation.jsx) — second async LLM panel below the pipeline, same skeleton-and-fallback pattern as [AIReasoning.jsx](frontend/src/components/AIReasoning.jsx).
- [x] Backend `POST /api/evaluate-pipeline` — new endpoint that takes the same payload as `/api/analyze` plus `pipeline_key`, returns a 3-4 sentence stage-aware evaluation. `EVAL_SYSTEM_PROMPT` instructs Claude to reference stage names verbatim.
- [x] `PIPELINE_SUMMARIES` dict in [prompt.py](backend/prompt.py) — one sentence-cluster per pipeline key. Backend owns the canonical description; frontend doesn't ship pipeline bytes per request.
- [x] Live smoke test passed: graph-RAG scenario returned a substantive evaluation that named specific stages by name ("graph construction", "LLM entity & relationship extraction", "LLM query classification") and gave concrete operational guidance tied to the user's high-sensitivity + known-strategy constraints.
- [x] Dropped the now-redundant "Load the rag-architectures file" reference note from the results page.

---

## Phase 4 — COA 1: Public deploy + polish (next up)

**Goal:** Ship a polished public version a stranger can land on, complete, share, and that produces real usage signal. ~30 hrs across 2-3 weekends.

**High-level milestones:**

- [ ] Railway deploy + custom domain (DNS, env vars, healthcheck verified)
- [ ] Landing page + methodology / about page (so "who are you" isn't a mystery)
- [ ] `localStorage` persistence (survive page refresh)
- [ ] Shareable results link (answers encoded in URL hash)
- [ ] Print-to-PDF stylesheet (executive hand-off path)
- [ ] Anonymous analytics (completion rates, recommendation distribution, drop-off step)
- [ ] Brand basics: favicon, OG / Twitter meta tags, `<title>`, `/privacy`
- [ ] Feedback widget on results page
- [ ] Launch on 1-2 aggregators (Show HN, relevant subreddit) + personal channels

Detailed task tree, design questions, and exit criteria live in [IMPLEMENTATION_PLAN.md § Phase 4](IMPLEMENTATION_PLAN.md#phase-4--coa-1--public-deploy--polish).

---

## Phase 5 — COA 2: Accounts + Save + Share + Export ⏸

**Trigger:** Phase 4 traction signal met. **Estimated time:** 1-2 months at 20 hrs/week.

Conditional on Phase 4 producing real demand. High-level scope: passwordless auth, persistent assessments, team workspaces, branded PDF export, Mermaid / draw.io pipeline export, public read-only share URLs.

See [IMPLEMENTATION_PLAN.md § Phase 5](IMPLEMENTATION_PLAN.md#phase-5--coa-2--accounts--save--share--export-conditional) for sketch + open design questions.

---

## Phase 6 — COA 3: Cost calculator + Vendor DB + Code scaffolds ⏸

**Trigger:** Phase 5 has paying customers and demand for more. **Estimated time:** 3-6 months, possibly a second engineer.

The "killer feature" tier. Vendor pricing database with dated entries, cost-per-month estimator per architecture, build-vs-buy table per stage, "generate starter repo" via Claude with RAGAS evals pre-wired, compliance filtering.

See [IMPLEMENTATION_PLAN.md § Phase 6](IMPLEMENTATION_PLAN.md#phase-6--coa-3--cost-calculator--vendor-db--code-scaffolds-conditional) for sketch.

---

## Session log

### 2026-05-13 — Phase 1 (scaffolding)

- Full project structure scaffolded per CLAUDE.md spec: Vite frontend, FastAPI backend, Railway single-service config.
- Split monolithic `rag-advisor.jsx` into 11 modules under `frontend/src/` (data, utils, styles, components).
- **Model ID bumped** `claude-sonnet-4-20250514` → `claude-sonnet-4-6` (original retires 2026-06-15). Logged in CLAUDE.md change table.
- **API config:** `effort: "low"` + `thinking: {"type": "disabled"}` for the analyze call. Sonnet 4.6 defaults to `effort: "high"`, which is overkill for a 2-3 sentence paragraph; the low-effort + no-thinking combo is exactly what Anthropic's migration guide recommends for short content generation.
- **Async client (`AsyncAnthropic`)** — FastAPI routes are `async def`, so the sync client would block the event loop.
- **No prompt caching.** Shared prefix (system prompt) is well under the 2048-token minimum for Sonnet 4.6. Revisit if system prompt grows.
- **Legacy artifacts** (`rag-advisor.jsx`, `rag-architectures.jsx`) kept at project root as reference source-of-truth. Will archive after Phase 4.

### 2026-05-13 — Phase 2 (local run)

- Adopted **uv** for backend dependency management. Chose lightweight path: kept `requirements.txt`, swapped `pip` → `uv pip install -r requirements.txt`. Railway deploy still uses Nixpacks/pip; uv is local-dev only.
- **Discovered:** `uv run` does **not** auto-discover `.venv/` without a `pyproject.toml`. Without the project anchor, `uv run` falls back to the system Python (3.14 here, not the 3.12 venv). Workaround: invoke `.venv/Scripts/uvicorn` directly in the dev script. If we ever move to multi-OS dev or want cross-platform `npm run dev`, adding a minimal `pyproject.toml` makes `uv run` work natively.
- **Live API call validated.** Graph-RAG scenario produced a faithful response identifying the three drivers (relationship importance, multi-hop, cross-ref density), the economic precondition (flexible indexing + stable corpus), and operational guidance (on-prem Neo4j, traversal-depth tuning).
- **Three user-validated behavior calls** captured under Phase 2 above (back-preserves, reset-cleans, close-call surfaces runner-up). These are now the de facto spec for the wizard's state model.
- **One UX nit identified:** scroll position remains at bottom after clicking Next. Scheduled for Phase 3.
- **Stretch goal floated:** integrate `rag-architectures.jsx` pipeline data + add LLM evaluation. Approach options being discussed.

### 2026-05-13 — Phase 3 (polish + stretch)

- **Scroll-to-top:** single-line `useEffect(() => window.scrollTo(0, 0), [step])` in `RAGAdvisor.jsx`. Covers Next, Back, Start Over, and the transition into the results page in one place.
- **Stretch — Option A chosen** (canonical pipeline rendered inline + second LLM eval paragraph). Rationale over Option B (per-stage annotations): one-evening build, no structured outputs needed, lower risk; B can be a clean upgrade later. Rationale over Option C (LLM-generated pipeline): keeping a curated reference pipeline eliminates component-name hallucination risk.
- **Backend has its own `PIPELINE_SUMMARIES`** (not shipped from the frontend per request). The frontend sends `pipeline_key` only; backend describes the pipeline procedurally for the LLM. Keeps requests small and the prompt single-source-of-truth.
- **Two parallel API calls** rather than one combined endpoint, so the two LLM panels render with independent loading states and fail independently. Cost: ~2× the LLM calls per results view, trivial at this scale.
- **`uvicorn --reload` quirk:** after editing both `models.py` and `main.py` simultaneously, WatchFiles detected the change but the worker didn't fully swap routes — `/api/evaluate-pipeline` returned 404 until I killed the process and restarted. If this recurs, restart manually rather than relying on `--reload` for new-route registration.

### 2026-05-13 — Strategy discussion (COA 1 → 2 → 3 path)

Working session on what it would take to operationalize this into a professional tool. Walked through 4 courses of action ("scoop of chocolate" to "grab a Snickers") with effort estimates and business-model implications.

**Owner decisions captured:**
- **Ceiling = COA 3** (Cost calculator + Vendor DB + Code scaffolds). COA 4 (marketplace + consulting network) ruled out — full company-shaped build is out of scope for available time + resources.
- **The cost calculator is the killer feature.** Specifically called out as the thing that would make this tool genuinely valuable to a CTO or AI lead at a small company evaluating RAG.
- **Path:** Ship COA 1, measure traction, then decide on COA 2 → 3 based on data, not intuition.

**Owner self-reported preferences** (relevant for tooling all future decisions):
- *"Rather scale than talk about it. Letting the product do the talking is more my style."* → Implication: GTM is product-led, not content-led. Lean into polish and analytics over thought leadership.
- *"Rather ship something polished to strangers because I don't legitimately know who'd be interested. Maximum participation is the initial goal."* → Implication: optimize for low-friction first-touch (no auth gate, fast TTFB, share-by-link). Don't prematurely add account walls.
- *"If no one finished, I'd say 'that was fun to build, onto the next project.'"* → Implication: low-sunk-cost, healthy walk-away threshold. Build the exit criteria into Phase 4 explicitly and respect them.

**Capacity:** ~20 hrs/week for the next 3 months (~240 hrs total). Sufficient for COA 1 and start of COA 2.

**Phase 4 exit criteria proposed** (move to Phase 5 on any of):
- 50+ completed assessments in first 30 days, OR
- 5+ unsolicited "this helped" responses, OR
- 1+ meaningful inbound (consulting lead, paid-interest, talk invite).

**Wind-down criterion proposed:** < 20 completed assessments in 60 days AND no unsolicited interest. Owner endorsed walking in that case.

---

### 2026-05-14 — Phase 4 Sprint 2B (privacy, terms, feedback, analytics, print)

Four launch-prep tasks shipped together:

- **4.11 Privacy + Terms pages** — `components/Privacy.jsx` and `components/Terms.jsx`. Both use the new `components/longform.jsx` shared kit (H1/H2/P/Strong/Em/Link/Bullets/NumberedList/BrandStrip/BackLink/PageFooter) refactored out of Methodology so all four long-form pages have identical typography. The Landing footer was also swapped to use `PageFooter` for consistency, so every page now has Methodology / Privacy / Terms / GitHub links.
- **4.10 Feedback widget** — `components/FeedbackWidget.jsx` at the bottom of the results page (just above Start Over). Two-stage UX: thumbs-up/down click immediately POSTs to `/api/feedback` (so the signal lands even if the user closes the tab), then a textarea + Send for an optional comment. Backend endpoint logs every submission to stdout (Railway log dashboard) and *optionally* forwards to a Discord webhook if `FEEDBACK_DISCORD_WEBHOOK_URL` is set. Rate-limited at 10/hour per IP. `sessionStorage` prevents the widget re-appearing after submission within the same session.
- **4.9 Analytics** — `utils/analytics.js`, Plausible-compatible (also works with Umami, Pirsch, any compatible drop-in). **Gated on `VITE_PLAUSIBLE_DOMAIN` env var** — no script loads unless the var is set, so local dev and the no-paid-service path stay zero-overhead. Optional `VITE_ANALYTICS_HOST` env var for self-hosted backends. Five custom events instrumented: `Wizard Start`, `Step Complete` (props: step), `Assessment Complete` (props: recommendation + confidence), `Share Link Copied`, `Feedback Submitted` (props: helpful yes/no).
- **4.8 Print-to-PDF** — `@media print` rules in `index.html`. Flips dark theme to light backgrounds for ink-friendly output, dims dark text to readable contrast on paper, hides interactive elements (`button`, `textarea`, anything with `.print-hide` class), keeps `article` direct children together with `page-break-inside: avoid`, Letter @ 1.5cm margins. FeedbackWidget root + ShareLinkButton wrapper tagged `.print-hide` so the PDF excludes interactive cruft. The signal-bearing accent colors (architecture color in hero, fit-score bar fills, badge colors) are deliberately preserved — those are information, not decoration.
- **Bundle impact:** JS 219 → 229 KB (+10 KB) for two pages, the feedback widget, analytics util, and the longform refactor. HTML 2.41 → 4.21 KB (the print CSS).

Two new env vars unlock optional features:
- `VITE_PLAUSIBLE_DOMAIN=<your-domain>` on the **frontend** (set in Railway service variables; Vite reads at build time) → enables Plausible-compatible analytics.
- `FEEDBACK_DISCORD_WEBHOOK_URL=<webhook>` on the **backend** → forwards feedback to Discord. Without it, feedback still works (just logs to Railway stdout).

Sprint 2B fully tested locally; production verification will happen on push as usual.

### 2026-05-14 — Phase 4 Sprint 2A (landing + methodology + SPA fallback)

- **4.4 Landing page** — `components/Landing.jsx`. Hero with headline + sub + CTA, three "what you get" cards, "who it's for" persona list, "how it works" with deep-link to methodology, footer with GitHub + license. First-time visitors at `/` see this; returning users with localStorage progress or share-link visitors skip directly to wizard / results.
- **4.5 Methodology page** — `components/Methodology.jsx`. Long-form credibility piece (~1900 words across 8 sections). Includes real weight-matrix excerpts, the deployment-paradigm decision table, explicit-limitations section, and deep-links to specific GitHub source files (`scoring.js`, `recommend.js`, `pipelines.js`). "About the author" section flagged `[TODO]` — owner needs to write their own bio.
- **Storage refactor** — extracted `loadFromStorage` / `saveToStorage` / `clearStorage` / `hasSavedProgress` from `RAGAdvisor.jsx` to `utils/storage.js` so `App.jsx` can decide landing-skip without importing the wizard.
- **Routing** — pathname-based, no router dep. `App.jsx` reads `window.location.pathname` and picks the view. Anchors (`<a href="/methodology">`) trigger full page reloads which is fine given the small bundle.
- **Backend SPA fallback** — discovered during pre-push smoke test that `/methodology` returned 404 from FastAPI: Starlette's built-in `StaticFiles(html=True)` only serves `index.html` at the directory root, not as a catch-all. Added `SPAStaticFiles` subclass that catches 404s from `super().get_response()` and serves `index.html` instead. Now any non-API path returns the React bundle and lets client-side routing pick the view.
- **Bundle impact:** JS 198 → 219 KB (+21 KB) for two pages worth of components + typography.

### 2026-05-14 — Phase 4 Sprint 1 (localStorage + shareable links + brand basics)

- **4.6 localStorage persistence:** wizard state survives accidental refresh / tab close. Versioned key (`ragAdvisor.v1`) so future schema changes can invalidate stale data cleanly. Graceful degradation if localStorage is disabled (private mode / quota exceeded).
- **4.7 shareable results link:** new `utils/shareLink.js` with base64url-encoded JSON in URL hash. Hydration priority: hash → localStorage → defaults. "Copy share link" button in the hero card with clipboard API + window.prompt fallback. Validation against the answer enums means tampered URLs are silently ignored.
- **4.3 brand + SEO basics (partial):** favicon as three colored dots (green/purple/orange = standard/graph/agentic) on the brand slate. 8 OG tags + Twitter `summary_large_image` card. PEP 723 inline-deps script at `scripts/build_og_image.py` for converting a source screenshot to the 1200x630 OG image — runs via `uv run scripts/build_og_image.py`, no permanent venv install needed.
- **Bundle impact:** JS bundle grew from 195.50 KB → 198.35 KB (+1.4%). HTML grew from 0.57 KB → 2.37 KB (all meta-tag prose). Trivial.
- **Outstanding from Sprint 1:** drop the source screenshot at `frontend/og-source.png`, run the build script, commit the generated `og-image.png`. Until then, social previews will render with the meta-tag text only (no image).

### 2026-05-14 — Phase 4.1 (Railway deploy)

- **GitHub repo created** at https://github.com/NavyDevilDoc/rag-advisor (public, MIT, 6 topic tags). Initial commit `ce4ae14` includes Phases 1-3 + SlowAPI rate limiting (20/hour per IP, X-Forwarded-For aware, smoke-tested locally at a 2/hour test limit producing 200/200/429).
- **Nixpacks fought us twice.** First failure: only set up Node, no Python toolchain. Added `nixpacks.toml` declaring both `node` + `python` providers. Second failure: Python provider set up `python3, gcc` but not pip on PATH ("pip: command not found" persisted).
- **Switched to Dockerfile.** Multi-stage build: `node:20-slim` for frontend (`npm ci && vite build`), `python:3.12-slim` for runtime (`pip install` backend deps, copy backend source + frontend dist into `backend/static/`, run uvicorn). `.dockerignore` keeps the build context lean. Railway's `railway.json` now points at `builder=DOCKERFILE` and only retains healthcheck + restart-policy config.
- **Lesson:** for any multi-language project on Railway, default to a Dockerfile from day one. Nixpacks auto-detection is opinionated and fights non-standard layouts like our `backend/requirements.txt` (not at repo root). The Dockerfile is 17 lines, predictable, faster, and cache-friendly.
- **Live deploy verified visually:** screenshot showed Close Call confidence (Standard 64 / Graph 62 — 2-point gap), runner-up surfacing, deployment paradigm card, AI Reasoning panel rendering a substantive paragraph that correctly synthesized realtime + air-gap + weekly-churn constraints.

---

## Open questions / decisions to revisit

- **Legacy `.jsx` files** at project root — archive after Phase 4 verifies deploy works end-to-end.
- **`pyproject.toml`** — add it later if we want `uv run` / `uv sync` to work without the Windows-specific venv path hack in `package.json`.
- **Exit-criteria thresholds** — the 50 / 5 / 1 numbers are my proposal, not data. Tighten or loosen them based on the launch surface (Show HN, LinkedIn, etc.).
