# IMPLEMENTATION_PLAN.md — RAG Architecture Advisor

> Living document. Detailed task trees, sequencing, and open design decisions
> for upcoming work. Updated in lockstep with [PROGRESS.md](PROGRESS.md)
> (status snapshot + session log) and [CLAUDE.md](CLAUDE.md) (frozen architecture).

---

## Strategic frame

- **Strategic ceiling:** COA 3 (cost calculator + vendor DB + code scaffolds).
  COA 4 (marketplace + consulting network) explicitly ruled out — full
  company-shaped build is out of scope.
- **Approach:** Ship polished public version (COA 1), measure traction with
  real users, decide on COA 2 / 3 from data, not gut.
- **Walk-away criterion:** Owner explicitly endorsed walking if Phase 4
  traction is weak. No sunk-cost obligation to continue.
- **Owner capacity:** ~20 hrs/week, 3-month horizon (~240 hrs total).
- **GTM stance:** Product-led, not content-led. Owner's stated preference is
  *"rather scale than talk about it."* Build for low-friction first-touch and
  maximum participation; defer account walls.

---

## Phase 4 — COA 1 · Public deploy + polish

**Goal:** Ship a polished public version of the tool that a stranger can land
on, complete, share, and that produces real usage signal we can decide Phase 5
on.

**Target launch:** 2-3 weekends from start (~30 hrs).
**Out of scope:** auth, persistence beyond `localStorage`, server-side state,
LLM cost-recovery, vendor pricing. All of those wait for Phase 5+.

### 4.1 — Railway deploy

- [ ] Confirm `railway.json` build command against current frontend
- [ ] Deploy via Railway CLI (`railway up`) or dashboard "deploy from GitHub"
- [ ] Set `ANTHROPIC_API_KEY` in Railway service env vars
- [ ] Set `MODEL` env var if we want to make the model overridable per env (decide below)
- [ ] Verify `/health` returns 200 on `<service>.up.railway.app`
- [ ] Verify wizard works end-to-end on deployed URL
- [ ] Smoke-test both `/api/analyze` and `/api/evaluate-pipeline` against the deployed backend
- [ ] Configure Railway health-check + restart policy (already in `railway.json`)

**Open design questions:**
- Should `MODEL` become an env var so we can A/B Sonnet 4.6 vs Haiku 4.5 in
  production without redeploys? Leaning yes — pulls model selection out of code.
- Do we need a separate "preview" env (Railway PR previews) before going to prod?
  Probably not at this scale — single prod env is fine.

### 4.2 — Custom domain

- [ ] Pick name. Candidates so far: `ragsherpa.dev`, `pickyourrag.com`,
      `rag-advisor.dev`, `ragstack.dev`, `ragdecision.com`. (Owner to choose.)
- [ ] Register via Cloudflare Registrar or Namecheap (Cloudflare = at-cost pricing)
- [ ] Configure DNS to Railway (CNAME or `A` records per Railway docs)
- [ ] Force HTTPS, verify cert provisioned automatically by Railway
- [ ] Add `www` → apex redirect (or apex → `www`, owner preference)

**Open:** Will owner want a `.com` for legitimacy, or is `.dev` fine for a
technical audience? `.dev` is cheaper and signals "for developers."

### 4.3 — Brand + SEO basics

- [ ] Favicon — simple monogram or geometric mark. Generate the full set
      (16×16, 32×32, 180×180 apple-touch, SVG, manifest.json) via realfavicongenerator.net
- [ ] `<title>` and meta description in [frontend/index.html](frontend/index.html)
- [ ] Open Graph tags (`og:title`, `og:description`, `og:image`, `og:url`, `og:type=website`)
- [ ] Twitter card tags (`twitter:card=summary_large_image`)
- [ ] Generate an OG image (1200×630). Either: hand-made in Figma, or a static
      "preview of the wizard" screenshot, or generated via og-image services
- [ ] `robots.txt` allowing all
- [ ] `sitemap.xml` — just `/`, `/methodology`, `/privacy` for now

### 4.4 — Landing page (above the wizard)

Current state: `RAGAdvisor` renders the wizard as the entire page, no preamble.
We need a marketing hero above it explaining what this is, who it's for, and
what they'll get.

- [ ] New `frontend/src/components/Landing.jsx` (or refactor into `pages/Home.jsx`
      + `pages/Methodology.jsx` if we want light routing)
- [ ] Hero: headline ("Find your optimal RAG architecture in 12 questions"), subhead, CTA button
- [ ] Three-card "what you get": fit scores, deployment recommendation, AI-generated reasoning
- [ ] Sample-result screenshot (zoomed snippet of the AI Reasoning panel, ideally)
- [ ] Trust signal row: "Curated by [name], evaluates 5 RAG paradigms across 13–18 pipeline stages each"
- [ ] "Start the assessment" CTA → scrolls to or routes to the wizard

**Open design questions:**
- One-page (landing on top, wizard below, scroll) vs two-page with routing
  (`/` landing, `/assess` wizard)? **Leaning one-page** — simpler, no router
  added, landing acts as a hero for the embedded wizard. Decide before
  starting 4.4.
- Should the wizard load lazily so the landing page is super fast TTFB?
  Probably yes; React.lazy + Suspense around `RAGAdvisor`.

### 4.5 — Methodology / about page

- [ ] Long-form write-up of the scoring weights — for each of the 12 questions,
      explain what drives which architecture and why. ~1500 words.
- [ ] Pipeline data provenance: where the stage data comes from, when it was
      last updated, what's intentionally opinionated
- [ ] Short owner bio + "why I built this"
- [ ] Link to GitHub repo (if making public)
- [ ] Note that AI Reasoning + Pipeline Evaluation use `claude-sonnet-4-6`

**Note:** This is the single most important page for credibility. A CTO
deciding whether to trust the recommendation will read this. Spend real
writing effort here.

### 4.6 — `localStorage` persistence

- [ ] In `RAGAdvisor.jsx`, `useEffect` writes `answers` and `step` to
      `localStorage` on change
- [ ] On mount, restore from `localStorage` if present
- [ ] Clear on Start Over (already wired — just verify localStorage is cleared too)
- [ ] Schema version key so future changes don't load stale state

### 4.7 — Shareable results link

- [ ] Add "Copy link" button on results page (next to or above Start Over)
- [ ] Encode answers into URL hash. **Encoding choice:**
  - Option A: JSON → base64url. Simple but ~250 chars.
  - Option B: Bit-packed (each of 12 questions has 3 choices = 2 bits → 24 bits → 4 chars + 12 bytes scores). Compact but fragile if we add questions.
  - **Leaning A** for now (simple, robust against future question additions).
- [ ] On page load, if hash present → decode → set answers → jump to results
- [ ] Test maximum payload + special chars; make sure URL is paste-safe across email clients

### 4.8 — Print-to-PDF stylesheet

- [ ] Add `@media print` rules in a new `styles/print.css` (or inline in the
      results component if simpler)
- [ ] Hide: nav buttons, copy-link button, Start Over, feedback widget
- [ ] Page-break controls: keep hero + scores on first page, force page break
      before pipeline section
- [ ] Optimize colors for print (dark theme might burn ink; consider an inverted
      print stylesheet)
- [ ] Test in Chrome / Firefox / Safari print preview
- [ ] Verify pipeline diagram readable on Letter and A4

**Open:** Do we want a "Download PDF" button that uses browser print, or do
we want server-side rendering via Puppeteer? **Leaning browser print** — zero
server complexity, works offline, no Lambda cold-start. Owner can hit Ctrl+P
or we add a button that calls `window.print()`.

### 4.9 — Anonymous analytics

- [ ] Choose analytics provider. Options:
  - Plausible (most privacy-friendly, self-hostable, ~$9/mo)
  - Umami (free if self-hosted, ~$10/mo cloud)
  - Pirsch (similar to Plausible)
  - **Leaning Plausible** — most polished, EU-based, no cookies, no GDPR banner needed.
- [ ] Add script tag to `index.html`
- [ ] Define custom events to track:
  - `wizard_start`
  - `step_complete` with `step_number`
  - `assessment_complete` with `recommendation` + `confidence`
  - `share_link_copied`
  - `pdf_print_attempted` (window.matchMedia('print') listener)
  - `feedback_submitted` with `helpful: bool`
- [ ] Set up dashboard with the five questions that matter:
  1. How many people start the wizard?
  2. What's the completion rate by step?
  3. Which architecture gets recommended most?
  4. What's the close-call rate (gap < 8)?
  5. What's the share-link copy rate?
- [ ] Document data collection in `/privacy` page

### 4.10 — Feedback widget

- [ ] Simple "Did this help? 👍 / 👎 + optional one-line text" at bottom of results
- [ ] POST to a serverless endpoint or Tally / Google Form / Plausible custom event
- [ ] **Leaning:** add a new `POST /api/feedback` endpoint that writes to a
      JSON file or queues to a Discord webhook — minimal infra, owner sees
      feedback in near-realtime
- [ ] Show "Thanks!" state after submission; don't ask again in the same session
      (sessionStorage flag)

### 4.11 — Privacy / Terms pages

- [ ] `/privacy` — what we collect (analytics, no PII, anonymous feedback), how
      Anthropic API processes answers, no retention beyond the API call,
      no third-party sale
- [ ] `/terms` — boilerplate "as-is, no warranty, this is advisory only,
      consult a real engineer before betting your company on a recommendation"
- [ ] Footer link from every page

### 4.12 — Launch

- [ ] All of 4.1–4.11 verified on deployed URL
- [ ] Pre-launch smoke test: full wizard run on mobile (iOS Safari + Android Chrome)
- [ ] Pre-launch smoke test: full wizard run with throttled connection (DevTools "Slow 4G")
- [ ] Submit to Show HN (Saturday morning EST is the recommended slot)
- [ ] Cross-post to: r/MachineLearning, r/LocalLLaMA, r/LangChain
- [ ] Personal channels: LinkedIn, Bluesky / Twitter
- [ ] Watch analytics first 48 hrs; respond to any feedback within 24 hrs
- [ ] Add a `LAUNCH_NOTES.md` file capturing what surfaced, what broke, what
      to fix in v1.1

### Phase 4 exit criteria → trigger Phase 5

Move to **Phase 5 (COA 2)** if **any** of:
- 50+ completed assessments in first 30 days post-launch
- 5+ unsolicited "this helped" responses (DMs, emails, comments, replies)
- 1+ meaningful inbound (consulting lead, paid-interest signal, conference talk invite, company asking how to deploy this internally)

**Wind down** if:
- < 20 completed assessments in 60 days, AND
- No unsolicited interest beyond friends-of-the-author

Numbers are a proposal, not data. Tighten/loosen after the actual launch
surface area is known.

---

## Phase 5 — COA 2 · Accounts + Save + Share + Export (conditional)

**Trigger:** Phase 4 exit criteria met.
**Estimated time:** 1-2 months at 20 hrs/week.

### High-level scope

- Passwordless email auth (magic links via Resend)
- Postgres (Supabase if we want auth+db+RLS bundled, or Railway managed PG)
- Persistent assessments per user
- Team workspaces with multi-user editing + comment threads per question
- Branded PDF export with executive-summary first page
- Mermaid + draw.io diagram exports of the pipeline
- Public read-only share URLs (like Notion shares — slug-based, not hash-based)

### Open design questions (revisit when we start Phase 5)

- **Free tier vs paid from day one?** Two camps:
  - Free at launch, monetize later → maximizes Phase 5 signal collection
  - $9/mo individual + $29/mo team from day one → forces revenue conversation early
- **Auth provider:** Supabase Auth (bundled with the DB we'd likely choose anyway) vs Clerk vs roll-our-own with Resend
- **Workspace model:** account-per-email vs workspace-with-invites. Probably workspace from the start — adding it later is migration hell.
- **PDF rendering:** client-side via `window.print` (matches Phase 4 approach) or server-side via Puppeteer/Playwright (better consistency, more infra)
- **LLM cost recovery:** free tier creates a unit-economics question. At what completion rate does each free user cost us > $0.10 in LLM calls?

### Phase 5 exit criteria → trigger Phase 6

Move to **Phase 6 (COA 3)** if:
- 10+ paying teams ($X/mo each, threshold TBD)
- Active feature requests asking for cost numbers and code scaffolds

Tighten when we have real Phase 5 pricing data.

---

## Phase 6 — COA 3 · Cost calculator + Vendor DB + Code scaffolds (conditional)

**Trigger:** Phase 5 has paying customers and explicit demand for these features.
**Estimated time:** 3-6 months, possibly a second engineer.

### High-level scope

The "killer feature" tier per owner. What makes this commercially serious:

- **Cost calculator.** Given corpus size + query volume + recommended pipeline →
  estimated monthly $ across 2-3 vendor stacks. Numbers refreshed quarterly,
  dated transparently.
- **Vendor pricing database.** Manually curated, transparent, dated. Pinecone,
  Qdrant Cloud, Weaviate Cloud, OpenAI, Anthropic, Cohere, Neo4j Aura, AWS
  Textract, Azure Document Intelligence, etc. "Last verified: YYYY-MM-DD"
  on every entry.
- **Build-vs-buy table per stage.** For each pipeline stage, show "use this
  managed service ($X/mo) or self-host (Y engineer-weeks + $Z infra/mo)."
- **"Generate starter repo" button.** Claude generates a GitHub template per
  recommended architecture: FastAPI + chosen vector DB + chosen embedding +
  Anthropic Claude + RAGAS eval suite pre-wired. Real code, real tests,
  deploys cleanly.
- **Compliance filter.** Flag user requirements (SOC2, HIPAA, FedRAMP, GDPR) →
  filter vendor recommendations to compliant options only.

### Risks specific to Phase 6

- Keeping vendor pricing fresh is a grind. Stale prices destroy credibility.
  Need a quarterly audit ritual or it slowly rots.
- Code-scaffold quality has to be high. Buggy generated repos destroy the
  "professional tool" brand fast.
- This phase actually justifies $99–999/mo pricing tiers, but only if the
  underlying data is durable and the scaffolds are best-in-class.

---

## Tracked deferred items (cross-phase)

- **`pyproject.toml` migration** — would let `uv run` work cross-platform
  without the Windows-specific venv path hack in `package.json`. Low
  priority unless we get a non-Windows contributor or want to publish the
  backend as installable.
- **Archive legacy `.jsx` files** at project root once Phase 4 deploys
  cleanly and we've confirmed nothing imports from them.
- **Test suite.** We have zero automated tests. Acceptable for prototype;
  unacceptable for Phase 5+. Add at least: scoring engine unit tests
  (Vitest), API smoke tests (pytest + httpx). Track here, schedule for
  early Phase 5.
- **Pydantic v2 strict mode** if we add untrusted external inputs (e.g.,
  signed share-link payloads in Phase 5).

## Resolved (since plan first written)

- **Rate limiting** on `/api/*` endpoints — pulled into the initial Phase 4
  commit rather than left deferred. SlowAPI's `Limiter` with a custom
  `get_real_ip` key function that prefers `X-Forwarded-For` (set by
  Railway's proxy) over `request.client.host` (the proxy itself). 20/hour
  per IP per endpoint. `/health` left unlimited so Railway's healthcheck
  isn't throttled. Verified locally: 3 requests at a 2/hour test limit
  produced `200, 200, 429` as expected.

---

## Decision log (forward-looking design decisions)

Decisions made for upcoming work but not yet implemented. When implemented,
move to the CLAUDE.md change log if it's an architectural choice, or to a
PROGRESS.md session log entry if it's tactical.

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-05-13 | Strategic ceiling = COA 3 | Owner doesn't have capacity for a full company-shaped build (COA 4). Cost calculator + vendor DB + code scaffolds is the durable feature set worth optimizing for. |
| 2026-05-13 | Phase 4 = ~30 hrs, 2-3 weekends | Real budget tied to owner's 20 hrs/week × 3-month horizon. Leaves 200+ hrs for whichever Phase 5+ direction the data points to. |
| 2026-05-13 | Phase 4 trigger to Phase 5 = 50/5/1 (completions/thanks/inbound) | Proposal, not yet tuned to data. Re-baseline after launch. |
| 2026-05-13 | Path is product-led, not content-led | Owner's stated preference: *"rather scale than talk about it."* Implication: optimize Phase 4 for discovery + polish, not for blog content / thought leadership. |
| 2026-05-13 | No auth gate in Phase 4 | Owner's stated preference: maximum first-touch participation. Account walls go in Phase 5 only if traction justifies them. |
